// Tests para el HttpClient (http-client.ts).
// Valida interceptores de request/response, refresh de tokens con cola
// de peticiones concurrentes, transformación de errores a ApiError, y
// headers de autenticación y tenant.
//
// Usa MSW para interceptar peticiones HTTP a nivel de red.
// Mockea getAccessToken/setTokens (module-level state de auth.provider)
// y el import dinámico de refreshTokens.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { ApiError } from './api-error';
import { apiResponse } from '@/test/msw/utils';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

// === Estado simulado de tokens ===
// En producción, getAccessToken/setTokens están vinculados al estado
// React del AuthProvider. En tests, simulamos ese vínculo con una
// variable de módulo que ambos mocks comparten.

let currentAccessToken: string | null = null;

// === Mocks de módulos ===

vi.mock('@/features/auth/context/auth.provider', () => ({
  getAccessToken: () => currentAccessToken,
  setTokens: (tokens: { accessToken: string; refreshToken: string; expiresIn: number } | null) => {
    currentAccessToken = tokens?.accessToken ?? null;
  },
}));

// Mock del import dinámico de auth.api (refreshTokens).
// El httpClient usa `await import('@/features/auth/api/auth.api')`
// en el interceptor de refresh.
const mockRefreshTokens = vi.fn();

vi.mock('@/features/auth/api/auth.api', () => ({
  refreshTokens: (...args: unknown[]) => mockRefreshTokens(...args),
}));

// === Importación del módulo bajo test ===
// IMPORTANTE: importar DESPUÉS de vi.mock para que los interceptores
// usen las versiones mockeadas.
import { httpClient } from './http-client';

// === Tests ===

