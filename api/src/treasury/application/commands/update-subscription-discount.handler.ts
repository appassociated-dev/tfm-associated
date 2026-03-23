import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateSubscriptionDiscountCommand } from './update-subscription-discount.command';
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
  TREASURY_OUTBOX_PUBLISHER,
  TreasuryOutboxPublisher,
} from '../ports/treasury-outbox.publisher';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { Discount } from '../../domain/value-objects/discount';
import {
  MemberAccountNotFoundError,
  SubscriptionNotFoundError,
  FeePlanNotFoundError,
  DiscountExceedsLimitError,
} from '../../domain/exceptions';

/**
 * Handler del comando de actualización de descuento de suscripción.
 * Obtiene el descuento por tipo actual, combina con el nuevo descuento personal,
 * recalcula el importe efectivo y publica eventos.
 */
@CommandHandler(UpdateSubscriptionDiscountCommand)
export class UpdateSubscriptionDiscountHandler implements ICommandHandler<UpdateSubscriptionDiscountCommand> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(TREASURY_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: TreasuryOutboxPublisher,
  ) {}

  async execute(command: UpdateSubscriptionDiscountCommand): Promise<SubscriptionResponseDto> {
    // 0. Establecer tenantId en repositorios (ADR-002)
    this.memberAccountRepository.setTenantId(command.tenantId);
    this.feePlanRepository.setTenantId(command.tenantId);

    // 1. Buscar cuenta de socio
    const accountId = MemberAccountId.fromString(command.memberAccountId);
    const memberAccount = await this.memberAccountRepository.findById(accountId);
    if (!memberAccount) {
      throw new MemberAccountNotFoundError(command.memberAccountId);
    }

    // 2. Buscar la suscripción activa
    const subscriptionId = SubscriptionId.fromString(command.subscriptionId);
    const subscription = memberAccount.findSubscriptionById(subscriptionId);
    if (!subscription || !subscription.isActive()) {
      throw new SubscriptionNotFoundError(command.subscriptionId);
    }

    // 3. Obtener el descuento por tipo actual de la suscripción
    const currentTypeDiscount = subscription.discount.typeDiscount;

    // 4. Crear nuevo Discount combinando tipo existente + nuevo personal
    const discountResult = Discount.create(currentTypeDiscount, command.newPersonalDiscount);
    if (!discountResult.ok) {
      throw new DiscountExceedsLimitError(
        ((1 - (1 - currentTypeDiscount) * (1 - command.newPersonalDiscount)) * 100).toFixed(2),
      );
    }

    // 5. Buscar el plan de cuota para obtener el importe base
    const feePlan = await this.feePlanRepository.findById(subscription.feePlanId);
    if (!feePlan) {
      throw new FeePlanNotFoundError(subscription.feePlanId.toValue());
    }

    // 6. Actualizar descuento y recalcular importe efectivo en el aggregate
    const updateResult = memberAccount.updateSubscriptionDiscount(
      subscriptionId,
      discountResult.value,
      feePlan.amount,
    );
    if (!updateResult.ok) {
      throw updateResult.error;
    }

    // 7. Persistir cambios
    await this.memberAccountRepository.save(memberAccount);

    // 8. Publicar eventos de dominio al outbox
    const events = memberAccount.pullDomainEvents();
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }

    // 9. Retornar DTO con los datos actualizados
    return SubscriptionResponseDto.fromDomain(subscription);
  }
}
