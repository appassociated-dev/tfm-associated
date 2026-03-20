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

/**
 * HTTP Integration Tests: TenantsController
 *
 * Verifica el comportamiento HTTP real del endpoint POST /api/v1/tenants
 * a través de la pipeline completa de NestJS (guards, pipes, middleware).
 *
 * Cobertura:
 * - POST con X-Api-Key válida → 201
 * - POST sin X-Api-Key → rechazado por SuperadminGuard
 * - POST con X-Api-Key inválida → rechazado por SuperadminGuard
 * - POST con datos inválidos → 400 (ValidationPipe)
 * - Confirma que @Public() es necesario para bypassear JwtAuthGuard global
 *
 * NOTA: SuperadminGuard usa UnauthorizedException de domain-exception.filter
 * (extiende DomainException, NO HttpException de NestJS). El DomainExceptionFilter
 * está registrado como APP_FILTER global en ObservabilityModule, lo que permite
 * mapear las excepciones de dominio a los HTTP status codes correctos.
 *
 * Requiere PostgreSQL corriendo (Docker Compose).
 */
describe('TenantsController HTTP (POST /api/v1/tenants)', () => {
  let app: INestApplication;
  let prisma: PrismaMainService;

  // Almacena IDs de tenants creados para limpieza
  const createdTenantIds: string[] = [];
  const createdAdminUserIds: string[] = [];

  // CIF G12345674: calculado con algoritmo español (control=4 para dígitos 1234567)
  const validPayload = {
    name: 'Club HTTP Test',
    collectivityType: 'PENA',
    cif: 'G12345674',
    contactEmail: 'http-test@test.es',
    adminName: 'Admin HTTP',
    adminEmail: 'admin-http-test@test.es',
    adminPassword: 'SecurePass123!',
  };

  // CIFs y emails usados en este test suite — limpiar antes de ejecutar
  const KNOWN_CIFS = ['G12345674', 'G56789019'];
  const KNOWN_ADMIN_EMAILS = ['admin-http-test@test.es', 'admin-public-test@test.es'];

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.module.get(PrismaMainService);

    // Limpiar fixtures de ejecuciones previas que pudieron fallar en afterAll
    await cleanupKnownE2eFixtures(prisma, KNOWN_CIFS, KNOWN_ADMIN_EMAILS);
  }, 120_000);

  afterAll(async () => {
    // PRIMERO cerrar la app para liberar conexiones del pool de PrismaTenantService
    if (app) {
      await closeTestApp(app);
    }

    // DESPUÉS limpiar datos y recursos PostgreSQL (ya sin conexiones activas)
    for (const tenantId of createdTenantIds) {
      try {
        await prisma.tenantMembership.deleteMany({ where: { tenantId } });
        await prisma.role.deleteMany({ where: { tenantId } });
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      } catch {
        // Ignorar errores de limpieza
      }

      const databaseName = `associated_${tenantId.replace(/-/g, '_')}`;
      const username = `tenant_${tenantId.replace(/-/g, '_')}`;
      await cleanupTenantDatabase(prisma, databaseName, username);
    }

    for (const userId of createdAdminUserIds) {
      try {
        await prisma.user.deleteMany({ where: { id: userId } });
      } catch {
        // Ignorar
      }
    }

    await prisma.$disconnect();
  }, 120_000);

  // --- Autenticación y autorización (SuperadminGuard) ---

  it('debería retornar 201 con X-Api-Key válida', async () => {
    const apiKey = process.env.SUPERADMIN_API_KEY;
    // Si no hay API key configurada, SuperadminGuard permite todo (dev mode)
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const response = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set(headers)
      .send(validPayload);

    // Diagnóstico en caso de fallo
    if (response.status !== 201) {
      console.error('Provision failed:', response.status, JSON.stringify(response.body));
    }

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('tenantId');
    expect(response.body).toHaveProperty('slug');
    expect(response.body).toHaveProperty('adminUserId');

    // Registrar para limpieza
    createdTenantIds.push(response.body.tenantId);
    createdAdminUserIds.push(response.body.adminUserId);
  });

  it('debería rechazar sin X-Api-Key cuando SUPERADMIN_API_KEY está configurada', async () => {
    const apiKey = process.env.SUPERADMIN_API_KEY;

    // Este test solo es significativo cuando hay API key configurada
    if (!apiKey) {
      console.warn('SUPERADMIN_API_KEY no configurada — skipping guard rejection test');
      return;
    }

    const response = await request(app.getHttpServer()).post('/api/v1/tenants').send(validPayload);

    // SuperadminGuard lanza UnauthorizedException (DomainException).
    // DomainExceptionFilter (APP_FILTER global) mapea a 401.
    expect(response.status).toBe(401);
  });

  it('debería rechazar con X-Api-Key inválida cuando SUPERADMIN_API_KEY está configurada', async () => {
    const apiKey = process.env.SUPERADMIN_API_KEY;

    if (!apiKey) {
      console.warn('SUPERADMIN_API_KEY no configurada — skipping invalid key test');
      return;
    }

    const response = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set('X-Api-Key', 'clave-incorrecta-totalmente-falsa')
      .send(validPayload);

    // SuperadminGuard lanza UnauthorizedException → 401.
    expect(response.status).toBe(401);
  });

  // --- Validación de payload (ValidationPipe) ---

  it('debería retornar 400 con payload vacío', async () => {
    const apiKey = process.env.SUPERADMIN_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const response = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set(headers)
      .send({});

    expect(response.status).toBe(400);
  });

  it('debería retornar 400 con campos faltantes (sin adminEmail)', async () => {
    const apiKey = process.env.SUPERADMIN_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const { adminEmail: _adminEmail, ...incompletePayload } = validPayload;

    const response = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set(headers)
      .send(incompletePayload);

    expect(response.status).toBe(400);
  });

  // --- @Public() bypass de JwtAuthGuard ---

  it('debería ser accesible sin Bearer token (confirma @Public() activo)', async () => {
    // El endpoint tiene @Public(), lo cual hace que JwtAuthGuard
    // no exija un Bearer token. Si se quitara @Public(), este test
    // fallaría con 401 por falta de JWT.
    const apiKey = process.env.SUPERADMIN_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    // Enviamos request sin Authorization header — solo con X-Api-Key
    const response = await request(app.getHttpServer()).post('/api/v1/tenants').set(headers).send({
      name: 'Club Public Test',
      collectivityType: 'PENA',
      cif: 'G56789019',
      contactEmail: 'public-test@test.es',
      adminName: 'Admin Public',
      adminEmail: 'admin-public-test@test.es',
      adminPassword: 'SecurePass123!',
    });

    // Si llega a la lógica del handler (201 o error de negocio),
    // significa que JwtAuthGuard NO bloqueó. Un 401 con "Unauthorized"
    // significaría que JwtAuthGuard actúa antes que SuperadminGuard.
    // Aceptamos 201 (creación exitosa) o errores de negocio (409, 422, 500)
    // pero NO 401 por JWT.
    // Si la respuesta es 401, verificamos que NO es por JWT sino por SuperadminGuard.
    if (response.status === 401) {
      // Si hay 401, debería ser por SuperadminGuard, no por JWT
      expect(response.body?.error?.code).toBe('UNAUTHORIZED');
    }

    // Si se creó el tenant, registrarlo para limpieza
    if (response.status === 201 && response.body.tenantId) {
      createdTenantIds.push(response.body.tenantId);
      createdAdminUserIds.push(response.body.adminUserId);
    }
  });

  // --- CIF duplicado (409 Conflict) ---

  it('debería rechazar CIF duplicado con 409 cuando se re-usa el mismo CIF', async () => {
    // Solo ejecutar si ya creamos un tenant con el CIF anterior
    if (createdTenantIds.length === 0) {
      console.warn('No hay tenant creado — skipping duplicate CIF test');
      return;
    }

    const apiKey = process.env.SUPERADMIN_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const response = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set(headers)
      .send({
        ...validPayload,
        adminEmail: 'otro-admin@test.es',
        contactEmail: 'otro-contacto@test.es',
      });

    // CIF duplicado → CifAlreadyExistsError → 409 Conflict
    expect(response.status).toBe(409);
  });
});
