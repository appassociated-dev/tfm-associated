import { Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MemberDataUpdatedEvent } from '../../../membership/domain/events/member-data-updated.event';

/**
 * Handler de integración STUB: escucha MemberDataUpdatedEvent de BC-Membership.
 *
 * DIFERIDO: la lógica real (actualizar IBAN en SepaMandate) queda pendiente hasta que
 * ENT-018 (SepaMandate) esté disponible en el esquema Prisma del tenant.
 * Ver: spec/entities/ENT-018-sepa-mandate.md
 */
@EventsHandler(MemberDataUpdatedEvent)
export class OnMemberDataUpdatedTreasuryHandler implements IEventHandler<MemberDataUpdatedEvent> {
  private readonly logger = new Logger(OnMemberDataUpdatedTreasuryHandler.name);

  // CommandBus tipado correctamente para que NestJS DI pueda resolverlo (aunque no se usa en el stub)
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: MemberDataUpdatedEvent): Promise<void> {
    // Verificar que el evento tiene tenantId (consistencia con otros handlers, RNF-067)
    if (!event.tenantId) {
      this.logger.warn(`[${event.eventType}] evento ${event.eventId} sin tenantId — ignorado.`);
      return;
    }

    try {
      // STUB: no-op hasta que ENT-018 esté implementado
      this.logger.log(
        `[${event.eventType}] no-op — SepaMandate (ENT-018) pending. ` +
          `eventId=${event.eventId}, memberId=${event.payload.memberId}`,
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
