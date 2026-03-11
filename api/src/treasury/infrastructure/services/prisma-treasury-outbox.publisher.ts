import { Injectable } from '@nestjs/common';
import { DomainEvent } from '../../../shared/domain';
import { TreasuryOutboxPublisher } from '../../application/ports/treasury-outbox.publisher';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * Implementación Prisma del publisher de outbox para BC-Treasury.
 * Persiste eventos de dominio en la tabla `outbox_events` del tenant (ADR-008).
 * Mismo patrón que PrismaMemberOutboxPublisher de BC-Membership.
 */
@Injectable()
export class PrismaTreasuryOutboxPublisher implements TreasuryOutboxPublisher {
  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  async publish(tenantId: string, events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const prisma = this.prismaTenantService.getClient(tenantId);

    for (const event of events) {
      const payload = (event.payload as Record<string, unknown> | null) ?? {};
      await prisma.outboxEvent.create({
        data: {
          eventType: event.eventType,
          payload: JSON.parse(
            JSON.stringify({
              ...payload,
              eventId: event.eventId,
              occurredOn: event.occurredOn,
            }),
          ),
        },
      });
    }
  }
}
