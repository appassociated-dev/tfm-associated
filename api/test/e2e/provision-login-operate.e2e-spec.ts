import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  closeTestApp,
  cleanupTenantDatabase,
  cleanupKnownE2eFixtures,
} from '../../src/shared/infrastructure/testing/create-test-app';
import { PrismaMainService } from '../../src/shared/infrastructure/persistence/prisma-main.service';
import { PrismaTenantService } from '../../src/shared/infrastructure/persistence/prisma-tenant.service';

/**
 * E2E Smoke Test: Provision → Login → Operate
 *
 * Verifica el flujo completo a través de la capa HTTP real:
 * 1. POST /api/v1/tenants — provisionar tenant con BD aislada
 * 2. POST /api/v1/auth/login — autenticar con credenciales del admin provisionado
 * 3. GET /api/v1/auth/me — verificar perfil del usuario (DB-Main)
 * 4. GET /api/v1/members — operar sobre la BD del tenant (trigger Bug 4)
 *
 * Requiere PostgreSQL corriendo (Docker Compose).
 * El paso 4 FALLA si PrismaTenantService construye mal el nombre de la BD (Bug 4):
 * PrismaTenantService usa DATABASE_TENANT_URL template que produce "tenant_{uuid}"
 * pero la BD se creó como "associated_{uuid_underscored}".
 */
describe('Provision → Login → Operate (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaMainService;
  let tenantService: PrismaTenantService;

  // Datos del tenant provisionado (para limpieza)
  let tenantId: string;
  let adminUserId: string;
  let databaseName: string;
  let accessToken: string;

  // Datos de provisión
  const provisionPayload = {
    name: 'Peña E2E Test',
    collectivityType: 'PENA',
    cif: 'G98765431',
    contactEmail: 'contacto-e2e@test.es',
    adminName: 'Admin E2E',
    adminEmail: 'admin-e2e@test.es',
    adminPassword: 'SecurePass123!',
  };

  // CIFs y emails usados en este test suite — limpiar antes de ejecutar
  const KNOWN_CIFS = ['G98765431'];
  const KNOWN_ADMIN_EMAILS = ['admin-e2e@test.es'];

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.module.get(PrismaMainService);
    tenantService = ctx.module.get(PrismaTenantService);

    // Limpiar fixtures de ejecuciones previas que pudieron fallar en afterAll
    await cleanupKnownE2eFixtures(prisma, KNOWN_CIFS, KNOWN_ADMIN_EMAILS);
  }, 120_000);

  afterAll(async () => {
    // PRIMERO cerrar la app para liberar conexiones del pool de PrismaTenantService
    if (app) {
      await closeTestApp(app);
    }

    // DESPUÉS limpiar datos y recursos PostgreSQL (ya sin conexiones activas)
    if (prisma && tenantId) {
      try {
        await prisma.tenantMembership.deleteMany({ where: { tenantId } });
        await prisma.role.deleteMany({ where: { tenantId } });
        if (adminUserId) {
          await prisma.user.deleteMany({ where: { id: adminUserId } });
        }
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      } catch {
        // Ignorar errores de limpieza
      }

      if (databaseName) {
        const username = `tenant_${tenantId.replace(/-/g, '_')}`;
        await cleanupTenantDatabase(prisma, databaseName, username);
      }
    }

    await prisma.$disconnect();
  }, 120_000);

  it('Step 1: POST /api/v1/tenants — provisionar tenant', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set('X-Api-Key', process.env.SUPERADMIN_API_KEY!)
      .send(provisionPayload);

    // Diagnóstico en caso de fallo
    if (response.status !== 201) {
      console.error('Provision failed:', response.status, JSON.stringify(response.body));
    }
    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty('tenantId');
    expect(response.body).toHaveProperty('slug');
    expect(response.body).toHaveProperty('adminUserId');

    tenantId = response.body.tenantId;
    adminUserId = response.body.adminUserId;
    databaseName = `associated_${tenantId.replace(/-/g, '_')}`;
  });

  it('Step 2: POST /api/v1/auth/login — autenticar admin provisionado', async () => {
    expect(tenantId).toBeDefined();

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: provisionPayload.adminEmail,
        password: provisionPayload.adminPassword,
      })
      .expect(200);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');

    accessToken = response.body.accessToken;
  });

  it('Step 3: GET /api/v1/auth/me — verificar perfil (DB-Main)', async () => {
    expect(accessToken).toBeDefined();

    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('email', provisionPayload.adminEmail);
  });

  it('Step 4: PrismaTenantService conecta a la BD del tenant correctamente (Bug 4 fix)', async () => {
    expect(tenantId).toBeDefined();

    // Verificar que PrismaTenantService puede conectarse a la BD del tenant.
    // Bug 4: antes del fix, PrismaTenantService usaba DATABASE_TENANT_URL template
    // que producía "tenant_{uuid}" en vez de "associated_{uuid_underscored}".
    // Con el fix, usa buildTenantDatabaseName() y credenciales de DATABASE_MAIN_URL.
    const client = await tenantService.getClient(tenantId);

    // Si la conexión es al DB correcto, esta query debería funcionar
    // (outbox_events es la única tabla creada por la migración actual)
    const result = await client.$queryRawUnsafe<{ count: bigint }[]>(
      'SELECT COUNT(*) as count FROM outbox_events',
    );

    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(Number(result[0].count)).toBe(0);
  });
});
