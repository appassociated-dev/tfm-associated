import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaIntegrationEventPublisher } from '../prisma-integration-event.publisher';
import type { PrismaMainService } from '../prisma-main.service';
import type { ErrorReporter } from '../../../domain/ports/error-reporter.port';
import { DomainEvent, type DomainEventParams } from '../../../domain/domain-event.base';

// --- Helper: evento de prueba ---
class TestIntegrationEvent extends DomainEvent<{ name: string }> {
  readonly eventType = 'TestIntegrationEvent';

  constructor(params: DomainEventParams<{ name: string }>) {
    super(params);
  }
}

const makeEvent = (overrides?: Partial<DomainEventParams<{ name: string }>>) =>
  new TestIntegrationEvent({
    payload: { name: 'test' },
    aggregateId: '550e8400-e29b-41d4-a716-446655440001',
    aggregateType: 'TestAggregate',
    boundedContext: 'BC-Test',
    actorId: '550e8400-e29b-41d4-a716-446655440002',
    ...overrides,
  });

describe('PrismaIntegrationEventPublisher', () => {
  let publisher: PrismaIntegrationEventPublisher;
  let mockPrismaMain: { outboxEvent: { create: ReturnType<typeof vi.fn> } };
  let mockErrorReporter: { captureException: ReturnType<typeof vi.fn> };

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440099';

  beforeEach(() => {
    mockPrismaMain = {
      outboxEvent: {
        create: vi.fn().mockResolvedValue({ id: 'created-row-id' }),
      },
    };

    mockErrorReporter = {
      captureException: vi.fn(),
    };

    publisher = new PrismaIntegrationEventPublisher(
      mockPrismaMain as unknown as PrismaMainService,
      mockErrorReporter as unknown as ErrorReporter,
    );
  });

  describe('publish — happy path', () => {
    it('deberia escribir una fila en outbox_events para un evento único', async () => {
      const event = makeEvent();

      await publisher.publish(TENANT_ID, [event]);

      expect(mockPrismaMain.outboxEvent.create).toHaveBeenCalledOnce();
      expect(mockPrismaMain.outboxEvent.create).toHaveBeenCalledWith({
        data: {
          id: event.eventId,
          tenantId: TENANT_ID,
          boundedContext: event.boundedContext,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          payload: event.payload,
          actorId: event.actorId,
          status: 'pending',
          retryCount: 0,
          maxRetries: 3,
        },
      });
    });

    it('deberia escribir 3 filas cuando se publican 3 eventos', async () => {
      const events = [makeEvent(), makeEvent(), makeEvent()];

      await publisher.publish(TENANT_ID, events);

      expect(mockPrismaMain.outboxEvent.create).toHaveBeenCalledTimes(3);
    });

    it('deberia usar tenantId null para eventos de sistema (BC-Identity)', async () => {
      const event = makeEvent({ boundedContext: 'BC-Identity' });

      await publisher.publish(null, [event]);

      expect(mockPrismaMain.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: null,
          boundedContext: 'BC-Identity',
        }),
      });
    });
  });

  describe('publish — error handling', () => {
    it('NO deberia lanzar excepción cuando la BD falla (best-effort)', async () => {
      mockPrismaMain.outboxEvent.create.mockRejectedValue(new Error('DB connection lost'));

      // No debe lanzar
      await expect(publisher.publish(TENANT_ID, [makeEvent()])).resolves.toBeUndefined();
    });

    it('deberia llamar a ErrorReporter cuando la BD falla', async () => {
      const dbError = new Error('Connection timeout');
      mockPrismaMain.outboxEvent.create.mockRejectedValue(dbError);

      await publisher.publish(TENANT_ID, [makeEvent()]);

      expect(mockErrorReporter.captureException).toHaveBeenCalledOnce();
      expect(mockErrorReporter.captureException).toHaveBeenCalledWith(
        dbError,
        expect.objectContaining({ context: 'PrismaIntegrationEventPublisher.publish' }),
      );
    });
  });

  describe('publish — sin actorId', () => {
    it('deberia escribir actorId como undefined cuando no se proporciona', async () => {
      const event = makeEvent({ actorId: undefined });

      await publisher.publish(TENANT_ID, [event]);

      expect(mockPrismaMain.outboxEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: undefined,
        }),
      });
    });
  });
});
