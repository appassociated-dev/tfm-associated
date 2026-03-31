import { Injectable, Inject } from '@nestjs/common';
import type { IntegrationEventPublisher } from '../../application/ports/integration-event.publisher';
import type { DomainEvent } from '../../domain/domain-event.base';
import { PrismaMainService } from './prisma-main.service';
import { ErrorReporter, ERROR_REPORTER } from '../../domain/ports/error-reporter.port';

/**
 * Implementación del puerto IntegrationEventPublisher usando Prisma contra DB-Main.
 * Escribe un registro por evento en `outbox_events` con status='pending'.
 * En caso de fallo de BD, captura el error via ErrorReporter sin propagar la excepción
 * para garantizar que el fallo del outbox no rompa la transacción del dominio (GAP-001).
 */
@Injectable()
export class PrismaIntegrationEventPublisher implements IntegrationEventPublisher {
  constructor(
    private readonly prismaMain: PrismaMainService,
    @Inject(ERROR_REPORTER) private readonly errorReporter: ErrorReporter,
  ) {}

  /**
   * Publica eventos en el outbox de DB-Main.
   * Escribe una fila por evento. Best-effort: no lanza si la BD falla.
   */
  async publish(tenantId: string | null, events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      try {
        await this.prismaMain.outboxEvent.create({
          data: {
            id: event.eventId,
            tenantId,
            boundedContext: event.boundedContext,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            aggregateType: event.aggregateType,
            payload: event.payload as Record<string, unknown>,
            actorId: event.actorId,
            status: 'pending',
            retryCount: 0,
            maxRetries: 3,
          },
        });
      } catch (error) {
        this.errorReporter.captureException(
          error instanceof Error ? error : new Error(String(error)),
          {
            context: 'PrismaIntegrationEventPublisher.publish',
            eventId: event.eventId,
            eventType: event.eventType,
            tenantId,
          },
        );
        // No relanzar: el fallo del outbox no debe romper la operación de dominio
      }
    }
  }
}
