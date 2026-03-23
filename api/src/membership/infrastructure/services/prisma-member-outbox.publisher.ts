import { Injectable } from '@nestjs/common';
import { DomainEvent } from '../../../shared/domain';
import { MemberOutboxPublisher } from '../../application/ports/member-outbox.publisher';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';

@Injectable()
export class PrismaMemberOutboxPublisher implements MemberOutboxPublisher {
  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  async publish(tenantId: string, events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const prisma = await this.prismaTenantService.getClient(tenantId);

    for (const event of events) {
      const payload = (event.payload as Record<string, unknown> | null) ?? {};
      await prisma.outboxEvent.create({
        data: {
          eventType: event.eventType,
          // Prisma serializa automaticamente los campos Json — no usar JSON.stringify
          payload: {
            ...payload,
            eventId: event.eventId,
            occurredOn: event.occurredOn,
          },
        },
      });
    }
  }
}
