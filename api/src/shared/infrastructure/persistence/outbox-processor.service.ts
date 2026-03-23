import { Injectable, Inject } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaMainService } from './prisma-main.service';
import {
  ErrorReporter,
  ERROR_REPORTER,
} from '../../domain/ports/error-reporter.port';

/** Intervalo de procesamiento del outbox en ms (cada 5 segundos). */
const PROCESSING_INTERVAL_MS = 5_000;

/** Número máximo de reintentos antes de marcar como fallido. */
const MAX_RETRIES = 5;

/** Tamaño del lote de eventos a procesar por ciclo. */
const BATCH_SIZE = 50;

/**
 * Servicio que procesa eventos pendientes de la tabla outbox_events.
 * Usa @Interval de @nestjs/schedule para ejecutarse periódicamente.
 * Implementa backoff exponencial para reintentos (1s, 2s, 4s, 8s, 16s).
 */
@Injectable()
export class OutboxProcessorService {
  constructor(
    private readonly prismaMain: PrismaMainService,
    @Inject(ERROR_REPORTER) private readonly errorReporter: ErrorReporter,
  ) {}

  /**
   * Procesa eventos pendientes del outbox.
   * Lee eventos no procesados, los despacha (placeholder) y marca como procesados.
   */
  @Interval(PROCESSING_INTERVAL_MS)
  async processOutbox(): Promise<void> {
    try {
      // Leer eventos pendientes cuyo next_retry_at haya pasado
      const pendingEvents = await this.prismaMain.$queryRawUnsafe<
        Array<{
          id: string;
          event_type: string;
          payload: string;
          retry_count: number;
        }>
      >(
        `SELECT id, event_type, payload, retry_count
         FROM outbox_events
         WHERE processed_at IS NULL
           AND retry_count < $1
           AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ORDER BY created_at ASC
         LIMIT $2`,
        MAX_RETRIES,
        BATCH_SIZE,
      );

      for (const event of pendingEvents) {
        try {
          // Placeholder: aquí se despacharía el evento al bus de eventos
          await this.dispatchEvent(event);

          // Marcar como procesado
          await this.prismaMain.$executeRawUnsafe(
            `UPDATE outbox_events SET processed_at = NOW() WHERE id = $1`,
            event.id,
          );
        } catch (error) {
          // Incrementar retry_count y calcular next_retry_at con backoff exponencial
          const nextRetry = this.calculateBackoff(event.retry_count);

          await this.prismaMain.$executeRawUnsafe(
            `UPDATE outbox_events
             SET retry_count = retry_count + 1,
                 next_retry_at = NOW() + INTERVAL '1 second' * $1
             WHERE id = $2`,
            nextRetry,
            event.id,
          );

          this.errorReporter.captureException(
            error instanceof Error ? error : new Error(String(error)),
            {
              eventId: event.id,
              eventType: event.event_type,
              retryCount: event.retry_count + 1,
            },
          );
        }
      }
    } catch (error) {
      this.errorReporter.captureException(
        error instanceof Error ? error : new Error(String(error)),
        { context: 'OutboxProcessorService.processOutbox' },
      );
    }
  }

  /**
   * Calcula el tiempo de espera en segundos con backoff exponencial.
   * Retries: 1s, 2s, 4s, 8s, 16s.
   */
  private calculateBackoff(currentRetryCount: number): number {
    return Math.pow(2, currentRetryCount);
  }

  /**
   * Placeholder para el despacho de eventos.
   * En fases posteriores, se integrará con el EventBus de NestJS CQRS.
   */
  private async dispatchEvent(event: {
    id: string;
    event_type: string;
    payload: string;
  }): Promise<void> {
    // TODO: Integrar con EventBus de @nestjs/cqrs en fases posteriores
    void event;
  }
}
