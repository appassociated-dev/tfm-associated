import 'dotenv/config';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma-main';
import { PrismaMainService } from '../prisma-main.service';
import { EventReconstitutionRegistry } from '../event-reconstitution.registry';
import { OutboxProcessorService } from '../outbox-processor.service';
import { ErrorReporter } from '../../../domain/ports/error-reporter.port';
import { MemberRegisteredEvent } from '../../../../membership/domain/events/member-registered.event';
import type { EventBus } from '@nestjs/cqrs';

/**
 * Tests de integración para el pipeline completo del outbox.
 * D-002: Verifica el flujo end-to-end de procesamiento del outbox con BD real.
 *
 * Requiere PostgreSQL corriendo (Docker Compose o DATABASE_MAIN_URL configurado).
 * Ejecutar con: npm run test:integration
 *
 * Escenarios:
 * 1. Pipeline completo: pending → processing → processed + processedAt + EventBus.publish
 * 2. Stale recovery: evento 'processing' antiguo → onApplicationBootstrap → reset a 'pending'
 */

/** URL de conexión a PostgreSQL principal. */
const DATABASE_MAIN_URL =
  process.env.DATABASE_MAIN_URL ??
  'postgresql://associated:associated_dev@localhost:5432/associated_main';

/**
 * Comprueba si PostgreSQL está disponible intentando una conexión.
 */
async function isPostgresAvailable(): Promise<boolean> {
  const adapter = new PrismaPg({ connectionString: DATABASE_MAIN_URL });
  const client = new PrismaClient({ adapter });
  try {
    await client.$connect();
    await client.$disconnect();
    return true;
  } catch {
    return false;
  }
}

describe('Outbox Pipeline Integration', () => {
  let pgAvailable: boolean;
  let rawClient: PrismaClient;
  let prismaMainService: PrismaMainService;
  let registry: EventReconstitutionRegistry;
  let processor: OutboxProcessorService;
  let eventBusMock: EventBus;
  let errorReporterMock: ErrorReporter;

  beforeAll(async () => {
    pgAvailable = await isPostgresAvailable();
    if (!pgAvailable) return;

    // Crear cliente raw para verificaciones directas en BD
    const adapter = new PrismaPg({ connectionString: DATABASE_MAIN_URL });
    rawClient = new PrismaClient({ adapter });
    await rawClient.$connect();

    // Crear PrismaMainService de test (envuelve el mismo cliente)
    prismaMainService = new PrismaMainService();
    await prismaMainService.$connect();

    // Crear EventReconstitutionRegistry y registrar evento de prueba
    registry = new EventReconstitutionRegistry();
    registry.register('MemberRegistered', MemberRegisteredEvent);

    // Mock del EventBus
    eventBusMock = {
      publish: vi.fn().mockResolvedValue(undefined),
    } as unknown as EventBus;

    // Mock del ErrorReporter
    errorReporterMock = {
      captureException: vi.fn(),
    } as unknown as ErrorReporter;

    // Crear el OutboxProcessorService con dependencias reales (BD) y mocks (EventBus)
    processor = new OutboxProcessorService(
      prismaMainService,
      eventBusMock,
      registry,
      errorReporterMock,
    );
  }, 30_000);

  afterAll(async () => {
    if (!pgAvailable) return;
    await prismaMainService?.$disconnect();
    await rawClient?.$disconnect();
  }, 15_000);

  beforeEach(async () => {
    if (!pgAvailable) return;
    // Limpiar eventos del outbox que puedan quedar de tests anteriores (sólo los de test)
    await rawClient.outboxEvent.deleteMany({
      where: { aggregateType: 'Member-Integration-Test' },
    });
    vi.clearAllMocks();
  });

  it('debería procesar evento pending: status→processed, processedAt set, EventBus.publish llamado', async () => {
    if (!pgAvailable) {
      console.warn('PostgreSQL no disponible — test omitido');
      return;
    }

    // RED: No existe comportamiento aún para este evento en outbox
    // GREEN: Insertamos fila pending y verificamos que el processor la procesa

    const eventId = randomUUID();
    const memberId = randomUUID();

    // Insertar evento pending directamente en outbox_events (simulando dual-write)
    await rawClient.outboxEvent.create({
      data: {
        id: eventId,
        tenantId: '00000000-0000-4000-a000-000000000001',
        boundedContext: 'BC-Membership',
        eventType: 'MemberRegistered',
        aggregateId: memberId,
        aggregateType: 'Member-Integration-Test',
        payload: {
          memberId,
          memberNumber: '42',
          memberTypeId: randomUUID(),
          name: 'Ana Test',
          surnames: 'García',
          email: 'ana.test@test.es',
          registrationDate: new Date().toISOString(),
        },
        actorId: null,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      },
    });

    // Ejecutar un tick del processor
    await processor.processOutbox();

    // Verificar que la fila cambió a 'processed'
    const updated = await rawClient.outboxEvent.findUnique({ where: { id: eventId } });

    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('processed');
    expect(updated!.processedAt).not.toBeNull();
    expect(updated!.processedAt).toBeInstanceOf(Date);

    // Verificar que EventBus.publish fue llamado con el evento reconstituido
    expect(eventBusMock.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBusMock.publish as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(publishedEvent).toBeInstanceOf(MemberRegisteredEvent);
    expect(publishedEvent.eventType).toBe('MemberRegistered');
    expect(publishedEvent.aggregateId).toBe(memberId);
  });

  it('debería resetear eventos stale (processing >5min) a pending en onApplicationBootstrap', async () => {
    if (!pgAvailable) {
      console.warn('PostgreSQL no disponible — test omitido');
      return;
    }

    const staleEventId = randomUUID();
    const memberId = randomUUID();

    // Insertar evento en estado 'processing' con processingStartedAt hace 10 minutos (stale)
    // El stale recovery compara processingStartedAt (no createdAt) contra el umbral de 5min.
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1_000);

    await rawClient.outboxEvent.create({
      data: {
        id: staleEventId,
        tenantId: '00000000-0000-4000-a000-000000000001',
        boundedContext: 'BC-Membership',
        eventType: 'MemberRegistered',
        aggregateId: memberId,
        aggregateType: 'Member-Integration-Test',
        payload: {
          memberId,
          memberNumber: '99',
          memberTypeId: randomUUID(),
          name: 'Stale Test',
          surnames: 'Evento',
          email: 'stale@test.es',
          registrationDate: new Date().toISOString(),
        },
        actorId: null,
        status: 'processing',
        retryCount: 0,
        maxRetries: 3,
        processingStartedAt: tenMinutesAgo,
      },
    });

    // Ejecutar bootstrap (simula reinicio del servidor)
    await processor.onApplicationBootstrap();

    // Verificar que el evento fue reseteado a 'pending'
    const reset = await rawClient.outboxEvent.findUnique({ where: { id: staleEventId } });

    expect(reset).not.toBeNull();
    expect(reset!.status).toBe('pending');
  });
});
