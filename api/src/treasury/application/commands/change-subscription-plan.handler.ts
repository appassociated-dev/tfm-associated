import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChangeSubscriptionPlanCommand } from './change-subscription-plan.command';
import { SubscriptionResponseDto } from '../dtos/subscription-response.dto';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  INTEGRATION_EVENT_PUBLISHER,
  IntegrationEventPublisher,
} from '../../../shared/application/ports/integration-event.publisher';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { Discount } from '../../domain/value-objects/discount';
import { FeeSubscription } from '../../domain/entities/fee-subscription';
import {
  MemberAccountNotFoundError,
  FeePlanNotFoundError,
  SubscriptionNotFoundError,
} from '../../domain/exceptions';

/** Respuesta del cambio de plan con datos de ambas suscripciones. */
export interface ChangePlanResponseDto {
  closedSubscription: SubscriptionResponseDto;
  newSubscription: SubscriptionResponseDto;
}

/**
 * Handler del comando de cambio de plan de suscripción.
 * Cierra la suscripción actual con motivo PLAN_CHANGE y crea una nueva
 * con el plan indicado, manteniendo opcionalmente el descuento.
 */
@CommandHandler(ChangeSubscriptionPlanCommand)
export class ChangeSubscriptionPlanHandler implements ICommandHandler<ChangeSubscriptionPlanCommand> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly outboxPublisher: IntegrationEventPublisher,
  ) {}

  async execute(command: ChangeSubscriptionPlanCommand): Promise<ChangePlanResponseDto> {
    // 0. Establecer tenantId en repositorios (ADR-002)
    this.memberAccountRepository.setTenantId(command.tenantId);
    this.feePlanRepository.setTenantId(command.tenantId);

    // 1. Buscar cuenta de socio
    const accountId = MemberAccountId.fromString(command.memberAccountId);
    const memberAccount = await this.memberAccountRepository.findById(accountId);
    if (!memberAccount) {
      throw new MemberAccountNotFoundError(command.memberAccountId);
    }

    // 2. Verificar que la suscripción actual existe y está activa
    const currentSubId = SubscriptionId.fromString(command.currentSubscriptionId);
    const currentSubscription = memberAccount.findSubscriptionById(currentSubId);
    if (!currentSubscription || !currentSubscription.isActive()) {
      throw new SubscriptionNotFoundError(command.currentSubscriptionId);
    }

    // 3. Buscar el nuevo plan de cuota (error si no existe o inactivo)
    const newFeePlanId = FeePlanId.fromString(command.newFeePlanId);
    const newPlan = await this.feePlanRepository.findById(newFeePlanId);
    if (!newPlan || !newPlan.active) {
      throw new FeePlanNotFoundError(command.newFeePlanId);
    }

    // 4. Determinar descuento: mantener el actual o usar 0 por defecto (MVP)
    let discount: Discount;
    if (command.maintainDiscount) {
      discount = currentSubscription.discount;
    } else {
      // Para MVP, usar descuento 0 si no se mantiene el actual
      const discountResult = Discount.create(0, 0);
      if (!discountResult.ok) {
        throw discountResult.error;
      }
      discount = discountResult.value;
    }

    // 5. Crear nueva suscripción con el nuevo plan
    const newSubscription = FeeSubscription.create({
      feePlanId: command.newFeePlanId,
      registrationDate: command.effectiveDate,
      discount,
      feePlanAmount: newPlan.amount,
      personalDiscountReason: command.maintainDiscount
        ? currentSubscription.personalDiscountReason
        : null,
    });

    // 6. Ejecutar cambio de plan en el aggregate (cierra actual + añade nueva)
    const changeResult = memberAccount.changePlan(
      currentSubId,
      newSubscription,
      command.effectiveDate,
      newPlan.type,
    );
    if (!changeResult.ok) {
      throw changeResult.error;
    }

    // 7. Persistir cambios
    await this.memberAccountRepository.save(memberAccount);

    // 8. Publicar eventos de dominio al outbox
    const events = memberAccount.pullDomainEvents();
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }

    // 9. Retornar respuesta con ambas suscripciones
    return {
      closedSubscription: SubscriptionResponseDto.fromDomain(currentSubscription),
      newSubscription: SubscriptionResponseDto.fromDomain(newSubscription),
    };
  }
}
