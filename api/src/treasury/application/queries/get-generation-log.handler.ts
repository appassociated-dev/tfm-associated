import { Inject, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetGenerationLogQuery } from './get-generation-log.query';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * DTO de salida para una entrada del log de generación.
 */
export interface GenerationLogEntryDto {
  /** ID del evento de outbox. */
  id: string;
  /** Tipo de evento. */
  eventType: string;
  /** Payload del evento con los datos de generación. */
  payload: Record<string, unknown>;
  /** Fecha de creación del evento. */
  createdAt: Date;
  /** Fecha de procesamiento (null si aún no se procesó). */
  processedAt: Date | null;
}

/**
 * Handler de la query para obtener el log de generación de cargos.
 * Consulta la tabla outbox_events de la BD del tenant filtrando por
 * eventos de tipo 'monthly-generation.completed' y el periodo solicitado.
 */
@QueryHandler(GetGenerationLogQuery)
export class GetGenerationLogHandler implements IQueryHandler<GetGenerationLogQuery> {
  private readonly logger = new Logger(GetGenerationLogHandler.name);

  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  async execute(query: GetGenerationLogQuery): Promise<GenerationLogEntryDto[]> {
    const { tenantId, month, year } = query;

    const prisma = this.prismaTenantService.getClient(tenantId);

    // Buscar eventos de generación completada para el mes/año dado
    const events = await prisma.outboxEvent.findMany({
      where: {
        eventType: 'monthly-generation.completed',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtrar por mes/año en el payload (el outbox no tiene campos de mes/año)
    const filtered = events.filter((event) => {
      const payload = event.payload as Record<string, unknown>;
      return payload.month === month && payload.year === year;
    });

    return filtered.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      payload: event.payload as Record<string, unknown>,
      createdAt: event.createdAt,
      processedAt: event.processedAt,
    }));
  }
}
