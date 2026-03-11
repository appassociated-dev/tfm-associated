import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CloseSubscriptionCommand } from './close-subscription.command';
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
import { SubscriptionCancelReason } from '../../domain/value-objects/subscription-cancel-reason';
import { MemberAccountNotFoundError, SubscriptionNotFoundError } from '../../domain/exceptions';

/**
 * Handler del comando de cierre de suscripción.
 * Cierra la suscripción con el motivo indicado y fecha actual,
 * persiste los cambios y publica eventos de dominio.
 */
@CommandHandler(CloseSubscriptionCommand)
export class CloseSubscriptionHandler implements ICommandHandler<CloseSubscriptionCommand> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(TREASURY_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: TreasuryOutboxPublisher,
  ) {}

  async execute(command: CloseSubscriptionCommand): Promise<void> {
    // 0. Establecer tenantId en el repositorio (ADR-002)
    this.memberAccountRepository.setTenantId(command.tenantId);

    // 1. Buscar cuenta de socio
    const accountId = MemberAccountId.fromString(command.memberAccountId);
    const memberAccount = await this.memberAccountRepository.findById(accountId);
    if (!memberAccount) {
      throw new MemberAccountNotFoundError(command.memberAccountId);
    }

    // 2. Verificar que la suscripción existe
    const subscriptionId = SubscriptionId.fromString(command.subscriptionId);
    const subscription = memberAccount.findSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError(command.subscriptionId);
    }

    // 3. Parsear motivo de cancelación (lanza error si es inválido)
    const reason = SubscriptionCancelReason.fromString(command.cancelReason);

    // 4. Cerrar suscripción en el aggregate
    const closeResult = memberAccount.closeSubscription(subscriptionId, reason, new Date());
    if (!closeResult.ok) {
      throw closeResult.error;
    }

    // 5. Persistir cambios
    await this.memberAccountRepository.save(memberAccount);

    // 6. Publicar eventos de dominio al outbox
    const events = memberAccount.pullDomainEvents();
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }
  }
}
