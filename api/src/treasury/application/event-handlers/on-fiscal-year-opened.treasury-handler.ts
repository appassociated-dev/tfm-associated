import { Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { FiscalYearOpenedEvent } from '../../../membership/domain/events/fiscal-year-opened.event';
import { GenerateMonthlyChargesCommand } from '../commands/generate-monthly-charges.command';

/**
 * Handler de integración: escucha FiscalYearOpenedEvent de BC-Membership
 * y dispara la generación de cargos mensuales para el primer mes del ejercicio (ADR-008).
 *
 * Extrae mes y año de payload.startDate para construir el comando.
 */
@EventsHandler(FiscalYearOpenedEvent)
export class OnFiscalYearOpenedTreasuryHandler implements IEventHandler<FiscalYearOpenedEvent> {
  private readonly logger = new Logger(OnFiscalYearOpenedTreasuryHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: FiscalYearOpenedEvent): Promise<void> {
    // Verificar que el evento tiene tenantId
    if (!event.tenantId) {
      this.logger.warn(`[${event.eventType}] evento ${event.eventId} sin tenantId — ignorado.`);
      return;
    }

    try {
      // Parsear startDate explícitamente: puede llegar como string desde el payload JSON del outbox
      const startDate = new Date(event.payload.startDate);
      const month = startDate.getMonth() + 1; // getMonth() devuelve 0-based
      const year = startDate.getFullYear();

      // Despachar generación de cargos para el primer mes del ejercicio
      await this.commandBus.execute(new GenerateMonthlyChargesCommand(event.tenantId, month, year));
    } catch (error) {
      // Aislamiento de errores: nunca propagar al OutboxProcessor (RNF-067)
      this.logger.error(
        `[${event.eventType}] error procesando evento ${event.eventId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
