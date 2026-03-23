import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateSubscriptionCommand } from './create-subscription.command';
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
  MEMBER_TYPE_FEE_PLAN_REPOSITORY,
  MemberTypeFeePlanRepository,
} from '../../domain/repositories/member-type-fee-plan.repository';
import { MEMBER_QUERY_PORT, MemberQueryPort } from '../../domain/ports/member-query.port';
import {
  TREASURY_OUTBOX_PUBLISHER,
  TreasuryOutboxPublisher,
} from '../ports/treasury-outbox.publisher';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { Discount } from '../../domain/value-objects/discount';
import { FeeSubscription } from '../../domain/entities/fee-subscription';
import {
  MemberAccountNotFoundError,
  FeePlanNotFoundError,
  PlanNotAvailableForMemberTypeError,
  DiscountExceedsLimitError,
  ActiveSubscriptionExistsError,
} from '../../domain/exceptions';

/**
 * Handler del comando de creación de suscripción.
 * Valida que la cuenta exista, que el plan esté activo y vinculado al tipo de socio,
 * crea la suscripción con descuentos y publica eventos de dominio.
 */
@CommandHandler(CreateSubscriptionCommand)
export class CreateSubscriptionHandler implements ICommandHandler<CreateSubscriptionCommand> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(MEMBER_TYPE_FEE_PLAN_REPOSITORY)
    private readonly memberTypeFeePlanRepository: MemberTypeFeePlanRepository,
    @Inject(MEMBER_QUERY_PORT)
    private readonly memberQueryPort: MemberQueryPort,
    @Inject(TREASURY_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: TreasuryOutboxPublisher,
  ) {}

  async execute(command: CreateSubscriptionCommand): Promise<SubscriptionResponseDto> {
    // 0. Establecer tenantId en todos los repositorios/puertos (ADR-002)
    this.memberAccountRepository.setTenantId(command.tenantId);
    this.feePlanRepository.setTenantId(command.tenantId);
    this.memberTypeFeePlanRepository.setTenantId(command.tenantId);
    this.memberQueryPort.setTenantId(command.tenantId);

    // 1. Buscar cuenta de socio por ID
    const accountId = MemberAccountId.fromString(command.memberAccountId);
    const memberAccount = await this.memberAccountRepository.findById(accountId);
    if (!memberAccount) {
      throw new MemberAccountNotFoundError(command.memberAccountId);
    }

    // 2. Buscar plan de cuota por ID (error si no existe o está inactivo)
    const feePlanId = FeePlanId.fromString(command.feePlanId);
    const feePlan = await this.feePlanRepository.findById(feePlanId);
    if (!feePlan || !feePlan.active) {
      throw new FeePlanNotFoundError(command.feePlanId);
    }

    // 3. Verificar que el plan esté vinculado al tipo de socio
    const member = await this.memberQueryPort.findById(memberAccount.memberId);
    if (!member) {
      throw new MemberAccountNotFoundError(command.memberAccountId);
    }

    const memberTypeLinks = await this.memberTypeFeePlanRepository.findByMemberTypeId(
      member.memberTypeId,
    );
    const isLinked = memberTypeLinks.some(
      (link) => link.feePlanId === command.feePlanId && link.active,
    );
    if (!isLinked) {
      throw new PlanNotAvailableForMemberTypeError(feePlan.name, member.memberTypeId);
    }

    // 4. Crear Discount validado
    const discountResult = Discount.create(command.typeDiscount, command.personalDiscount);
    if (!discountResult.ok) {
      throw new DiscountExceedsLimitError(
        ((1 - (1 - command.typeDiscount) * (1 - command.personalDiscount)) * 100).toFixed(2),
      );
    }

    // 5. Crear FeeSubscription via factory
    const subscription = FeeSubscription.create({
      feePlanId: command.feePlanId,
      registrationDate: new Date(),
      discount: discountResult.value,
      feePlanAmount: feePlan.amount,
      personalDiscountReason: command.personalDiscountReason,
    });

    // 6. Añadir suscripción a la cuenta (valida invariante de RECURRING único)
    const addResult = memberAccount.addSubscription(subscription, feePlan.type);
    if (!addResult.ok) {
      throw new ActiveSubscriptionExistsError(command.memberAccountId);
    }

    // 7. Persistir cambios
    await this.memberAccountRepository.save(memberAccount);

    // 8. Publicar eventos de dominio al outbox
    const events = memberAccount.pullDomainEvents();
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }

    // 9. Retornar DTO de respuesta
    return SubscriptionResponseDto.fromDomain(subscription);
  }
}
