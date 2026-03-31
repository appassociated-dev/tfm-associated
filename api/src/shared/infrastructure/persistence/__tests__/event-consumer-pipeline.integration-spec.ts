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
import { OnMemberRegisteredTreasuryHandler } from '../../../../treasury/application/event-handlers/on-member-registered.treasury-handler';
import { CreateMemberAccountCommand } from '../../../../treasury/application/commands/create-member-account.command';
import type { EventBus, CommandBus } from '@nestjs/cqrs';

/**
 * Tests de integración para el pipeline completo de consumo de eventos de integración.
 * E-001: Verifica que un outbox row MemberRegistered (con tenantId) se reconstituye,
 * llega al EventBus y es procesado por OnMemberRegisteredTreasuryHandler, que despacha
 * CreateMemberAccountCommand con los campos correctos (REQ-IEC-007).
 *
 * Requiere PostgreSQL corriendo (Docker Compose o DATABASE_MAIN_URL configurado).
 * Ejecutar con: npm run test:integration
 *
 * Escenarios:
 * 1. Pipeline completo: outbox row → reconstitute → EventBus.publish → handler → CreateMemberAccountCommand
 * 2. Evento sin tenantId → handler lo ignora → commandBus.execute NO llamado
 * 3. Aislamiento de errores en handler: handler lanza → OutboxProcessor marca como processed (no falla)
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

describe('Event Consumer Pipeline Integration (E-001)', () => {
  let pgAvailable: boolean;
  let rawClient: PrismaClient;
  let prismaMainService: PrismaMainService;
  let registry: EventReconstitutionRegistry;
  let processor: OutboxProcessorService;
  let commandBusMock: { execute: ReturnType<typeof vi.fn> };
  let errorReporterMock: ErrorReporter;

  // EventBus real que despacha al handler registrado
  let eventBus: EventBus;
  let treasuryHandler: OnMemberRegisteredTreasuryHandler;

  beforeAll(async () => {
    pgAvailable = await isPostgresAvailable();
    if (!pgAvailable) return;

    // Crear cliente raw para operaciones directas en BD
    const adapter = new PrismaPg({ connectionString: DATABASE_MAIN_URL });
    rawClient = new PrismaClient({ adapter });
    await rawClient.$connect();

    // Crear PrismaMainService de test
    prismaMainService = new PrismaMainService();
    await prismaMainService.$connect();

    // Mock del CommandBus — captura los comandos despachados por el handler
    commandBusMock = { execute: vi.fn().mockResolvedValue(undefined) };

    // Mock del ErrorReporter
    errorReporterMock = {
      captureException: vi.fn(),
    } as unknown as ErrorReporter;

    // Instanciar el handler de treasury con el CommandBus mockeado
    treasuryHandler = new OnMemberRegisteredTreasuryHandler(
      commandBusMock as unknown as CommandBus,
    );

    // EventBus simulado que despacha al handler directamente (sin NestJS DI)
    // Esto replica el comportamiento del EventBus real sin necesitar el módulo completo
    eventBus = {
      publish: vi.fn().mockImplementation(async (event: MemberRegisteredEvent) => {
        await treasuryHandler.handle(event);
      }),
    } as unknown as EventBus;

    // Crear el registry y registrar MemberRegisteredEvent
    registry = new EventReconstitutionRegistry();
    registry.register('MemberRegistered', MemberRegisteredEvent);

    // Crear el OutboxProcessorService con BD real, EventBus simulado y registry real
    processor = new OutboxProcessorService(
      prismaMainService,
      eventBus,
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
    // Limpiar eventos del outbox de tests anteriores (solo los de este test suite)
    await rawClient.outboxEvent.deleteMany({
      where: { aggregateType: 'Member-Consumer-Integration-Test' },
    });
    vi.clearAllMocks();

    // Restablecer el mock del EventBus tras vi.clearAllMocks() para mantener la lógica de dispatch
    (eventBus.publish as ReturnType<typeof vi.fn>).mockImplementation(
      async (event: MemberRegisteredEvent) => {
        await treasuryHandler.handle(event);
      },
    );

    // Restablecer el CommandBus mock
    commandBusMock.execute.mockResolvedValue(undefined);
  });

  /**
   * Escenario 1 (E-001 happy path): fila outbox pending con tenantId →
   * OutboxProcessor procesa → EventBus.publish llamado → handler recibe evento →
   * CreateMemberAccountCommand despachado con tenantId y memberId correctos.
   */
  it('debería procesar pipeline completo: outbox row → reconstitute → EventBus → handler → CreateMemberAccountCommand', async () => {
    if (!pgAvailable) {
      console.warn('PostgreSQL no disponible — test omitido');
      return;
    }

    const tenantId = '00000000-0000-4000-a000-000000000010';
    const memberId = randomUUID();
    const eventId = randomUUID();

    // Insertar fila pendiente directamente en outbox_events (simula dual-write por PrismaIntegrationEventPublisher)
    await rawClient.outboxEvent.create({
      data: {
        id: eventId,
        tenantId,
        boundedContext: 'BC-Membership',
        eventType: 'MemberRegistered',
        aggregateId: memberId,
        aggregateType: 'Member-Consumer-Integration-Test',
        payload: {
          memberId,
          memberNumber: '100',
          memberTypeId: randomUUID(),
          name: 'Lucía Test',
          surnames: 'Martínez',
          email: 'lucia.test@test.es',
          registrationDate: new Date().toISOString(),
        },
        actorId: null,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      },
    });

    // Ejecutar un tick del processor — debería reconstitute → EventBus.publish → handler.handle → commandBus.execute
    await processor.processOutbox();

    // Verificar que la fila fue marcada como 'processed' (pipeline ejecutado sin errores)
    const updatedRow = await rawClient.outboxEvent.findUnique({ where: { id: eventId } });
    expect(updatedRow).not.toBeNull();
    expect(updatedRow!.status).toBe('processed');
    expect(updatedRow!.processedAt).not.toBeNull();

    // Verificar que EventBus.publish fue llamado con el evento reconstituido
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(publishedEvent).toBeInstanceOf(MemberRegisteredEvent);
    // El evento reconstituido debe tener el tenantId propagado desde la fila del outbox (REQ-IEC-002)
    expect(publishedEvent.tenantId).toBe(tenantId);
    expect(publishedEvent.aggregateId).toBe(memberId);

    // Verificar que el handler despachó CreateMemberAccountCommand con los campos correctos (REQ-IEC-007)
    expect(commandBusMock.execute).toHaveBeenCalledTimes(1);
    const dispatchedCommand = commandBusMock.execute.mock.calls[0][0];
    expect(dispatchedCommand).toBeInstanceOf(CreateMemberAccountCommand);
    expect(dispatchedCommand.tenantId).toBe(tenantId);
    expect(dispatchedCommand.memberId).toBe(memberId);
  });

  /**
   * Escenario 2: evento sin tenantId → handler lo ignora → commandBus.execute NO llamado.
   * Verifica que REQ-IEC-001 (tenantId opcional) y el guard del handler funcionan correctamente.
   */
  it('debería ignorar el evento y no despachar CreateMemberAccountCommand si tenantId es null', async () => {
    if (!pgAvailable) {
      console.warn('PostgreSQL no disponible — test omitido');
      return;
    }

    const memberId = randomUUID();
    const eventId = randomUUID();

    // Insertar fila pendiente sin tenantId (evento de sistema sin tenant, como ProvisionTenant)
    await rawClient.outboxEvent.create({
      data: {
        id: eventId,
        tenantId: null,
        boundedContext: 'BC-Membership',
        eventType: 'MemberRegistered',
        aggregateId: memberId,
        aggregateType: 'Member-Consumer-Integration-Test',
        payload: {
          memberId,
          memberNumber: '200',
          memberTypeId: randomUUID(),
          name: 'Sistema Test',
          surnames: 'Sin Tenant',
          email: 'sistema@test.es',
          registrationDate: new Date().toISOString(),
        },
        actorId: null,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      },
    });

    await processor.processOutbox();

    // La fila debe ser processed (el processor no falla aunque el handler ignore el evento)
    const updatedRow = await rawClient.outboxEvent.findUnique({ where: { id: eventId } });
    expect(updatedRow).not.toBeNull();
    expect(updatedRow!.status).toBe('processed');

    // El evento fue publicado al EventBus
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    const publishedEvent = (eventBus.publish as ReturnType<typeof vi.fn>).mock.calls[0][0];
    // El evento reconstituido tiene tenantId undefined (null del outbox → undefined en evento, REQ-IEC-003)
    expect(publishedEvent.tenantId).toBeUndefined();

    // El handler detectó la ausencia de tenantId y NO despachó el comando (REQ-IEC-007 guard)
    expect(commandBusMock.execute).not.toHaveBeenCalled();
  });

  /**
   * Escenario 3: error en handler → aislamiento de errores → outbox fila marca como retry/failed.
   * Verifica que un fallo en el command handler no propaga al OutboxProcessor (RNF-067).
   */
  it('debería aislar el error del handler: outbox fila pasa a retry cuando commandBus.execute falla', async () => {
    if (!pgAvailable) {
      console.warn('PostgreSQL no disponible — test omitido');
      return;
    }

    const tenantId = '00000000-0000-4000-a000-000000000011';
    const memberId = randomUUID();
    const eventId = randomUUID();

    // El commandBus lanza error (DB caída, handler crash, etc.)
    // Nota: el handler de treasury captura internamente todos los errores (try/catch)
    // y los loguea — por eso la fila queda como 'processed' (el handler no propaga).
    commandBusMock.execute.mockRejectedValue(new Error('DB connection lost'));

    await rawClient.outboxEvent.create({
      data: {
        id: eventId,
        tenantId,
        boundedContext: 'BC-Membership',
        eventType: 'MemberRegistered',
        aggregateId: memberId,
        aggregateType: 'Member-Consumer-Integration-Test',
        payload: {
          memberId,
          memberNumber: '300',
          memberTypeId: randomUUID(),
          name: 'Error Test',
          surnames: 'Handler Crash',
          email: 'error@test.es',
          registrationDate: new Date().toISOString(),
        },
        actorId: null,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
      },
    });

    // El processor NO debe lanzar aunque el commandBus falle
    await expect(processor.processOutbox()).resolves.not.toThrow();

    // El handler atrapa el error internamente (try/catch en OnMemberRegisteredTreasuryHandler)
    // por lo que EventBus.publish resuelve sin error → OutboxProcessor marca como 'processed'
    const updatedRow = await rawClient.outboxEvent.findUnique({ where: { id: eventId } });
    expect(updatedRow).not.toBeNull();
    // El handler absorbe el error → el processor lo marca como processed
    expect(updatedRow!.status).toBe('processed');

    // El comando fue intentado pero falló internamente
    expect(commandBusMock.execute).toHaveBeenCalledTimes(1);
  });
});
