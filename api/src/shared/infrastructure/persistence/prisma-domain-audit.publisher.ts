import { Injectable } from '@nestjs/common';
import type {
  DomainAuditPublisher,
  PrismaTransactionClient,
} from '../../application/ports/domain-audit.publisher';
import type { DomainEvent } from '../../domain/domain-event.base';

/**
 * Implementación del puerto DomainAuditPublisher usando el tx client de Prisma (tenant DB).
 * Escribe eventos de auditoría en `outbox_events` del tenant dentro de la transacción activa.
 * No incluye columnas de retry — la tabla de audit es de solo escritura/lectura (GAP-011).
 *
 * IMPORTANTE: El txClient debe ser el parámetro `tx` de un `prisma.$transaction(async (tx) => ...)`.
 * Si la transacción se revierte, los registros de auditoría también se revierten.
 */
@Injectable()
export class PrismaDomainAuditPublisher implements DomainAuditPublisher {
  /**
   * Publica eventos en el outbox de auditoría (tenant DB) dentro de la transacción activa.
   * Un registro por evento. Columnas: id, boundedContext, eventType, aggregateId,
   * aggregateType, payload, actorId, occurredAt.
   */
  async publish(txClient: PrismaTransactionClient, events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await txClient.outboxEvent.create({
        data: {
          id: event.eventId,
          boundedContext: event.boundedContext,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          payload: event.payload as Record<string, unknown>,
          actorId: event.actorId,
          occurredAt: event.occurredOn,
        },
      });
    }
  }
}
