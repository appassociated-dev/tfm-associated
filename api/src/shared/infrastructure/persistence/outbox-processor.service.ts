import { Injectable, Inject, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { EventBus } from '@nestjs/cqrs';
import { PrismaMainService } from './prisma-main.service';
import { EventReconstitutionRegistry, type OutboxEventRow } from './event-reconstitution.registry';
import { ErrorReporter, ERROR_REPORTER } from '../../domain/ports/error-reporter.port';

/** Intervalo de procesamiento del outbox en ms (cada 5 segundos). */
const PROCESSING_INTERVAL_MS = 5_000;

/** Umbral de antigüedad para considerar un evento como "stale" en ms (5 minutos). */
const STALE_THRESHOLD_MS = 5 * 60 * 1_000;

/** Número máximo de eventos a procesar por ciclo. */
const BATCH_SIZE = 50;

/**
 * Servicio que procesa eventos pendientes de la tabla outbox_events en DB-Main.
 * Implementa el patrón outbox: polling + dispatch al EventBus de NestJS CQRS.
 *
 * Características (GAP-007, GAP-012, GAP-016):
 * - @Interval(5000): polling cada 5 segundos.
 * - Mutex in-memory (isProcessing): evita ejecución concurrente en el mismo proceso.
 * - Stale recovery (OnApplicationBootstrap): resetea eventos processing >5min a pending.
 * - Per-event isolation: un fallo no bloquea los demás eventos del lote.
 * - Retry logic: retryCount++ hasta maxRetries; luego status='failed'.
 * - Usa Prisma Client API exclusivamente — sin $queryRawUnsafe.
 */
@Injectable()
export class OutboxProcessorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private isProcessing = false;

  constructor(
    private readonly prismaMain: PrismaMainService,
    private readonly eventBus: EventBus,
    private readonly registry: EventReconstitutionRegistry,
    @Inject(ERROR_REPORTER) private readonly errorReporter: ErrorReporter,
  ) {}

  /**
   * Al arrancar la aplicación, resetea eventos en estado 'processing' con antigüedad >5min.
   * Estos son eventos que quedaron atascados por un crash o reinicio del proceso.
   */
  async onApplicationBootstrap(): Promise<void> {
    const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_MS);

    const result = await this.prismaMain.outboxEvent.updateMany({
      where: {
        status: 'processing',
        processingStartedAt: { lt: staleThreshold },
      },
      data: { status: 'pending' },
    });

    if (result.count > 0) {
      this.logger.warn(
        `Stale recovery: ${result.count} evento(s) en estado 'processing' reseteados a 'pending'.`,
      );
    }
  }

  /**
   * Procesa el lote de eventos pendientes del outbox.
   * Si ya hay un tick en curso (isProcessing=true), retorna inmediatamente.
   */
  @Interval(PROCESSING_INTERVAL_MS)
  async processOutbox(): Promise<void> {
    // Mutex: evitar ejecución concurrente
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 1. SELECT hasta BATCH_SIZE filas con status='pending', ordenadas por createdAt ASC
      const pendingEvents = await this.prismaMain.outboxEvent.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
      });

      if (pendingEvents.length === 0) {
        return;
      }

      this.logger.debug(`Procesando lote de ${pendingEvents.length} evento(s) del outbox.`);

      // 2. UPDATE todos a status='processing' de forma atómica
      // Se incluye status: 'pending' en el WHERE para evitar sobrescribir eventos
      // que hayan cambiado de estado externamente entre el SELECT y este UPDATE.
      const eventIds = pendingEvents.map((e: { id: string }) => e.id);
      await this.prismaMain.outboxEvent.updateMany({
        where: { id: { in: eventIds }, status: 'pending' },
        data: { status: 'processing', processingStartedAt: new Date() },
      });

      // 3. Despachar cada evento individualmente con aislamiento por evento
      for (const row of pendingEvents) {
        await this.dispatchSingleEvent(row);
      }
    } catch (error) {
      this.errorReporter.captureException(
        error instanceof Error ? error : new Error(String(error)),
        { context: 'OutboxProcessorService.processOutbox' },
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Despacha un único evento del outbox:
   * 1. Reconstituye el evento tipado via EventReconstitutionRegistry.
   * 2. Lo publica en el EventBus.
   * 3. Actualiza el status a 'processed' o incrementa retryCount.
   */
  private async dispatchSingleEvent(row: OutboxEventRow): Promise<void> {
    try {
      // Reconstituir el evento tipado
      const event = this.registry.reconstitute(row.eventType, row);

      // Despachar al EventBus
      await this.eventBus.publish(event);

      // Marcar como procesado
      await this.prismaMain.outboxEvent.update({
        where: { id: row.id },
        data: {
          status: 'processed',
          processedAt: new Date(),
        },
      });
    } catch (error) {
      const newRetryCount = row.retryCount + 1;
      const isExhausted = newRetryCount >= row.maxRetries;

      this.errorReporter.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          context: 'OutboxProcessorService.dispatchSingleEvent',
          eventId: row.id,
          eventType: row.eventType,
          retryCount: newRetryCount,
          maxRetries: row.maxRetries,
          exhausted: isExhausted,
        },
      );

      // Si se agotaron los reintentos → failed; sino → pending para reintentar
      await this.prismaMain.outboxEvent.update({
        where: { id: row.id },
        data: {
          status: isExhausted ? 'failed' : 'pending',
          retryCount: newRetryCount,
        },
      });
    }
  }
}
