// Procesador de eventos outbox — garantiza entrega at-least-once de domain events
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { type EventBus } from '@nestjs/cqrs';
import { type PrismaMainService } from './prisma-main.service';

// Número máximo de reintentos antes de abandonar el procesamiento de un evento
const MAX_RETRY_COUNT = 5;

// Delay base en milisegundos para el backoff exponencial
const BASE_BACKOFF_MS = 1000;

@Injectable()
export class OutboxProcessorService {
  constructor(
    private readonly prismaMain: PrismaMainService,
    private readonly eventBus: EventBus,
  ) {}

  // Procesa los eventos pendientes del outbox cada 5 segundos
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents(): Promise<void> {
    // Recupera eventos no procesados con reintentos disponibles
    // Accede al cliente Prisma a través de prismaMain.client (composición en Prisma 7)
    const pendingEvents = await this.prismaMain.client.outboxEvent.findMany({
      where: {
        processed_at: null,
        retry_count: { lt: MAX_RETRY_COUNT },
      },
      orderBy: { created_at: 'asc' },
    });

    for (const event of pendingEvents) {
      try {
        // Despacha el evento al bus de CQRS para que los handlers lo consuman
        // event.payload es Json de Prisma — se castea a Record para el spread
        const payload = event.payload as Record<string, unknown>;
        await this.eventBus.publish({ ...payload, eventType: event.event_type });

        // Marca el evento como procesado exitosamente
        await this.prismaMain.client.outboxEvent.update({
          where: { id: event.id },
          data: { processed_at: new Date() },
        });
      } catch (error) {
        const retryCount = event.retry_count + 1;
        const lastError = error instanceof Error ? error.message : String(error);

        // Actualiza el contador de reintentos y el último error
        await this.prismaMain.client.outboxEvent.update({
          where: { id: event.id },
          data: {
            retry_count: retryCount,
            last_error: lastError,
          },
        });

        // Aplica backoff exponencial: 1s, 2s, 4s, 8s, 16s según el número de intento
        const backoffDelay = BASE_BACKOFF_MS * Math.pow(2, retryCount);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  }
}
