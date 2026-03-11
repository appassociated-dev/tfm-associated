import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GenerateSubscriptionChargesCommand } from './generate-subscription-charges.command';
import { ChargeResponseDto } from '../dtos/charge-response.dto';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import { CHARGE_REPOSITORY, ChargeRepository } from '../../domain/repositories/charge.repository';
import {
  FISCAL_YEAR_QUERY_PORT,
  FiscalYearQueryPort,
} from '../../domain/ports/fiscal-year-query.port';
import {
  TREASURY_OUTBOX_PUBLISHER,
  TreasuryOutboxPublisher,
} from '../ports/treasury-outbox.publisher';
import { ProrataCalculator } from '../../domain/services/prorata-calculator';
import { Charge } from '../../domain/entities/charge';
import { ChargeDescription } from '../../domain/value-objects/charge-description';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { ChargeGeneratedEvent } from '../../domain/events/charge-generated.event';
import {
  MemberAccountNotFoundError,
  SubscriptionNotFoundError,
  FeePlanNotFoundError,
} from '../../domain/exceptions';

/**
 * Handler del comando de generación de cargos prorrateados para una suscripción.
 *
 * Se usa al crear una nueva suscripción a mitad de ejercicio fiscal
 * para generar los cargos correspondientes a los meses restantes.
 */
@CommandHandler(GenerateSubscriptionChargesCommand)
export class GenerateSubscriptionChargesHandler implements ICommandHandler<GenerateSubscriptionChargesCommand> {
  private readonly logger = new Logger(GenerateSubscriptionChargesHandler.name);

  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(CHARGE_REPOSITORY)
    private readonly chargeRepository: ChargeRepository,
    @Inject(FISCAL_YEAR_QUERY_PORT)
    private readonly fiscalYearQueryPort: FiscalYearQueryPort,
    @Inject(TREASURY_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: TreasuryOutboxPublisher,
  ) {}

  async execute(command: GenerateSubscriptionChargesCommand): Promise<ChargeResponseDto[]> {
    const { tenantId, memberAccountId, subscriptionId } = command;

    // 1. Establecer tenantId en todos los repositorios/puertos (ADR-002)
    this.memberAccountRepository.setTenantId(tenantId);
    this.feePlanRepository.setTenantId(tenantId);
    this.chargeRepository.setTenantId(tenantId);
    this.fiscalYearQueryPort.setTenantId(tenantId);

    // 2. Buscar MemberAccount
    const accountIdVo = MemberAccountId.fromString(memberAccountId);
    const account = await this.memberAccountRepository.findById(accountIdVo);
    if (!account) {
      throw new MemberAccountNotFoundError(memberAccountId);
    }

    // 3. Buscar la suscripción activa
    const subscriptionIdVo = SubscriptionId.fromString(subscriptionId);
    const subscription = account.findSubscriptionById(subscriptionIdVo);
    if (!subscription || !subscription.isActive()) {
      throw new SubscriptionNotFoundError(subscriptionId);
    }

    // 4. Buscar el plan de la suscripción
    const feePlan = await this.feePlanRepository.findById(subscription.feePlanId);
    if (!feePlan || !feePlan.active) {
      throw new FeePlanNotFoundError(subscription.feePlanId.toValue());
    }

    // 5. Obtener ejercicio fiscal activo
    const fiscalYear = await this.fiscalYearQueryPort.findActive();
    if (!fiscalYear) {
      this.logger.warn(
        `No hay ejercicio fiscal abierto para tenant ${tenantId}. No se generan cargos.`,
      );
      return [];
    }

    // 6. Calcular el mes final del ejercicio fiscal
    const fiscalYearEndMonth = fiscalYear.endDate.getMonth() + 1; // getMonth() es 0-based

    // 7. Calcular cargos prorrateados con el Domain Service
    const registrationMonth = subscription.registrationDate.getMonth() + 1;
    const billingYear = subscription.registrationDate.getFullYear();

    const proratedResults = ProrataCalculator.calculateProratedCharges(
      {
        subscriptionId: subscriptionId,
        effectiveAmount: subscription.effectiveAmount,
        registrationDate: subscription.registrationDate,
      },
      {
        billingMonths: [...feePlan.billingMonths.months],
        amount: feePlan.amount,
        type: feePlan.type.value,
      },
      registrationMonth,
      fiscalYearEndMonth,
    );

    // 8. Para cada resultado, verificar duplicados y crear Charge
    const charges: Charge[] = [];
    const events: ChargeGeneratedEvent[] = [];

    for (const proratedCharge of proratedResults) {
      // Verificar que no existe cargo duplicado
      const existing = await this.chargeRepository.findBySubscriptionAndPeriod(
        subscriptionIdVo,
        proratedCharge.billingMonth,
        billingYear,
      );
      if (existing) {
        this.logger.debug(
          `Cargo ya existente para suscripción ${subscriptionId}, mes ${proratedCharge.billingMonth}/${billingYear}. Omitido.`,
        );
        continue;
      }

      // Crear fechas del periodo
      const issueDate = new Date(billingYear, proratedCharge.billingMonth - 1, 1);
      const dueDate = new Date(billingYear, proratedCharge.billingMonth, 0);

      // Crear descripción del cargo
      const descriptionText = proratedCharge.isProrated
        ? `Cargo prorrateado ${proratedCharge.billingMonth.toString().padStart(2, '0')}/${billingYear}`
        : `Cargo ${proratedCharge.billingMonth.toString().padStart(2, '0')}/${billingYear}`;

      const descriptionResult = ChargeDescription.create(descriptionText, fiscalYear.id);
      if (!descriptionResult.ok) {
        this.logger.error(`Error creando descripción: ${descriptionResult.error.message}`);
        continue;
      }

      const charge = Charge.create({
        subscriptionId,
        baseAmount: proratedCharge.baseAmount,
        finalAmount: proratedCharge.finalAmount,
        description: descriptionResult.value,
        billingMonth: proratedCharge.billingMonth,
        billingYear,
        issueDate,
        dueDate,
        isProrated: proratedCharge.isProrated,
        isManual: false,
      });

      charges.push(charge);

      events.push(
        new ChargeGeneratedEvent({
          chargeId: charge.id.toValue(),
          memberAccountId,
          memberId: account.memberId,
          subscriptionId,
          amount: proratedCharge.finalAmount.amount,
          billingMonth: proratedCharge.billingMonth,
          billingYear,
          dueDate,
        }),
      );
    }

    // 9. Persistir cargos
    if (charges.length > 0) {
      await this.chargeRepository.saveMany(charges);
    }

    // 10. Publicar eventos al outbox
    if (events.length > 0) {
      await this.outboxPublisher.publish(tenantId, events);
    }

    // 11. Retornar DTOs de respuesta
    return charges.map((charge) => ChargeResponseDto.fromDomain(charge, feePlan.name));
  }
}