describe('HttpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    currentAccessToken = null;
  });

  // ===========================================
  // 1. Peticiones básicas (GET, POST, PUT, DELETE, PATCH)
  // ===========================================
  describe('Peticiones básicas', () => {
    it('debería hacer GET con la URL correcta', async () => {
      // Arrange
      server.use(
        http.get('*/v1/test-resource', () => {
          return HttpResponse.json(apiResponse({ id: '1', name: 'Test' }));
        }),
      );

      // Act
      const response = await httpClient.get('/v1/test-resource');

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: { id: '1', name: 'Test' } });
    });

    it('debería hacer POST con body y Content-Type JSON', async () => {
      // Arrange
      let capturedBody: unknown;
      let capturedContentType: string | null = null;

      server.use(
        http.post('*/v1/test-resource', async ({ request }) => {
          capturedBody = await request.json();
          capturedContentType = request.headers.get('Content-Type');
          return HttpResponse.json(apiResponse({ id: '2' }), { status: 201 });
        }),
      );

      const payload = { name: 'Nuevo', amount: 12000 };

      // Act
      const response = await httpClient.post('/v1/test-resource', payload);

      // Assert
      expect(response.status).toBe(201);
      expect(capturedBody).toEqual(payload);
      expect(capturedContentType).toContain('application/json');
    });

    it('debería hacer PUT con body', async () => {
      // Arrange
      let capturedBody: unknown;

      server.use(
        http.put('*/v1/test-resource/123', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse({ id: '123', name: 'Actualizado' }));
        }),
      );

      // Act
      const response = await httpClient.put('/v1/test-resource/123', { name: 'Actualizado' });

      // Assert
      expect(response.status).toBe(200);
      expect(capturedBody).toEqual({ name: 'Actualizado' });
    });

    it('debería hacer DELETE', async () => {
      // Arrange
      server.use(
        http.delete('*/v1/test-resource/456', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      const response = await httpClient.delete('/v1/test-resource/456');

      // Assert
      expect(response.status).toBe(204);
    });

    it('debería hacer PATCH con body parcial', async () => {
      // Arrange
      let capturedBody: unknown;

      server.use(
        http.patch('*/v1/test-resource/789', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse({ id: '789', status: 'active' }));
        }),
      );

      // Act
      const response = await httpClient.patch('/v1/test-resource/789', { status: 'active' });

      // Assert
      expect(response.status).toBe(200);
      expect(capturedBody).toEqual({ status: 'active' });
    });
  });

  // ===========================================
  // 2. Request Interceptor — Auth Header
  // ===========================================
  describe('Request Interceptor — Authorization header', () => {
    it('debería inyectar Bearer token cuando hay token de acceso', async () => {
      // Arrange
      currentAccessToken = 'my-access-token';
      let capturedAuth: string | null = null;

      server.use(
        http.get('*/v1/protected', ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          return HttpResponse.json(apiResponse({ ok: true }));
        }),
      );

      // Act
      await httpClient.get('/v1/protected');

      // Assert
      expect(capturedAuth).toBe('Bearer my-access-token');
    });

    it('NO debería inyectar Authorization cuando no hay token', async () => {
      // Arrange — currentAccessToken = null (default de beforeEach)
      let capturedAuth: string | null = null;

      server.use(
        http.get('*/v1/public', ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          return HttpResponse.json(apiResponse({ ok: true }));
        }),
      );

      // Act
      await httpClient.get('/v1/public');

      // Assert
      expect(capturedAuth).toBeNull();
    });

    it('debería usar el token más reciente en cada petición', async () => {
      // Arrange — triangulación con tokens diferentes
      const capturedTokens: (string | null)[] = [];

      server.use(
        http.get('*/v1/check', ({ request }) => {
          capturedTokens.push(request.headers.get('Authorization'));
          return HttpResponse.json(apiResponse({ ok: true }));
        }),
      );

      // Act — Primera petición con token A
      currentAccessToken = 'token-A';
      await httpClient.get('/v1/check');

      // Segunda petición con token B
      currentAccessToken = 'token-B';
      await httpClient.get('/v1/check');

      // Assert
      expect(capturedTokens).toEqual(['Bearer token-A', 'Bearer token-B']);
    });
  });

  // ===========================================
  // 3. Request Interceptor — X-Tenant-Id Header
  // ===========================================
  describe('Request Interceptor — X-Tenant-Id header', () => {
    it('debería inyectar X-Tenant-Id desde localStorage', async () => {
      // Arrange
      localStorage.setItem(STORAGE_KEYS.TENANT_ID, 'tenant-uuid-001');
      let capturedTenantId: string | null = null;

      server.use(
        http.get('*/v1/tenanted', ({ request }) => {
          capturedTenantId = request.headers.get('X-Tenant-Id');
          return HttpResponse.json(apiResponse({ ok: true }));
        }),
      );

      // Act
      await httpClient.get('/v1/tenanted');

      // Assert
      expect(capturedTenantId).toBe('tenant-uuid-001');
    });

    it('NO debería inyectar X-Tenant-Id cuando no hay tenant en localStorage', async () => {
      // Arrange — localStorage vacío (limpiado en beforeEach)
      let capturedTenantId: string | null = null;

      server.use(
        http.get('*/v1/no-tenant', ({ request }) => {
          capturedTenantId = request.headers.get('X-Tenant-Id');
          return HttpResponse.json(apiResponse({ ok: true }));
        }),
      );

      // Act
      await httpClient.get('/v1/no-tenant');

      // Assert
      expect(capturedTenantId).toBeNull();
    });

    it('debería enviar ambos headers (Auth + Tenant) cuando ambos existen', async () => {
      // Arrange
      currentAccessToken = 'my-token';
      localStorage.setItem(STORAGE_KEYS.TENANT_ID, 'tenant-42');

      let capturedAuth: string | null = null;
      let capturedTenant: string | null = null;

      server.use(
        http.get('*/v1/full-context', ({ request }) => {
          capturedAuth = request.headers.get('Authorization');
          capturedTenant = request.headers.get('X-Tenant-Id');
          return HttpResponse.json(apiResponse({ ok: true }));
        }),
      );

      // Act
      await httpClient.get('/v1/full-context');

      // Assert
      expect(capturedAuth).toBe('Bearer my-token');
      expect(capturedTenant).toBe('tenant-42');
    });
  });

  // ===========================================
  // 4. Response Error → ApiError Transformation
  // ===========================================
  describe('Transformación de errores a ApiError', () => {
    it('debería transformar error estándar del backend a ApiError (404)', async () => {
      // Arrange — Formato estándar: { error: { code, message, details } }
      server.use(
        http.get('*/v1/not-found', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'MEMBER_NOT_FOUND',
                message: 'Socio no encontrado',
                details: { memberId: '999' },
              },
            },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      try {
        await httpClient.get('/v1/not-found');
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(404);
        expect(apiError.code).toBe('MEMBER_NOT_FOUND');
        expect(apiError.message).toBe('Socio no encontrado');
        expect(apiError.details).toEqual({ memberId: '999' });
      }
    });

    it('debería transformar error 409 Conflict a ApiError (triangulación)', async () => {
      // Arrange
      server.use(
        http.post('*/v1/fee-plans', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'DUPLICATE_CODE',
                message: 'El código de cuota ya existe',
                details: null,
              },
            },
            { status: 409 },
          );
        }),
      );

      // Act & Assert
      try {
        await httpClient.post('/v1/fee-plans', { code: 'CUOTA-ANUAL' });
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(409);
        expect(apiError.code).toBe('DUPLICATE_CODE');
        expect(apiError.message).toBe('El código de cuota ya existe');
        expect(apiError.details).toBeNull();
      }
    });

    it('debería crear ApiError genérico para formato de error no estándar con message', async () => {
      // Arrange — Backend devuelve formato no estándar: { message: '...' }
      server.use(
        http.get('*/v1/bad-format', () => {
          return HttpResponse.json({ message: 'Something went wrong' }, { status: 422 });
        }),
      );

      // Act & Assert
      try {
        await httpClient.get('/v1/bad-format');
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(422);
        expect(apiError.code).toBe('UNKNOWN_ERROR');
        expect(apiError.message).toBe('Something went wrong');
      }
    });

    it('debería crear ApiError genérico para formato de error sin message', async () => {
      // Arrange — Backend devuelve formato totalmente distinto
      server.use(
        http.get('*/v1/weird-error', () => {
          return HttpResponse.json({ foo: 'bar' }, { status: 500 });
        }),
      );

      // Act & Assert
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        await httpClient.get('/v1/weird-error');
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(500);
        expect(apiError.code).toBe('UNKNOWN_ERROR');
        expect(apiError.message).toBe('Error desconocido del servidor.');
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('debería crear ApiError de red cuando no hay respuesta (network error)', async () => {
      // Arrange — MSW devuelve error de red
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      server.use(
        http.get('*/v1/network-fail', () => {
          return HttpResponse.error();
        }),
      );

      // Act & Assert
      try {
        await httpClient.get('/v1/network-fail');
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(0);
        expect(apiError.code).toBe('NETWORK_ERROR');
        expect(apiError.message).toBe('Error de conexion con el servidor.');
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('debería transformar error 400 Bad Request con detalles de validación', async () => {
      // Arrange
      server.use(
        http.post('*/v1/validate', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Datos inválidos',
                details: { email: 'Formato incorrecto', name: 'Requerido' },
              },
            },
            { status: 400 },
          );
        }),
      );

      // Act & Assert
      try {
        await httpClient.post('/v1/validate', {});
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(400);
        expect(apiError.code).toBe('VALIDATION_ERROR');
        expect(apiError.details).toEqual({
          email: 'Formato incorrecto',
          name: 'Requerido',
        });
      }
    });

    it('debería transformar error 403 Forbidden', async () => {
      // Arrange
      server.use(
        http.get('*/v1/forbidden', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'No tiene permisos',
                details: null,
              },
            },
            { status: 403 },
          );
        }),
      );

      // Act & Assert
      try {
        await httpClient.get('/v1/forbidden');
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(403);
        expect(apiError.code).toBe('INSUFFICIENT_PERMISSIONS');
        expect(apiError.isForbidden).toBe(true);
        expect(apiError.isNotFound).toBe(false);
      }
    });
  });

  // ===========================================
  // 5. 5xx Logging
  // ===========================================
  describe('Logging de errores 5xx', () => {
    it('debería loguear errores 5xx a console.error', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        http.get('*/v1/server-error', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL', message: 'Fallo interno', details: null } },
            { status: 500 },
          );
        }),
      );

      // Act
      try {
        await httpClient.get('/v1/server-error');
      } catch {
        // Esperado
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({
          status: 500,
        }),
      );

      consoleSpy.mockRestore();
    });

    it('debería loguear errores de red a console.error', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        http.get('*/v1/net-error-log', () => {
          return HttpResponse.error();
        }),
      );

      // Act
      try {
        await httpClient.get('/v1/net-error-log');
      } catch {
        // Esperado
      }

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({
          url: '/v1/net-error-log',
        }),
      );

      consoleSpy.mockRestore();
    });

    it('NO debería loguear errores 4xx (excepto 401)', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        http.get('*/v1/client-error', () => {
          return HttpResponse.json(
            { error: { code: 'BAD_REQUEST', message: 'Bad', details: null } },
            { status: 400 },
          );
        }),
      );

      // Act
      try {
        await httpClient.get('/v1/client-error');
      } catch {
        // Esperado
      }

      // Assert — No se loguea para 400
      expect(consoleSpy).not.toHaveBeenCalledWith('[API Error]', expect.anything());

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // 6. Token Refresh en 401
  // ===========================================
  describe('Token refresh en 401', () => {
    it('debería refrescar token y reintentar la petición original en 401', async () => {
      // Arrange
      currentAccessToken = 'expired-token';
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'my-refresh-token');

      // Mock de refreshTokens: retorna nuevos tokens.
      // NOTA: setTokens() (mockeado arriba) actualizará currentAccessToken,
      // así que el retry leerá el token nuevo via getAccessToken().
      mockRefreshTokens.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });

      let requestCount = 0;
      server.use(
        http.get('*/v1/protected-data', ({ request }) => {
          requestCount++;
          const auth = request.headers.get('Authorization');

          // Primera vez: 401 (token expirado)
          if (auth === 'Bearer expired-token') {
            return HttpResponse.json(
              { error: { code: 'TOKEN_EXPIRED', message: 'Token expired', details: null } },
              { status: 401 },
            );
          }

          // Segunda vez (retry): éxito con nuevo token
          if (auth === 'Bearer new-access-token') {
            return HttpResponse.json(apiResponse({ secret: 'data' }));
          }

          return HttpResponse.json({ message: 'Unexpected' }, { status: 500 });
        }),
      );

      // Act
      const response = await httpClient.get('/v1/protected-data');

      // Assert
      expect(requestCount).toBe(2); // Original + retry
      expect(response.data).toEqual({ data: { secret: 'data' } });
      expect(mockRefreshTokens).toHaveBeenCalledWith('my-refresh-token');
      // setTokens actualizó currentAccessToken
      expect(currentAccessToken).toBe('new-access-token');
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('new-refresh-token');
    });

    it('NO debería intentar refresh en endpoints de /auth/ (prevenir loop infinito)', async () => {
      // Arrange
      currentAccessToken = 'some-token';
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'some-refresh');

      server.use(
        http.post('*/v1/auth/login', () => {
          return HttpResponse.json(
            { error: { code: 'INVALID_CREDENTIALS', message: 'Bad creds', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act & Assert — El 401 de /auth/login se propaga directamente, sin refresh
      try {
        await httpClient.post('/v1/auth/login', { email: 'a', password: 'b' });
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }

      // refreshTokens NUNCA se llama para endpoints de auth
      expect(mockRefreshTokens).not.toHaveBeenCalled();
    });

    it('NO debería intentar refresh en /auth/refresh (prevenir loop infinito)', async () => {
      // Arrange
      currentAccessToken = 'some-token';

      server.use(
        http.post('*/v1/auth/refresh', () => {
          return HttpResponse.json(
            { error: { code: 'REFRESH_EXPIRED', message: 'Refresh expired', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act & Assert
      try {
        await httpClient.post('/v1/auth/refresh', { refreshToken: 'old' });
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }

      expect(mockRefreshTokens).not.toHaveBeenCalled();
    });

    it('NO debería intentar refresh en /auth/logout (triangulación)', async () => {
      // Arrange
      currentAccessToken = 'some-token';

      server.use(
        http.post('*/v1/auth/logout', () => {
          return HttpResponse.json(
            { error: { code: 'SESSION_ERROR', message: 'Session error', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act & Assert
      try {
        await httpClient.post('/v1/auth/logout', { refreshToken: 'x' });
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }

      expect(mockRefreshTokens).not.toHaveBeenCalled();
    });
  });

  // ===========================================
  // 7. Refresh fallido — Limpieza y redirect
  // ===========================================
  describe('Refresh fallido', () => {
    // Para capturar el redirect a /login sin romper Axios (que necesita
    // window.location.origin para resolver URLs relativas), usamos
    // un Proxy que intercepta escrituras a href.
    let locationHrefSpy: ReturnType<typeof vi.fn>;
    const realLocation = window.location;

    beforeEach(() => {
      locationHrefSpy = vi.fn();
      Object.defineProperty(window, 'location', {
        value: new Proxy(realLocation, {
          set(_target, prop, value) {
            if (prop === 'href') {
              locationHrefSpy(value);
              return true;
            }
            return Reflect.set(_target, prop, value);
          },
          get(target, prop) {
            const val = Reflect.get(target, prop);
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          },
        }),
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // Restaurar la location original para no contaminar otros tests
      Object.defineProperty(window, 'location', {
        value: realLocation,
        writable: true,
        configurable: true,
      });
    });

    it('debería limpiar estado y redirigir a /login cuando refresh falla', async () => {
      // Arrange
      currentAccessToken = 'expired-token';
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'expired-refresh');
      localStorage.setItem(STORAGE_KEYS.TENANT_ID, 'tenant-123');

      mockRefreshTokens.mockRejectedValue(new Error('Refresh token expired'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        http.get('*/v1/needs-auth', () => {
          return HttpResponse.json(
            { error: { code: 'EXPIRED', message: 'Token expired', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act
      try {
        await httpClient.get('/v1/needs-auth');
        expect.unreachable('Debería haber lanzado error');
      } catch {
        // Esperado
      }

      // Assert — Se limpió todo el estado de auth
      expect(currentAccessToken).toBeNull(); // setTokens(null) fue llamado
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.TENANT_ID)).toBeNull();
      expect(locationHrefSpy).toHaveBeenCalledWith('/login');

      consoleSpy.mockRestore();
    });

    it('debería limpiar estado cuando no hay refresh token disponible', async () => {
      // Arrange — No hay refresh token en localStorage
      currentAccessToken = 'expired-token';
      // NO se setea associated_refresh_token

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        http.get('*/v1/no-refresh', () => {
          return HttpResponse.json(
            { error: { code: 'EXPIRED', message: 'Token expired', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act
      try {
        await httpClient.get('/v1/no-refresh');
        expect.unreachable('Debería haber lanzado error');
      } catch {
        // Esperado
      }

      // Assert — refreshTokens NO se llama porque no hay refresh token
      expect(mockRefreshTokens).not.toHaveBeenCalled();
      // Se limpió el estado
      expect(currentAccessToken).toBeNull();
      expect(locationHrefSpy).toHaveBeenCalledWith('/login');

      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // 8. Cola de refresh — Peticiones concurrentes
  // ===========================================
  describe('Cola de refresh — Peticiones concurrentes', () => {
    // Mismo patrón de Proxy para capturar redirect sin romper Axios.
    let locationHrefSpy: ReturnType<typeof vi.fn>;
    const realLocation = window.location;

    beforeEach(() => {
      locationHrefSpy = vi.fn();
      Object.defineProperty(window, 'location', {
        value: new Proxy(realLocation, {
          set(_target, prop, value) {
            if (prop === 'href') {
              locationHrefSpy(value);
              return true;
            }
            return Reflect.set(_target, prop, value);
          },
          get(target, prop) {
            const val = Reflect.get(target, prop);
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          },
        }),
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: realLocation,
        writable: true,
        configurable: true,
      });
    });

    it('debería encolar peticiones 401 concurrentes y solo hacer UN refresh', async () => {
      // Arrange
      currentAccessToken = 'expired-token';
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh');

      let refreshCallCount = 0;
      mockRefreshTokens.mockImplementation(async () => {
        refreshCallCount++;
        // Delay para dar tiempo a que las peticiones se encolen
        await new Promise((resolve) => setTimeout(resolve, 50));
        return {
          accessToken: 'fresh-token',
          refreshToken: 'fresh-refresh',
          expiresIn: 3600,
        };
      });

      // Contadores por endpoint
      const requestCounts = { r1: 0, r2: 0, r3: 0 };

      server.use(
        http.get('*/v1/resource-1', ({ request }) => {
          requestCounts.r1++;
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer expired-token') {
            return HttpResponse.json(
              { error: { code: 'EXPIRED', message: 'Expired', details: null } },
              { status: 401 },
            );
          }
          return HttpResponse.json(apiResponse({ id: 'r1' }));
        }),
        http.get('*/v1/resource-2', ({ request }) => {
          requestCounts.r2++;
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer expired-token') {
            return HttpResponse.json(
              { error: { code: 'EXPIRED', message: 'Expired', details: null } },
              { status: 401 },
            );
          }
          return HttpResponse.json(apiResponse({ id: 'r2' }));
        }),
        http.get('*/v1/resource-3', ({ request }) => {
          requestCounts.r3++;
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer expired-token') {
            return HttpResponse.json(
              { error: { code: 'EXPIRED', message: 'Expired', details: null } },
              { status: 401 },
            );
          }
          return HttpResponse.json(apiResponse({ id: 'r3' }));
        }),
      );

      // Act — 3 peticiones concurrentes, todas reciben 401
      const [res1, res2, res3] = await Promise.all([
        httpClient.get('/v1/resource-1'),
        httpClient.get('/v1/resource-2'),
        httpClient.get('/v1/resource-3'),
      ]);

      // Assert — Solo se hizo UN refresh (no 3)
      expect(refreshCallCount).toBe(1);

      // Las 3 peticiones se completaron exitosamente tras el refresh
      expect(res1.data).toEqual({ data: { id: 'r1' } });
      expect(res2.data).toEqual({ data: { id: 'r2' } });
      expect(res3.data).toEqual({ data: { id: 'r3' } });

      // Cada endpoint fue llamado 2 veces: original (401) + retry (200)
      expect(requestCounts.r1).toBe(2);
      expect(requestCounts.r2).toBe(2);
      expect(requestCounts.r3).toBe(2);
    });

    it('debería rechazar TODAS las peticiones encoladas si el refresh falla', async () => {
      // Arrange
      currentAccessToken = 'dead-token';
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'dead-refresh');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockRefreshTokens.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        throw new Error('Refresh token revoked');
      });

      server.use(
        http.get('*/v1/fail-queue-1', () => {
          return HttpResponse.json(
            { error: { code: 'EXPIRED', message: 'Expired', details: null } },
            { status: 401 },
          );
        }),
        http.get('*/v1/fail-queue-2', () => {
          return HttpResponse.json(
            { error: { code: 'EXPIRED', message: 'Expired', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act — 2 peticiones concurrentes
      const results = await Promise.allSettled([
        httpClient.get('/v1/fail-queue-1'),
        httpClient.get('/v1/fail-queue-2'),
      ]);

      // Assert — Ambas peticiones fueron rechazadas
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('rejected');

      // Estado limpiado y redirigido a login
      expect(currentAccessToken).toBeNull();
      expect(locationHrefSpy).toHaveBeenCalledWith('/login');

      consoleSpy.mockRestore();
    });

    it('debería usar el nuevo token en las peticiones reintentadas', async () => {
      // Arrange
      currentAccessToken = 'old-token';
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh');

      mockRefreshTokens.mockResolvedValue({
        accessToken: 'brand-new-token',
        refreshToken: 'brand-new-refresh',
        expiresIn: 7200,
      });

      const capturedRetryTokens: string[] = [];

      server.use(
        http.get('*/v1/retry-check-1', ({ request }) => {
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer old-token') {
            return HttpResponse.json(
              { error: { code: 'EXPIRED', message: 'Expired', details: null } },
              { status: 401 },
            );
          }
          capturedRetryTokens.push(auth ?? '');
          return HttpResponse.json(apiResponse({ ok: true }));
        }),
        http.get('*/v1/retry-check-2', ({ request }) => {
          const auth = request.headers.get('Authorization');
          if (auth === 'Bearer old-token') {
            return HttpResponse.json(
              { error: { code: 'EXPIRED', message: 'Expired', details: null } },
              { status: 401 },
            );
          }
          capturedRetryTokens.push(auth ?? '');
          return HttpResponse.json(apiResponse({ ok: true }));
        }),
      );

      // Act
      await Promise.all([httpClient.get('/v1/retry-check-1'), httpClient.get('/v1/retry-check-2')]);

      // Assert — Ambos retries usaron el nuevo token
      expect(capturedRetryTokens).toEqual(['Bearer brand-new-token', 'Bearer brand-new-token']);
    });
  });

  // ===========================================
  // 9. Protección contra refresh loops
  // ===========================================
  describe('Protección contra refresh loops', () => {
    it('NO debería reintentar refresh si la petición ya es un retry', async () => {
      // Arrange
      currentAccessToken = 'expired-token';
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'valid-refresh');

      // El refresh devuelve un token que el server TAMBIÉN rechaza con 401
      mockRefreshTokens.mockResolvedValue({
        accessToken: 'still-bad-token',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
      });

      let callCount = 0;
      server.use(
        http.get('*/v1/always-401', () => {
          callCount++;
          return HttpResponse.json(
            { error: { code: 'EXPIRED', message: 'Always expired', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act
      try {
        await httpClient.get('/v1/always-401');
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        // La segunda 401 NO dispara otro refresh porque _retry = true
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
      }

      // Assert — Solo 2 llamadas: original + 1 retry (no loop infinito)
      expect(callCount).toBe(2);
      // Solo 1 refresh
      expect(mockRefreshTokens).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================
  // 10. Base URL configuration
  // ===========================================
  describe('Configuración de base URL', () => {
    it('debería tener baseURL configurado como /api por defecto', () => {
      expect(httpClient.defaults.baseURL).toBe('/api');
    });

    it('debería tener Content-Type application/json por defecto', () => {
      expect(httpClient.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  // ===========================================
  // 11. ApiError helper methods (via HttpClient)
  // ===========================================
  describe('ApiError helper methods', () => {
    it('isUnauthorized debería ser true para 401 en endpoint de auth', async () => {
      // Arrange — Usar un endpoint de /auth/ para que no dispare refresh
      server.use(
        http.post('*/v1/auth/check', () => {
          return HttpResponse.json(
            { error: { code: 'UNAUTHORIZED', message: 'No auth', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act & Assert
      try {
        await httpClient.post('/v1/auth/check', {});
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.isUnauthorized).toBe(true);
        expect(apiError.isForbidden).toBe(false);
        expect(apiError.isNotFound).toBe(false);
      }
    });

    it('isNotFound debería ser true para 404', async () => {
      // Arrange
      server.use(
        http.get('*/v1/missing', () => {
          return HttpResponse.json(
            { error: { code: 'NOT_FOUND', message: 'Not found', details: null } },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      try {
        await httpClient.get('/v1/missing');
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.isNotFound).toBe(true);
        expect(apiError.isUnauthorized).toBe(false);
      }
    });

    it('isForbidden debería ser true para 403', async () => {
      // Arrange
      server.use(
        http.get('*/v1/denied', () => {
          return HttpResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Forbidden', details: null } },
            { status: 403 },
          );
        }),
      );

      // Act & Assert
      try {
        await httpClient.get('/v1/denied');
        expect.unreachable('Debería haber lanzado error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.isForbidden).toBe(true);
        expect(apiError.isUnauthorized).toBe(false);
        expect(apiError.isNotFound).toBe(false);
      }
    });
  });
});
