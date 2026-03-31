import { Logger } from '@nestjs/common';
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
  /** Fecha de ocurrencia del evento. */
  occurredAt: Date;
}

/**
 * Handler de la query para obtener el log de generación de cargos.
 * Consulta la tabla outbox_events de la BD del tenant filtrando por
 * eventos de tipo 'MonthlyGenerationCompleted' y el periodo solicitado.
 * La tabla outbox del tenant (ENT-017) es de solo-auditoría: no tiene campos
 * de procesamiento (status, processedAt, retryCount).
 */
@QueryHandler(GetGenerationLogQuery)
export class GetGenerationLogHandler implements IQueryHandler<GetGenerationLogQuery> {
  private readonly logger = new Logger(GetGenerationLogHandler.name);

  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  async execute(query: GetGenerationLogQuery): Promise<GenerationLogEntryDto[]> {
    const { tenantId, month, year } = query;

    const prisma = await this.prismaTenantService.getClient(tenantId);

    // Buscar eventos de generación completada para el mes/año dado
    const events = await prisma.outboxEvent.findMany({
      where: {
        eventType: 'MonthlyGenerationCompleted',
      },
      orderBy: { occurredAt: 'desc' },
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
      occurredAt: event.occurredAt,
    }));
  }
}
