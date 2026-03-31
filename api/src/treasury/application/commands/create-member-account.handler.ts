import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateMemberAccountCommand } from './create-member-account.command';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  INTEGRATION_EVENT_PUBLISHER,
  IntegrationEventPublisher,
} from '../../../shared/application/ports/integration-event.publisher';
import { MemberAccount } from '../../domain/aggregates/member-account';

/**
 * Handler del comando de creación de cuenta de socio.
 * Operación idempotente: si ya existe una cuenta para el socio, retorna sin error.
 * Utilizado por el consumer de eventos de integración (ADR-008).
 */
@CommandHandler(CreateMemberAccountCommand)
export class CreateMemberAccountHandler implements ICommandHandler<CreateMemberAccountCommand> {
  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(INTEGRATION_EVENT_PUBLISHER)
    private readonly outboxPublisher: IntegrationEventPublisher,
  ) {}

  async execute(command: CreateMemberAccountCommand): Promise<void> {
    // 0. Establecer tenantId en el repositorio para acceder a la BD del tenant (ADR-002)
    this.memberAccountRepository.setTenantId(command.tenantId);

    // 1. Verificar idempotencia: si ya existe cuenta para el socio, salir sin error
    const alreadyExists = await this.memberAccountRepository.existsByMemberId(command.memberId);
    if (alreadyExists) {
      return;
    }

    // 2. Crear la cuenta de socio mediante factory del aggregate
    const result = MemberAccount.create({
      memberId: command.memberId,
      tenantId: command.tenantId,
    });

    if (!result.ok) {
      throw result.error;
    }

    const account = result.value;

    // 3. Persistir la cuenta
    await this.memberAccountRepository.save(account);

    // 4. Publicar eventos de dominio al outbox (si los hay)
    const events = account.pullDomainEvents();
    if (events.length > 0) {
      await this.outboxPublisher.publish(command.tenantId, events);
    }
  }
}
