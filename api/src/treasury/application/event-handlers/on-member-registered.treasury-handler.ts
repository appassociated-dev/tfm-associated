import { Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MemberRegisteredEvent } from '../../../membership/domain/events/member-registered.event';
import { CreateMemberAccountCommand } from '../commands/create-member-account.command';

/**
 * Handler de integración: escucha MemberRegisteredEvent de BC-Membership
 * y crea la cuenta de tesorería del socio en BC-Treasury (ADR-008, REQ-IEC-007).
 */
@EventsHandler(MemberRegisteredEvent)
export class OnMemberRegisteredTreasuryHandler implements IEventHandler<MemberRegisteredEvent> {
  private readonly logger = new Logger(OnMemberRegisteredTreasuryHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: MemberRegisteredEvent): Promise<void> {
    // Verificar que el evento tiene tenantId (solo integration events lo tienen)
    if (!event.tenantId) {
      this.logger.warn(`[${event.eventType}] evento ${event.eventId} sin tenantId — ignorado.`);
      return;
    }

    try {
      // Delegar la creación de la cuenta al command handler correspondiente
      await this.commandBus.execute(
        new CreateMemberAccountCommand(event.tenantId, event.payload.memberId),
      );
    } catch (error) {
      // Aislamiento de errores: nunca propagar al OutboxProcessor (RNF-067)
      this.logger.error(
        `[${event.eventType}] error procesando evento ${event.eventId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
