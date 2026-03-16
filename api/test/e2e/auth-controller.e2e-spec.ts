import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  createTestApp,
  closeTestApp,
  cleanupTenantDatabase,
} from '../../src/shared/infrastructure/testing/create-test-app';
import { PrismaMainService } from '../../src/shared/infrastructure/persistence/prisma-main.service';

/**
 * HTTP Integration Tests: AuthController
 *
 * Verifica los endpoints de autenticación a través de la pipeline HTTP completa:
 * - POST /api/v1/auth/login — público, no requiere JWT
 * - GET /api/v1/auth/me — protegido, requiere JWT válido
 * - POST /api/v1/auth/refresh — público, renueva access token
 * - POST /api/v1/auth/logout — protegido, requiere JWT
 *
 * Pre-requisito: provisiona un tenant real con usuario admin para tener
 * credenciales válidas contra las que autenticarse.
 *
 * NOTA: Los domain errors (InvalidCredentialsError, InvalidRefreshTokenError)
 * usan un patrón de error con propiedad `code` que el DomainExceptionFilter
 * mapea a HTTP status codes. El DomainExceptionFilter está registrado como
 * APP_FILTER global en ObservabilityModule.
 *
 * Requiere PostgreSQL corriendo (Docker Compose).
 */
describe('AuthController HTTP (/api/v1/auth/*)', () => {
  let app: INestApplication;
  let prisma: PrismaMainService;

  // Estado del tenant provisionado
  let tenantId: string;
  let adminUserId: string;

  // Credenciales de test
  const adminEmail = 'auth-e2e@test.es';
  const adminPassword = 'SecurePass123!';

  // Tokens obtenidos durante el test
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.module.get(PrismaMainService);

    // Provisionar un tenant para tener un usuario contra el que autenticarse
    // CIF G87654323: calculado con algoritmo español (control=3 para dígitos 8765432)
    const apiKey = process.env.SUPERADMIN_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }

    const provisionResponse = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set(headers)
      .send({
        name: 'Club Auth E2E',
        collectivityType: 'PENA',
        cif: 'G87654323',
        contactEmail: 'auth-club-e2e@test.es',
        adminName: 'Admin Auth E2E',
        adminEmail,
        adminPassword,
      });

    if (provisionResponse.status !== 201) {
      throw new Error(
        `No se pudo provisionar tenant para tests de auth: ${provisionResponse.status} ${JSON.stringify(provisionResponse.body)}`,
      );
    }

    tenantId = provisionResponse.body.tenantId;
    adminUserId = provisionResponse.body.adminUserId;
  }, 120_000);

  afterAll(async () => {
    // PRIMERO cerrar la app para liberar conexiones del pool de PrismaTenantService
    if (app) {
      await closeTestApp(app);
    }

    // DESPUÉS limpiar datos y recursos PostgreSQL (ya sin conexiones activas)
    if (prisma && tenantId) {
      try {
        await prisma.refreshToken.deleteMany({ where: { userId: adminUserId } });
        await prisma.tenantMembership.deleteMany({ where: { tenantId } });
        await prisma.role.deleteMany({ where: { tenantId } });
        if (adminUserId) {
          await prisma.user.deleteMany({ where: { id: adminUserId } });
        }
        await prisma.tenant.deleteMany({ where: { id: tenantId } });
      } catch {
        // Ignorar errores de limpieza
      }

      const databaseName = `associated_${tenantId.replace(/-/g, '_')}`;
      const username = `tenant_${tenantId.replace(/-/g, '_')}`;
      await cleanupTenantDatabase(prisma, databaseName, username);
    }

    await prisma.$disconnect();
  }, 120_000);

  // --- POST /api/v1/auth/login ---

  describe('POST /api/v1/auth/login', () => {
    it('debería autenticar con credenciales válidas → 200', async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: adminEmail,
        password: adminPassword,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      // Guardar tokens para tests posteriores
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('debería rechazar credenciales inválidas (no retorna 200)', async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: adminEmail,
        password: 'contraseña-incorrecta',
      });

      // InvalidCredentialsError tiene code 'AUTH.INVALID_CREDENTIALS'.
      // DomainExceptionFilter (APP_FILTER global) mapea a 401.
      expect(response.status).toBe(401);
    });

    it('debería rechazar usuario inexistente (no retorna 200)', async () => {
      const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: 'noexiste@test.es',
        password: 'cualquierCosa123!',
      });

      // InvalidCredentialsError (usuario inexistente) → 401.
      expect(response.status).toBe(401);
    });

    it('debería ser accesible sin Bearer token (endpoint @Public)', async () => {
      // login tiene @Public(), así que JwtAuthGuard no debe bloquear
      const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({
        email: adminEmail,
        password: adminPassword,
      });

      // Si JwtAuthGuard bloqueara, retornaría 401 sin llegar al handler
      expect(response.status).toBe(200);

      // Actualizar tokens por si se rotaron
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });
  });

  // --- GET /api/v1/auth/me ---

  describe('GET /api/v1/auth/me', () => {
    it('debería retornar perfil con JWT válido → 200', async () => {
      expect(accessToken).toBeDefined();

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', adminEmail);
    });

    it('debería rechazar sin Bearer token → 401', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/auth/me');

      // JwtAuthGuard usa NestJS UnauthorizedException (HttpException) → 401
      expect(response.status).toBe(401);
    });

    it('debería rechazar con Bearer token inválido → 401', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer token-inventado-totalmente-falso');

      expect(response.status).toBe(401);
    });
  });

  // --- POST /api/v1/auth/refresh ---

  describe('POST /api/v1/auth/refresh', () => {
    it('debería renovar token con refresh token válido → 200', async () => {
      expect(refreshToken).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');

      // Actualizar access token con el nuevo
      accessToken = response.body.accessToken;
      // Si devuelve nuevo refresh token, actualizarlo también
      if (response.body.refreshToken) {
        refreshToken = response.body.refreshToken;
      }
    });

    it('debería rechazar refresh token inválido (no retorna 200)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'refresh-token-inventado-falso' });

      // InvalidRefreshTokenError tiene code 'AUTH.INVALID_REFRESH_TOKEN'.
      // DomainExceptionFilter (APP_FILTER global) mapea a 401.
      expect(response.status).toBe(401);
    });

    it('debería ser accesible sin Bearer token (endpoint @Public)', async () => {
      // refresh tiene @Public(), no requiere JWT para llamarse.
      // Usamos un refresh token válido para verificar que no se bloquea por JWT.
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      // El request llega al handler (no bloqueado por JwtAuthGuard).
      // Si retorna 200, el refresh funcionó sin JWT.
      // Si retorna 401 con error.code, es un domain error (token ya consumido),
      // NO un bloqueo de JwtAuthGuard (que retornaría 401 sin error.code).
      if (response.status === 401) {
        // Verificar que es un domain error, no JwtAuthGuard
        expect(response.body?.error?.code).toBe('AUTH.INVALID_REFRESH_TOKEN');
      } else {
        expect(response.status).toBe(200);
      }
    });
  });

  // --- POST /api/v1/auth/logout ---

  describe('POST /api/v1/auth/logout', () => {
    it('debería rechazar sin Bearer token → 401', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'cualquiera' });

      // logout NO tiene @Public(), requiere JWT.
      // JwtAuthGuard usa NestJS UnauthorizedException → 401
      expect(response.status).toBe(401);
    });

    it('debería cerrar sesión con JWT válido → 204', async () => {
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(response.status).toBe(204);
    });
  });
});
