import 'dotenv/config';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma-main';
import { PrismaMainService } from '../prisma-main.service';
import { PrismaIntegrationEventPublisher } from '../prisma-integration-event.publisher';
import { ErrorReporter } from '../../../domain/ports/error-reporter.port';
import { MemberRegisteredEvent } from '../../../../membership/domain/events/member-registered.event';

/**
 * Tests de integración para PrismaIntegrationEventPublisher (dual-write).
 * D-003: Verifica que publisher.publish() escribe la fila en DB-Main con todos los campos ENT-006.
 *
 * Requiere PostgreSQL corriendo (Docker Compose o DATABASE_MAIN_URL configurado).
 * Ejecutar con: npm run test:integration
 *
 * Escenario:
 * - Llamar publisher.publish(tenantId, [event]) → verificar fila en outbox_events con todos los campos
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

describe('PrismaIntegrationEventPublisher Integration', () => {
  let pgAvailable: boolean;
  let rawClient: PrismaClient;
  let prismaMainService: PrismaMainService;
  let publisher: PrismaIntegrationEventPublisher;
  let errorReporterMock: ErrorReporter;

  beforeAll(async () => {
    pgAvailable = await isPostgresAvailable();
    if (!pgAvailable) return;

    // Crear cliente raw para verificaciones directas en BD
    const adapter = new PrismaPg({ connectionString: DATABASE_MAIN_URL });
    rawClient = new PrismaClient({ adapter });
    await rawClient.$connect();

    // Crear PrismaMainService de test
    prismaMainService = new PrismaMainService();
    await prismaMainService.$connect();

    // Mock del ErrorReporter
    errorReporterMock = {
      captureException: vi.fn(),
    } as unknown as ErrorReporter;

    // Crear el publisher con dependencias reales (BD) y mock (ErrorReporter)
    publisher = new PrismaIntegrationEventPublisher(prismaMainService, errorReporterMock);
  }, 30_000);

  afterAll(async () => {
    if (!pgAvailable) return;
    await prismaMainService?.$disconnect();
    await rawClient?.$disconnect();
  }, 15_000);

  beforeEach(async () => {
    if (!pgAvailable) return;
    // Limpiar eventos del outbox de tests anteriores
    await rawClient.outboxEvent.deleteMany({
      where: { aggregateType: 'Member-Publisher-Integration-Test' },
    });
    vi.clearAllMocks();
  });

  it('debería escribir una fila con todos los campos ENT-006 correctamente', async () => {
    if (!pgAvailable) {
      console.warn('PostgreSQL no disponible — test omitido');
      return;
    }

    const tenantId = '00000000-0000-4000-a000-000000000002';
    const memberId = randomUUID();
    const actorId = randomUUID();

    // Crear evento de dominio
    const event = new MemberRegisteredEvent({
      payload: {
        memberId,
        memberNumber: '123',
        memberTypeId: randomUUID(),
        name: 'Carlos Test',
        surnames: 'Rodríguez',
        email: 'carlos.test@test.es',
        registrationDate: new Date('2026-01-15'),
      },
      aggregateId: memberId,
      aggregateType: 'Member-Publisher-Integration-Test',
      boundedContext: 'BC-Membership',
      actorId,
    });

    // Ejecutar el publisher
    await publisher.publish(tenantId, [event]);

    // Verificar que la fila existe con todos los campos ENT-006
    const row = await rawClient.outboxEvent.findUnique({ where: { id: event.eventId } });

    expect(row).not.toBeNull();

    // Campos de identidad del evento
    expect(row!.id).toBe(event.eventId);
    expect(row!.eventType).toBe('MemberRegistered');
    expect(row!.aggregateId).toBe(memberId);
    expect(row!.aggregateType).toBe('Member-Publisher-Integration-Test');
    expect(row!.boundedContext).toBe('BC-Membership');

    // Campos de tenant y actor
    expect(row!.tenantId).toBe(tenantId);
    expect(row!.actorId).toBe(actorId);

    // Estado inicial del outbox
    expect(row!.status).toBe('pending');
    expect(row!.retryCount).toBe(0);
    expect(row!.maxRetries).toBe(3);
    expect(row!.processedAt).toBeNull();

    // Payload serializado correctamente
    const payload = row!.payload as Record<string, unknown>;
    expect(payload.memberId).toBe(memberId);
    expect(payload.memberNumber).toBe('123');
    expect(payload.name).toBe('Carlos Test');
    expect(payload.surnames).toBe('Rodríguez');
    expect(payload.email).toBe('carlos.test@test.es');

    // ErrorReporter no fue llamado (sin errores)
    expect(errorReporterMock.captureException).not.toHaveBeenCalled();
  });

  it('debería escribir múltiples filas cuando se publican varios eventos', async () => {
    if (!pgAvailable) {
      console.warn('PostgreSQL no disponible — test omitido');
      return;
    }

    const tenantId = '00000000-0000-4000-a000-000000000002';

    const events = [1, 2, 3].map((n) => {
      const memberId = randomUUID();
      return new MemberRegisteredEvent({
        payload: {
          memberId,
          memberNumber: String(n),
          memberTypeId: randomUUID(),
          name: `Socio ${n}`,
          surnames: 'Test',
          email: `socio${n}.test@test.es`,
          registrationDate: new Date(),
        },
        aggregateId: memberId,
        aggregateType: 'Member-Publisher-Integration-Test',
        boundedContext: 'BC-Membership',
      });
    });

    await publisher.publish(tenantId, events);

    // Verificar que se crearon 3 filas
    const rows = await rawClient.outboxEvent.findMany({
      where: { id: { in: events.map((e) => e.eventId) } },
    });

    expect(rows).toHaveLength(3);
    rows.forEach((row) => {
      expect(row.status).toBe('pending');
      expect(row.tenantId).toBe(tenantId);
      expect(row.eventType).toBe('MemberRegistered');
    });
  });

  it('debería manejar tenantId null (evento de sistema como ProvisionTenant)', async () => {
    if (!pgAvailable) {
      console.warn('PostgreSQL no disponible — test omitido');
      return;
    }

    const memberId = randomUUID();
    const event = new MemberRegisteredEvent({
      payload: {
        memberId,
        memberNumber: '0',
        memberTypeId: randomUUID(),
        name: 'Sistema Test',
        surnames: 'Sin Tenant',
        email: 'sistema@test.es',
        registrationDate: new Date(),
      },
      aggregateId: memberId,
      aggregateType: 'Member-Publisher-Integration-Test',
      boundedContext: 'BC-Membership',
    });

    // tenantId = null (como en ProvisionTenantHandler)
    await publisher.publish(null, [event]);

    const row = await rawClient.outboxEvent.findUnique({ where: { id: event.eventId } });
    expect(row).not.toBeNull();
    expect(row!.tenantId).toBeNull();
    expect(row!.status).toBe('pending');
  });
});
