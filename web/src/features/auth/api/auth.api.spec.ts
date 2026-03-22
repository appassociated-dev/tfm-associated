// Tests para auth.api.ts — funciones de la capa API de autenticación.
// Valida URLs, métodos HTTP, parseo Zod de respuestas, y manejo de errores.
// Usa MSW para interceptar peticiones a nivel de red.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import {
  buildLoginResponse,
  buildTenantSelectorResponse,
  buildAuthTokens,
  buildUserProfile,
  buildTenant,
  resetAuthCounters,
} from '@/test/factories';

// Mock de auth.provider para evitar efectos secundarios del interceptor de httpClient
let currentAccessToken: string | null = 'test-token';

vi.mock('@/features/auth/context/auth.provider', () => ({
  getAccessToken: () => currentAccessToken,
  setTokens: (tokens: { accessToken: string } | null) => {
    currentAccessToken = tokens?.accessToken ?? null;
  },
}));

// Importar DESPUÉS de vi.mock
import {
  login,
  selectTenant,
  refreshTokens,
  logout,
  switchTenant,
  getCurrentUser,
  getMyTenants,
} from './auth.api';

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthCounters();
    currentAccessToken = 'test-token';
    localStorage.clear();
  });

  // ===========================================
  // login()
  // ===========================================
  describe('login()', () => {
    it('debería enviar POST a /v1/auth/login con credenciales', async () => {
      // Arrange
      let capturedBody: unknown;
      const expectedResponse = buildLoginResponse();

      server.use(
        http.post('*/v1/auth/login', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(expectedResponse));
        }),
      );

      // Act
      const result = await login({ email: 'user@club.es', password: 'pass123' });

      // Assert
      expect(capturedBody).toEqual({ email: 'user@club.es', password: 'pass123' });
      expect(result).toEqual(expectedResponse);
    });

    it('debería parsear respuesta de login directo (single-tenant)', async () => {
      // Arrange
      const loginResponse = buildLoginResponse({
        role: 'treasurer',
      });

      server.use(
        http.post('*/v1/auth/login', () => {
          return HttpResponse.json(apiResponse(loginResponse));
        }),
      );

      // Act
      const result = await login({ email: 'admin@club.es', password: 'secret' });

      // Assert — triangulación con rol diferente
      expect(result).toEqual(loginResponse);
      expect('accessToken' in result).toBe(true);
      expect('requiresTenantSelection' in result).toBe(false);
    });

    it('debería parsear respuesta de selector de tenants (multi-tenant)', async () => {
      // Arrange
      const selectorResponse = buildTenantSelectorResponse();

      server.use(
        http.post('*/v1/auth/login', () => {
          return HttpResponse.json(apiResponse(selectorResponse));
        }),
      );

      // Act
      const result = await login({ email: 'multi@club.es', password: 'pass' });

      // Assert
      expect(result).toEqual(selectorResponse);
      expect('requiresTenantSelection' in result).toBe(true);
    });

    it('debería lanzar error si la respuesta no coincide con ningún schema', async () => {
      // Arrange
      server.use(
        http.post('*/v1/auth/login', () => {
          return HttpResponse.json(apiResponse({ unexpected: true }));
        }),
      );

      // Act & Assert
      await expect(login({ email: 'a@b.es', password: 'x' })).rejects.toThrow(
        'Respuesta de login no coincide con ningún schema esperado',
      );
    });

    it('debería propagar error HTTP del servidor (401)', async () => {
      // Arrange
      server.use(
        http.post('*/v1/auth/login', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Credenciales inválidas',
                details: null,
              },
            },
            { status: 401 },
          );
        }),
      );

      // Act & Assert
      await expect(login({ email: 'wrong@club.es', password: 'bad' })).rejects.toThrow();
    });

    it('debería propagar error HTTP del servidor (423 cuenta bloqueada)', async () => {
      // Arrange
      server.use(
        http.post('*/v1/auth/login', () => {
          return HttpResponse.json(
            { error: { code: 'ACCOUNT_LOCKED', message: 'Cuenta bloqueada', details: null } },
            { status: 423 },
          );
        }),
      );

      // Act & Assert
      await expect(login({ email: 'locked@club.es', password: 'x' })).rejects.toThrow();
    });
  });

  // ===========================================
  // selectTenant()
  // ===========================================
  describe('selectTenant()', () => {
    it('debería enviar POST a /v1/auth/select-tenant con tenantId', async () => {
      // Arrange
      let capturedBody: unknown;
      const expected = buildLoginResponse();

      server.use(
        http.post('*/v1/auth/select-tenant', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(expected));
        }),
      );

      // Act
      const result = await selectTenant('tenant-uuid-001');

      // Assert
      expect(capturedBody).toEqual({ tenantId: 'tenant-uuid-001' });
      expect(result).toEqual(expected);
    });

    it('debería parsear correctamente la respuesta con Zod (triangulación con otro tenantId)', async () => {
      // Arrange
      const expected = buildLoginResponse({ role: 'member' });

      server.use(
        http.post('*/v1/auth/select-tenant', () => {
          return HttpResponse.json(apiResponse(expected));
        }),
      );

      // Act
      const result = await selectTenant('tenant-uuid-999');

      // Assert
      expect(result.role).toBe('member');
      expect(result.user).toBeDefined();
      expect(result.tenant).toBeDefined();
    });

    it('debería propagar error si el tenant no existe (404)', async () => {
      // Arrange
      server.use(
        http.post('*/v1/auth/select-tenant', () => {
          return HttpResponse.json(
            { error: { code: 'TENANT_NOT_FOUND', message: 'Tenant no encontrado', details: null } },
            { status: 404 },
          );
        }),
      );

      // Act & Assert
      await expect(selectTenant('nonexistent-id')).rejects.toThrow();
    });
  });

  // ===========================================
  // refreshTokens()
  // ===========================================
  describe('refreshTokens()', () => {
    it('debería enviar POST a /v1/auth/refresh con refreshToken', async () => {
      // Arrange
      let capturedBody: unknown;
      const expectedTokens = buildAuthTokens({ expiresIn: 7200 });

      server.use(
        http.post('*/v1/auth/refresh', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(expectedTokens));
        }),
      );

      // Act
      const result = await refreshTokens('old-refresh-token');

      // Assert
      expect(capturedBody).toEqual({ refreshToken: 'old-refresh-token' });
      expect(result).toEqual(expectedTokens);
    });

    it('debería parsear AuthTokens con Zod (triangulación con expiresIn diferente)', async () => {
      // Arrange
      const tokens = buildAuthTokens({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 1800,
      });

      server.use(
        http.post('*/v1/auth/refresh', () => {
          return HttpResponse.json(apiResponse(tokens));
        }),
      );

      // Act
      const result = await refreshTokens('any-refresh');

      // Assert
      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
      expect(result.expiresIn).toBe(1800);
    });

    it('debería propagar error si el refresh token expiró (401)', async () => {
      // Arrange
      server.use(
        http.post('*/v1/auth/refresh', () => {
          return HttpResponse.json(
            { error: { code: 'TOKEN_EXPIRED', message: 'Refresh token expirado', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act & Assert
      await expect(refreshTokens('expired-token')).rejects.toThrow();
    });
  });

  // ===========================================
  // logout()
  // ===========================================
  describe('logout()', () => {
    it('debería enviar POST a /v1/auth/logout con refreshToken', async () => {
      // Arrange
      let capturedBody: unknown;

      server.use(
        http.post('*/v1/auth/logout', async ({ request }) => {
          capturedBody = await request.json();
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act
      await logout('refresh-to-invalidate');

      // Assert
      expect(capturedBody).toEqual({ refreshToken: 'refresh-to-invalidate' });
    });

    it('debería completar sin error en respuesta 204', async () => {
      // Arrange
      server.use(
        http.post('*/v1/auth/logout', () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );

      // Act & Assert — no debería lanzar
      await expect(logout('any-token')).resolves.toBeUndefined();
    });

    it('debería propagar error del servidor (500)', async () => {
      // Arrange
      server.use(
        http.post('*/v1/auth/logout', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Error interno', details: null } },
            { status: 500 },
          );
        }),
      );

      // Act & Assert
      await expect(logout('token')).rejects.toThrow();
    });
  });

  // ===========================================
  // switchTenant()
  // ===========================================
  describe('switchTenant()', () => {
    it('debería enviar POST a /v1/auth/switch-tenant con tenantId', async () => {
      // Arrange
      let capturedBody: unknown;
      const expected = buildLoginResponse();

      server.use(
        http.post('*/v1/auth/switch-tenant', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(expected));
        }),
      );

      // Act
      const result = await switchTenant('tenant-b-uuid');

      // Assert
      expect(capturedBody).toEqual({ tenantId: 'tenant-b-uuid' });
      expect(result).toEqual(expected);
    });

    it('debería parsear LoginResponse correctamente (triangulación con diferente tenant)', async () => {
      // Arrange
      const tenant = buildTenant({ name: 'Club Deportivo', slug: 'club-deportivo' });
      const expected = buildLoginResponse({ tenant, role: 'secretary' });

      server.use(
        http.post('*/v1/auth/switch-tenant', () => {
          return HttpResponse.json(apiResponse(expected));
        }),
      );

      // Act
      const result = await switchTenant('other-tenant');

      // Assert
      expect(result.tenant.name).toBe('Club Deportivo');
      expect(result.tenant.slug).toBe('club-deportivo');
      expect(result.role).toBe('secretary');
    });

    it('debería propagar error si no tiene acceso al tenant (403)', async () => {
      // Arrange
      server.use(
        http.post('*/v1/auth/switch-tenant', () => {
          return HttpResponse.json(
            { error: { code: 'FORBIDDEN', message: 'Sin acceso al tenant', details: null } },
            { status: 403 },
          );
        }),
      );

      // Act & Assert
      await expect(switchTenant('forbidden-tenant')).rejects.toThrow();
    });
  });

  // ===========================================
  // getCurrentUser()
  // ===========================================
  describe('getCurrentUser()', () => {
    it('debería enviar GET a /v1/auth/me', async () => {
      // Arrange
      let capturedMethod: string | undefined;
      const expected = buildUserProfile();

      server.use(
        http.get('*/v1/auth/me', ({ request }) => {
          capturedMethod = request.method;
          return HttpResponse.json(apiResponse(expected));
        }),
      );

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(capturedMethod).toBe('GET');
      expect(result).toEqual(expected);
    });

    it('debería parsear UserProfile con Zod (triangulación con permisos específicos)', async () => {
      // Arrange
      const profile = buildUserProfile({
        permissions: ['treasury:fees:read', 'treasury:fees:write'],
        role: 'treasurer',
      });

      server.use(
        http.get('*/v1/auth/me', () => {
          return HttpResponse.json(apiResponse(profile));
        }),
      );

      // Act
      const result = await getCurrentUser();

      // Assert
      expect(result.permissions).toEqual(['treasury:fees:read', 'treasury:fees:write']);
      expect(result.role).toBe('treasurer');
      expect(result.currentTenant).toBeDefined();
    });

    it('debería rechazar si la respuesta no pasa validación Zod', async () => {
      // Arrange — respuesta sin campo obligatorio 'permissions'
      server.use(
        http.get('*/v1/auth/me', () => {
          return HttpResponse.json(
            apiResponse({
              id: 'uuid-001',
              email: 'test@club.es',
              name: 'Test',
              currentTenant: { id: 'tid', name: 'T', slug: 's' },
              role: 'admin',
              // falta permissions
            }),
          );
        }),
      );

      // Act & Assert
      await expect(getCurrentUser()).rejects.toThrow();
    });

    it('debería propagar error de autenticación (401)', async () => {
      // Arrange
      server.use(
        http.get('*/v1/auth/me', () => {
          return HttpResponse.json(
            { error: { code: 'UNAUTHORIZED', message: 'No autenticado', details: null } },
            { status: 401 },
          );
        }),
      );

      // Act & Assert
      await expect(getCurrentUser()).rejects.toThrow();
    });
  });

  // ===========================================
  // getMyTenants()
  // ===========================================
  describe('getMyTenants()', () => {
    it('debería enviar GET a /v1/auth/me/tenants', async () => {
      // Arrange
      let capturedUrl: string | undefined;
      const tenants = [
        { ...buildTenant(), role: 'admin' },
        { ...buildTenant(), role: 'member' },
      ];

      server.use(
        http.get('*/v1/auth/me/tenants', ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json(apiResponse(tenants));
        }),
      );

      // Act
      const result = await getMyTenants();

      // Assert
      expect(capturedUrl).toContain('/v1/auth/me/tenants');
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('role');
    });

    it('debería parsear array de tenants con rol (triangulación con 3 tenants)', async () => {
      // Arrange
      const tenants = [
        { ...buildTenant({ name: 'Club A' }), role: 'admin' },
        { ...buildTenant({ name: 'Club B' }), role: 'member' },
        { ...buildTenant({ name: 'Club C' }), role: 'secretary' },
      ];

      server.use(
        http.get('*/v1/auth/me/tenants', () => {
          return HttpResponse.json(apiResponse(tenants));
        }),
      );

      // Act
      const result = await getMyTenants();

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Club A');
      expect(result[0].role).toBe('admin');
      expect(result[2].name).toBe('Club C');
      expect(result[2].role).toBe('secretary');
    });

    it('debería devolver array vacío si el usuario no tiene tenants', async () => {
      // Arrange
      server.use(
        http.get('*/v1/auth/me/tenants', () => {
          return HttpResponse.json(apiResponse([]));
        }),
      );

      // Act
      const result = await getMyTenants();

      // Assert
      expect(result).toEqual([]);
    });

    it('debería propagar error del servidor (500)', async () => {
      // Arrange
      server.use(
        http.get('*/v1/auth/me/tenants', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Error', details: null } },
            { status: 500 },
          );
        }),
      );

      // Act & Assert
      await expect(getMyTenants()).rejects.toThrow();
    });
  });
});
