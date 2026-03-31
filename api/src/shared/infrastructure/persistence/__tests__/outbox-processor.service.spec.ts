import { describe, it, expect, vi, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { OutboxProcessorService } from '../outbox-processor.service';
import type { PrismaMainService } from '../prisma-main.service';
import type { ErrorReporter } from '../../../domain/ports/error-reporter.port';
import type { EventReconstitutionRegistry } from '../event-reconstitution.registry';
import { DomainEvent, type DomainEventParams } from '../../../domain/domain-event.base';

// --- Evento reconstituido de prueba ---
class MemberRegisteredEvent extends DomainEvent<{ memberNumber: string }> {
  readonly eventType = 'MemberRegistered';
  constructor(params: DomainEventParams<{ memberNumber: string }>) {
    super(params);
  }
}

// --- Fábrica de filas de outbox ---
const makePendingRow = (
  overrides?: Partial<{
    id: string;
    eventType: string;
    payload: unknown;
    aggregateId: string;
    aggregateType: string;
    boundedContext: string;
    actorId: string | null;
    retryCount: number;
    maxRetries: number;
    createdAt: Date;
    processingStartedAt?: Date | null;
    status: string;
  }>,
) => ({
  id: randomUUID(),
  eventType: 'MemberRegistered',
  payload: { memberNumber: 'M-001' },
  aggregateId: '550e8400-e29b-41d4-a716-000000000001',
  aggregateType: 'Member',
  boundedContext: 'BC-Membership',
  actorId: null,
  retryCount: 0,
  maxRetries: 3,
  createdAt: new Date(),
  processingStartedAt: null,
  status: 'pending',
  ...overrides,
});

// --- Setup común de mocks ---
const setupMocks = () => {
  const mockPrismaMain = {
    outboxEvent: {
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      update: vi.fn().mockResolvedValue({}),
    },
  };

  const mockEventBus = {
    publish: vi.fn().mockResolvedValue(undefined),
  };

  const mockRegistry = {
    reconstitute: vi.fn().mockImplementation(
      (
        eventType: string,
        row: {
          id: string;
          payload: unknown;
          aggregateId: string;
          aggregateType: string;
          boundedContext: string;
          actorId: string | null;
          createdAt: Date;
        },
      ) =>
        new MemberRegisteredEvent({
          payload: row.payload as { memberNumber: string },
          aggregateId: row.aggregateId,
          aggregateType: row.aggregateType,
          boundedContext: row.boundedContext,
          actorId: row.actorId ?? undefined,
        }),
    ),
  };

  const mockErrorReporter = {
    captureException: vi.fn(),
    captureMessage: vi.fn(),
  };

  return { mockPrismaMain, mockEventBus, mockRegistry, mockErrorReporter };
};

describe('OutboxProcessorService', () => {
  let service: OutboxProcessorService;
  let mockPrismaMain: ReturnType<typeof setupMocks>['mockPrismaMain'];
  let mockEventBus: ReturnType<typeof setupMocks>['mockEventBus'];
  let mockRegistry: ReturnType<typeof setupMocks>['mockRegistry'];
  let mockErrorReporter: ReturnType<typeof setupMocks>['mockErrorReporter'];

  beforeEach(() => {
    vi.clearAllMocks();
    const mocks = setupMocks();
    mockPrismaMain = mocks.mockPrismaMain;
    mockEventBus = mocks.mockEventBus;
    mockRegistry = mocks.mockRegistry;
    mockErrorReporter = mocks.mockErrorReporter;

    service = new OutboxProcessorService(
      mockPrismaMain as unknown as PrismaMainService,
      mockEventBus as unknown as import('@nestjs/cqrs').EventBus,
      mockRegistry as unknown as EventReconstitutionRegistry,
      mockErrorReporter as unknown as ErrorReporter,
    );
  });

  // -----------------------------------------------------------------------
  // Escenario 1: Happy path — procesar lote de pending events
  // -----------------------------------------------------------------------
  describe('processOutbox — happy path', () => {
    it('deberia seleccionar pending, actualizar a processing, reconstituir, publicar y marcar como processed', async () => {
      const row1 = makePendingRow({ id: 'event-aaa', eventType: 'MemberRegistered' });
      const row2 = makePendingRow({ id: 'event-bbb', eventType: 'MemberRegistered' });

      // findMany devuelve los eventos pending
      mockPrismaMain.outboxEvent.findMany.mockResolvedValue([row1, row2]);

      await service.processOutbox();

      // 1. SELECT pending
      expect(mockPrismaMain.outboxEvent.findMany).toHaveBeenCalledOnce();
      expect(mockPrismaMain.outboxEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'pending' }),
        }),
      );

      // 2. UPDATE a processing (updateMany con los IDs seleccionados y status: 'pending' en WHERE)
      expect(mockPrismaMain.outboxEvent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { in: [row1.id, row2.id] }, status: 'pending' }),
          data: expect.objectContaining({
            status: 'processing',
            processingStartedAt: expect.any(Date),
          }),
        }),
      );

      // 3. EventBus.publish llamado 2 veces
      expect(mockEventBus.publish).toHaveBeenCalledTimes(2);

      // 4. UPDATE a processed (update por cada evento)
      const processedCalls = mockPrismaMain.outboxEvent.update.mock.calls.filter(
        (call: unknown[]) => (call[0] as { data: { status: string } }).data.status === 'processed',
      );
      expect(processedCalls).toHaveLength(2);
    });

    it('deberia marcar processedAt como fecha cuando un evento se procesa exitosamente', async () => {
      const row = makePendingRow({ id: 'event-done' });
      mockPrismaMain.outboxEvent.findMany.mockResolvedValue([row]);

      await service.processOutbox();

      const updateCall = mockPrismaMain.outboxEvent.update.mock.calls.find(
        (call: unknown[]) => (call[0] as { data: { status: string } }).data.status === 'processed',
      );
      expect(updateCall).toBeDefined();
      expect(
        (updateCall![0] as { data: { processedAt: unknown } }).data.processedAt,
      ).toBeInstanceOf(Date);
    });
  });

  // -----------------------------------------------------------------------
  // Escenario 2: Mutex — evitar ejecución concurrente
  // -----------------------------------------------------------------------
  describe('processOutbox — mutex', () => {
    it('deberia retornar inmediatamente si ya está procesando (isProcessing=true)', async () => {
      // Simular que ya está en curso: primera llamada no termina antes de la segunda
      let resolveFirst: () => void;
      const firstCallPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      mockPrismaMain.outboxEvent.findMany.mockImplementationOnce(() => {
        return firstCallPromise.then(() => []);
      });

      // Lanzar primera llamada (se bloquea en findMany)
      const firstCall = service.processOutbox();

      // Segunda llamada mientras la primera está en curso
      await service.processOutbox();

      // La segunda llamada NO debería llamar findMany (fue bloqueada por mutex)
      // findMany se llama una sola vez (por la primera llamada)
      // Resolver la primera para limpiar
      resolveFirst!();
      await firstCall;

      expect(mockPrismaMain.outboxEvent.findMany).toHaveBeenCalledOnce();
    });
  });

  // -----------------------------------------------------------------------
  // Escenario 3: Stale recovery — bootstrap
  // -----------------------------------------------------------------------
  describe('onApplicationBootstrap — stale recovery', () => {
    it('deberia resetear a pending las filas con status=processing y processingStartedAt >5min', async () => {
      await service.onApplicationBootstrap();

      expect(mockPrismaMain.outboxEvent.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'processing',
            processingStartedAt: expect.objectContaining({ lt: expect.any(Date) }),
          }),
          data: expect.objectContaining({ status: 'pending' }),
        }),
      );
    });

    it('deberia usar processingStartedAt (no createdAt) con umbral de 5 minutos', async () => {
      const beforeCall = new Date();

      await service.onApplicationBootstrap();

      const updateCall = mockPrismaMain.outboxEvent.updateMany.mock.calls[0];
      const where = (updateCall[0] as { where: Record<string, unknown> }).where;

      // Verifica que usa processingStartedAt, NO createdAt
      expect(where).toHaveProperty('processingStartedAt');
      expect(where).not.toHaveProperty('createdAt');

      const ltDate: Date = (where.processingStartedAt as { lt: Date }).lt;

      // La fecha debe ser aproximadamente 5 minutos antes de ahora
      const fiveMinutesAgo = new Date(beforeCall.getTime() - 5 * 60 * 1000);
      const tenMinutesAgo = new Date(beforeCall.getTime() - 10 * 60 * 1000);

      expect(ltDate.getTime()).toBeLessThanOrEqual(fiveMinutesAgo.getTime());
      expect(ltDate.getTime()).toBeGreaterThan(tenMinutesAgo.getTime());
    });
  });

  // -----------------------------------------------------------------------
  // Escenario 4: Per-event isolation — fallo en evento 2 no afecta 1 y 3
  // -----------------------------------------------------------------------
  describe('processOutbox — per-event error isolation', () => {
    it('deberia procesar eventos 1 y 3 si el evento 2 falla', async () => {
      const row1 = makePendingRow({ id: 'event-ok-1' });
      const row2 = makePendingRow({ id: 'event-fail' });
      const row3 = makePendingRow({ id: 'event-ok-3' });

      mockPrismaMain.outboxEvent.findMany.mockResolvedValue([row1, row2, row3]);

      // EventBus falla solo para el evento 2
      mockEventBus.publish
        .mockResolvedValueOnce(undefined) // evento 1 OK
        .mockRejectedValueOnce(new Error('Handler crash')) // evento 2 FAIL
        .mockResolvedValueOnce(undefined); // evento 3 OK

      await service.processOutbox();

      // Eventos 1 y 3 → processed
      const processedUpdates = mockPrismaMain.outboxEvent.update.mock.calls.filter(
        (call: unknown[]) => (call[0] as { data: { status: string } }).data.status === 'processed',
      );
      expect(processedUpdates).toHaveLength(2);

      // Evento 2 → retry (pending) o failed
      const retryUpdate = mockPrismaMain.outboxEvent.update.mock.calls.find(
        (call: unknown[]) =>
          (call[0] as { where: { id: string } }).where.id === row2.id &&
          ['pending', 'failed'].includes((call[0] as { data: { status: string } }).data.status),
      );
      expect(retryUpdate).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Escenario 5: Max retries — marcar como failed cuando se alcanza el límite
  // -----------------------------------------------------------------------
  describe('processOutbox — max retries', () => {
    it('deberia marcar como failed cuando retryCount + 1 >= maxRetries', async () => {
      const row = makePendingRow({ id: 'event-exhausted', retryCount: 2, maxRetries: 3 });
      mockPrismaMain.outboxEvent.findMany.mockResolvedValue([row]);
      mockEventBus.publish.mockRejectedValue(new Error('Persistent failure'));

      await service.processOutbox();

      const failedUpdate = mockPrismaMain.outboxEvent.update.mock.calls.find(
        (call: unknown[]) =>
          (call[0] as { where: { id: string } }).where.id === row.id &&
          (call[0] as { data: { status: string } }).data.status === 'failed',
      );
      expect(failedUpdate).toBeDefined();
    });

    it('deberia incrementar retryCount cuando falla sin llegar al máximo', async () => {
      const row = makePendingRow({ id: 'event-retry', retryCount: 0, maxRetries: 3 });
      mockPrismaMain.outboxEvent.findMany.mockResolvedValue([row]);
      mockEventBus.publish.mockRejectedValue(new Error('Temporary failure'));

      await service.processOutbox();

      const retryUpdate = mockPrismaMain.outboxEvent.update.mock.calls.find(
        (call: unknown[]) =>
          (call[0] as { where: { id: string } }).where.id === row.id &&
          (call[0] as { data: { status: string } }).data.status === 'pending',
      );
      expect(retryUpdate).toBeDefined();
      expect((retryUpdate![0] as { data: { retryCount: number } }).data.retryCount).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // Escenario 6: Reconstitución + dispatch tipado
  // -----------------------------------------------------------------------
  describe('processOutbox — reconstitution + EventBus dispatch', () => {
    it('deberia llamar a registry.reconstitute con el eventType y la fila del outbox', async () => {
      const row = makePendingRow({ id: 'event-reconstitute', eventType: 'MemberRegistered' });
      mockPrismaMain.outboxEvent.findMany.mockResolvedValue([row]);

      await service.processOutbox();

      expect(mockRegistry.reconstitute).toHaveBeenCalledOnce();
      expect(mockRegistry.reconstitute).toHaveBeenCalledWith('MemberRegistered', row);
    });

    it('deberia pasar el evento reconstituido al EventBus.publish()', async () => {
      const row = makePendingRow({ id: 'event-dispatch', eventType: 'MemberRegistered' });
      const reconstitutedEvent = new MemberRegisteredEvent({
        payload: { memberNumber: 'M-001' },
        aggregateId: row.aggregateId,
        aggregateType: row.aggregateType,
        boundedContext: row.boundedContext,
      });

      mockPrismaMain.outboxEvent.findMany.mockResolvedValue([row]);
      mockRegistry.reconstitute.mockReturnValue(reconstitutedEvent);

      await service.processOutbox();

      expect(mockEventBus.publish).toHaveBeenCalledOnce();
      expect(mockEventBus.publish).toHaveBeenCalledWith(reconstitutedEvent);
    });
  });
});
