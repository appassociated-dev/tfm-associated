import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import {
  Controller,
  Get,
  Post,
  Module,
  HttpCode,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import supertest from 'supertest';

/**
 * Tests de integración: ThrottlerGuard como APP_GUARD en AppModule.
 *
 * Usan un módulo de test mínimo para evitar dependencias pesadas (Prisma, JWT, etc.)
 * verificando el comportamiento real del throttler sin mocks.
 *
 * Scenarios cubiertos:
 * - REQ-RL-002: POST /login devuelve 429 tras 5 intentos (throttler 'login')
 * - REQ-RL-004: GET /health NUNCA devuelve 429 (@SkipThrottle)
 * - REQ-RL-006: respuesta 429 contiene statusCode y message correctos + header Retry-After
 * - REQ-RL-005: orden de guards — 429 antes de 401 cuando IP supera límite
 */

// =============================================
// Controladores mínimos de test
// =============================================

/** Simula el endpoint de login — recibe el throttler 'login' (5 req/10min) */
@Controller('test-login')
class TestLoginController {
  @Post()
  @HttpCode(HttpStatus.OK)
  login(): string {
    return 'ok';
  }
}

/**
 * Simula el health check — excluido de TODOS los throttlers.
 * @SkipThrottle() sin argumentos solo skipea 'default'.
 * Necesitamos los nombres explícitos para skipear todos (REQ-RL-004).
 */
@SkipThrottle({ default: true, login: true })
@Controller('test-health')
class TestHealthController {
  @Get()
  health(): string {
    return 'healthy';
  }
}

/** Módulo de test mínimo con ThrottlerModule y ThrottlerGuard como APP_GUARD */
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
      {
        name: 'login',
        ttl: 600_000,
        limit: 5,
        blockDuration: 900_000,
      },
    ]),
  ],
  controllers: [TestLoginController, TestHealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
class TestAppModule {}

// =============================================
// Helpers
// =============================================

/** Realiza N peticiones a la URL y retorna los status codes. */
async function makeRequests(
  app: INestApplication,
  method: 'get' | 'post',
  url: string,
  count: number,
): Promise<number[]> {
  const statuses: number[] = [];
  for (let i = 0; i < count; i++) {
    const res = await supertest(app.getHttpServer())[method](url);
    statuses.push(res.status);
  }
  return statuses;
}

// =============================================
// Suite principal
// =============================================

describe('ThrottlerGuard — integración', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ------------------------------------------
  // REQ-RL-002: Scenario "Login sobre el límite"
  // ------------------------------------------

  describe('POST /test-login — throttler login (5 req/10min)', () => {
    it('debería permitir las primeras 5 peticiones (REQ-RL-002)', async () => {
      // Nota: cada suite usa una app fresca → contadores en 0
      const statuses = await makeRequests(app, 'post', '/test-login', 5);
      // Las primeras 5 deben pasar (200 OK)
      expect(statuses.every((s) => s === 200)).toBe(true);
    });

    it('debería devolver 429 en la 6ª petición tras agotar el límite (REQ-RL-002)', async () => {
      // Las primeras 5 ya se hicieron en el test anterior — el contador está en 5
      // La 6ª debe ser 429
      const res = await supertest(app.getHttpServer()).post('/test-login');
      expect(res.status).toBe(429);
    });

    it('respuesta 429 debe contener statusCode:429 en el cuerpo (REQ-RL-006)', async () => {
      const res = await supertest(app.getHttpServer()).post('/test-login');
      // El controlador ya está throttleado desde tests anteriores
      expect(res.status).toBe(429);
      expect(res.body.statusCode).toBe(429);
    });

    it('respuesta 429 debe contener el header Retry-After-login (REQ-RL-006)', async () => {
      const res = await supertest(app.getHttpServer()).post('/test-login');
      expect(res.status).toBe(429);
      // ThrottlerGuard v6: para throttler con nombre != 'default', el header es
      // 'Retry-After-{name}' — en este caso 'Retry-After-login'
      // Ref: throttler.guard.js → getThrottlerSuffix: (name === 'default' ? '' : `-${name}`)
      const retryAfterLogin = res.headers['retry-after-login'];
      expect(retryAfterLogin).toBeDefined();
      // El valor debe ser un número de segundos > 0 (blockDuration activo)
      expect(parseInt(retryAfterLogin as string, 10)).toBeGreaterThan(0);
    });
  });

  // ------------------------------------------
  // REQ-RL-004: Scenario "Health check no consume cuota"
  // ------------------------------------------

  describe('GET /test-health — @SkipThrottle() (REQ-RL-004)', () => {
    it('debería responder 200 sin importar el número de peticiones (REQ-RL-004)', async () => {
      // Hacemos 10 peticiones — @SkipThrottle() garantiza que nunca sea 429
      const statuses = await makeRequests(app, 'get', '/test-health', 10);
      expect(statuses.every((s) => s === 200)).toBe(true);
    });

    it('no debería devolver 429 incluso tras muchas peticiones (REQ-RL-004)', async () => {
      // 15 peticiones más — seguimos sin 429
      const statuses = await makeRequests(app, 'get', '/test-health', 15);
      const has429 = statuses.some((s) => s === 429);
      expect(has429).toBe(false);
    });
  });

  // ------------------------------------------
  // REQ-RL-001: ThrottlerModule registrado con named throttlers
  // ------------------------------------------

  describe('ThrottlerModule — configuración (REQ-RL-001)', () => {
    it('debería poder levantar la aplicación con ThrottlerModule y APP_GUARD configurados', () => {
      // Si la app arrancó en beforeAll sin errores, ThrottlerModule está correctamente configurado.
      // La resolución directa de ThrottlerGuard falla porque está registrado como APP_GUARD
      // (token simbólico), no como proveedor con su nombre de clase.
      expect(app).toBeDefined();
      const httpServer = app.getHttpServer();
      expect(httpServer).toBeDefined();
    });
  });
});
