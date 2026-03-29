import { Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MemberStatusChangedEvent } from '../../../membership/domain/events/member-status-changed.event';

/**
 * Handler de integración STUB: escucha MemberStatusChangedEvent de BC-Membership.
 *
 * DIFERIDO: la lógica real (suspender/reactivar generación de cargos) queda pendiente
 * hasta que el aggregate MemberAccount tenga el flag `chargeGenerationSuspended`.
 * Ver: diseño §Handler 6 — deferred stub.
 */
@EventsHandler(MemberStatusChangedEvent)
export class OnMemberStatusChangedTreasuryHandler implements IEventHandler<MemberStatusChangedEvent> {
  private readonly logger = new Logger(OnMemberStatusChangedTreasuryHandler.name);

  // CommandBus tipado correctamente para que NestJS DI pueda resolverlo (aunque no se usa en el stub)
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: MemberStatusChangedEvent): Promise<void> {
    // Verificar que el evento tiene tenantId (consistencia con otros handlers, RNF-067)
    if (!event.tenantId) {
      this.logger.warn(`[${event.eventType}] evento ${event.eventId} sin tenantId — ignorado.`);
      return;
    }

    try {
      // STUB: no-op hasta que MemberAccount tenga chargeGenerationSuspended flag
      this.logger.log(
        `[${event.eventType}] no-op — MemberAccount carece de flag chargeGenerationSuspended. ` +
          `Diferido hasta extensión del aggregate. ` +
          `eventId=${event.eventId}, memberId=${event.payload.memberId}, newStatus=${event.payload.newStatus}`,
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
