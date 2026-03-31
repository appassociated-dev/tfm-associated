import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaDomainAuditPublisher } from '../prisma-domain-audit.publisher';
import type { PrismaTransactionClient } from '../../../application/ports/domain-audit.publisher';
import { DomainEvent, type DomainEventParams } from '../../../domain/domain-event.base';

// --- Helper: evento de prueba ---
class TestAuditEvent extends DomainEvent<{ value: number }> {
  readonly eventType = 'TestAuditEvent';

  constructor(params: DomainEventParams<{ value: number }>) {
    super(params);
  }
}

const makeEvent = (overrides?: Partial<DomainEventParams<{ value: number }>>) =>
  new TestAuditEvent({
    payload: { value: 42 },
    aggregateId: '550e8400-e29b-41d4-a716-446655440011',
    aggregateType: 'TestAggregate',
    boundedContext: 'BC-Membership',
    actorId: '550e8400-e29b-41d4-a716-446655440022',
    ...overrides,
  });

// --- Mock del tx client (Prisma transaction client del tenant) ---
const makeMockTxClient = () => ({
  outboxEvent: {
    create: vi.fn().mockResolvedValue({ id: 'audit-row-id' }),
  },
});

describe('PrismaDomainAuditPublisher', () => {
  let publisher: PrismaDomainAuditPublisher;
  let mockTxClient: ReturnType<typeof makeMockTxClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTxClient = makeMockTxClient();
    publisher = new PrismaDomainAuditPublisher();
  });

  describe('publish — usa el tx client proporcionado', () => {
    it('deberia usar el tx client recibido (NO PrismaTenantService directamente)', async () => {
      const event = makeEvent();

      await publisher.publish(mockTxClient as unknown as PrismaTransactionClient, [event]);

      // El write fue al txClient, no a un service interno
      expect(mockTxClient.outboxEvent.create).toHaveBeenCalledOnce();
    });

    it('deberia escribir los campos correctos del evento en la tabla de auditoría', async () => {
      const event = makeEvent();

      await publisher.publish(mockTxClient as unknown as PrismaTransactionClient, [event]);

      expect(mockTxClient.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          id: event.eventId,
          boundedContext: event.boundedContext,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          payload: event.payload,
          actorId: event.actorId,
          occurredAt: event.occurredOn,
        },
      });
    });
  });

  describe('publish — NO escribe columnas de retry', () => {
    it('NO deberia incluir status, retryCount, maxRetries ni processedAt', async () => {
      const event = makeEvent();

      await publisher.publish(mockTxClient as unknown as PrismaTransactionClient, [event]);

      const callData = mockTxClient.outboxEvent.create.mock.calls[0][0].data;

      expect(callData).not.toHaveProperty('status');
      expect(callData).not.toHaveProperty('retryCount');
      expect(callData).not.toHaveProperty('maxRetries');
      expect(callData).not.toHaveProperty('processedAt');
      expect(callData).not.toHaveProperty('nextRetryAt');
      expect(callData).not.toHaveProperty('lastError');
    });
  });

  describe('publish — múltiples eventos', () => {
    it('deberia escribir una fila por evento cuando se publican varios', async () => {
      const events = [makeEvent(), makeEvent(), makeEvent()];

      await publisher.publish(mockTxClient as unknown as PrismaTransactionClient, events);

      expect(mockTxClient.outboxEvent.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('publish — sin actorId', () => {
    it('deberia escribir actorId como undefined para operaciones de sistema', async () => {
      const event = makeEvent({ actorId: undefined });

      await publisher.publish(mockTxClient as unknown as PrismaTransactionClient, [event]);

      const callData = mockTxClient.outboxEvent.create.mock.calls[0][0].data;
      expect(callData.actorId).toBeUndefined();
    });
  });
});
