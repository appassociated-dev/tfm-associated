// Tests para AuthProvider — componente más crítico del frontend (336 LOC).
// Cubre el ciclo completo de autenticación: login, logout, refresh,
// selección de tenant, restauración de sesión y manejo de errores.
//
// Estrategia:
// - MSW para interceptar llamadas HTTP reales (NO vi.mock de authApi)
// - renderHook para testear el hook useAuth dentro de AuthProvider
// - Factories deterministas para datos de test
// - AAA pattern con triangulación

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import {
  buildLoginResponse,
  buildTenantSelectorResponse,
  buildAuthTokens,
  buildUserProfile,
  buildUser,
  buildTenant,
  resetAuthCounters,
} from '@/test/factories';
import { AuthProvider, getAccessToken } from './auth.provider';
import { useAuth } from './use-auth';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

/**
 * Wrapper que envuelve el hook en un AuthProvider real.
 * NO usa TestWrapper porque queremos testear el AuthProvider REAL,
 * no el mock con AuthContext.Provider.
 */
function createAuthWrapper() {
  return function AuthWrapper({ children }: { children: ReactNode }) {
    return <AuthProvider>{children}</AuthProvider>;
  };
}

/**
 * Renderiza useAuth dentro de un AuthProvider real.
 * Espera a que isLoading sea false antes de retornar.
 */
async function renderUseAuth() {
  const hook = renderHook(() => useAuth(), {
    wrapper: createAuthWrapper(),
  });

  // Esperar a que termine la restauración de sesión (isLoading → false)
  await waitFor(() => {
    expect(hook.result.current.isLoading).toBe(false);
  });

  return hook;
}

// === Setup ===

beforeEach(() => {
  // Limpiar localStorage para aislamiento entre tests
  localStorage.clear();
  // Resetear contadores de factories para IDs predecibles
  resetAuthCounters();
  // Limpiar fake timers si estaban activos
  vi.useRealTimers();
});

// === Tests ===

describe('AuthProvider', () => {
  // -------------------------------------------
  // Estado inicial (sin sesión previa)
  // -------------------------------------------
  describe('estado inicial sin sesión previa', () => {
    it('debe arrancar como no autenticado cuando no hay refresh token', async () => {
      // Arrange — no hay nada en localStorage

      // Act
      const { result } = await renderUseAuth();

      // Assert
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.tenant).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.permissions).toEqual([]);
    });

    it('debe tener isLoading=true inicialmente y luego false', async () => {
      // Arrange
      const { result } = renderHook(() => useAuth(), {
        wrapper: createAuthWrapper(),
      });

      // Assert — isLoading empieza true (mientras restaura sesión)
      // Nota: como no hay refresh token, transiciona rápido
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  // -------------------------------------------
  // Login directo (un solo tenant)
  // -------------------------------------------
  describe('login directo (single tenant)', () => {
    it('debe autenticar y setear user/tenant/role tras login exitoso', async () => {
      // Arrange
      const loginData = buildLoginResponse({
        user: buildUser({ name: 'Ana García' }),
        tenant: buildTenant({ name: 'Club Deportivo', slug: 'club-deportivo' }),
        role: 'admin',
      });
      const profile = buildUserProfile({
        permissions: ['membership:members:read', 'treasury:*'],
      });

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(profile))),
      );

      const { result } = await renderUseAuth();

      // Act
      await act(async () => {
        await result.current.login({ email: 'ana@club.es', password: 'secret123' });
      });

      // Assert
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.name).toBe('Ana García');
      expect(result.current.tenant?.name).toBe('Club Deportivo');
      expect(result.current.tenant?.slug).toBe('club-deportivo');
      expect(result.current.role).toBe('admin');
      expect(result.current.permissions).toEqual(['membership:members:read', 'treasury:*']);
      expect(result.current.accessToken).toBe(loginData.accessToken);
    });

    it('debe almacenar refresh token en localStorage tras login', async () => {
      // Arrange — triangulación: segundo set de datos
      const loginData = buildLoginResponse({
        refreshToken: 'my-refresh-token-xyz',
        user: buildUser({ name: 'Carlos Pérez' }),
        tenant: buildTenant({ name: 'Federación Vasca', slug: 'fed-vasca' }),
        role: 'member',
      });

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () =>
          HttpResponse.json(apiResponse(buildUserProfile({ permissions: ['events:*'] }))),
        ),
      );

      const { result } = await renderUseAuth();

      // Act
      await act(async () => {
        await result.current.login({ email: 'carlos@fed.es', password: 'password456' });
      });

      // Assert
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('my-refresh-token-xyz');
      expect(localStorage.getItem(STORAGE_KEYS.TENANT_ID)).toBe(loginData.tenant.id);
      expect(result.current.user?.name).toBe('Carlos Pérez');
      expect(result.current.role).toBe('member');
    });

    it('debe setear permissions vacío si getCurrentUser falla tras login', async () => {
      // Arrange
      const loginData = buildLoginResponse();

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Server error', details: null } },
            { status: 500 },
          ),
        ),
      );

      const { result } = await renderUseAuth();

      // Act
      await act(async () => {
        await result.current.login({ email: 'test@club.es', password: 'pass' });
      });

      // Assert — autenticado pero sin permisos
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.permissions).toEqual([]);
    });
  });

  // -------------------------------------------
  // Login multi-tenant (requiere selección)
  // -------------------------------------------
  describe('login multi-tenant', () => {
    it('debe retornar TenantSelectorResponse sin cambiar estado de auth', async () => {
      // Arrange
      const selectorResponse = buildTenantSelectorResponse();

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(selectorResponse))),
      );

      const { result } = await renderUseAuth();

      // Act
      let loginResult: unknown;
      await act(async () => {
        loginResult = await result.current.login({
          email: 'multi@club.es',
          password: 'secret',
        });
      });

      // Assert — estado NO cambia (no autenticado todavía)
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      // La respuesta SÍ contiene la info de tenants
      expect(loginResult).toHaveProperty('requiresTenantSelection', true);
      expect((loginResult as { tenants: unknown[] }).tenants).toHaveLength(2);
    });

    it('debe autenticar tras selectTenant después de login multi-tenant', async () => {
      // Arrange
      const selectorResponse = buildTenantSelectorResponse();
      const selectedTenant = buildTenant({ name: 'Club Elegido', slug: 'club-elegido' });
      const selectResponse = buildLoginResponse({
        tenant: selectedTenant,
        role: 'treasurer',
      });
      const profile = buildUserProfile({
        permissions: ['treasury:fee-plans:read', 'treasury:fee-plans:create'],
      });

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(selectorResponse))),
        http.post('*/v1/auth/select-tenant', () => HttpResponse.json(apiResponse(selectResponse))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(profile))),
      );

      const { result } = await renderUseAuth();

      // Act — primero login, luego seleccionar tenant
      await act(async () => {
        await result.current.login({ email: 'multi@club.es', password: 'secret' });
      });

      expect(result.current.isAuthenticated).toBe(false);

      await act(async () => {
        await result.current.selectTenant(selectedTenant.id);
      });

      // Assert — ahora sí autenticado
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.tenant?.name).toBe('Club Elegido');
      expect(result.current.role).toBe('treasurer');
      expect(result.current.permissions).toEqual([
        'treasury:fee-plans:read',
        'treasury:fee-plans:create',
      ]);
    });
  });

  // -------------------------------------------
  // Logout
  // -------------------------------------------
  describe('logout', () => {
    it('debe limpiar todo el estado y localStorage tras logout', async () => {
      // Arrange — login primero
      const loginData = buildLoginResponse({ refreshToken: 'refresh-to-invalidate' });

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(buildUserProfile()))),
        http.post('*/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),
      );

      const { result } = await renderUseAuth();

      await act(async () => {
        await result.current.login({ email: 'test@club.es', password: 'pass' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Act
      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.tenant).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.role).toBeNull();
      expect(result.current.permissions).toEqual([]);
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.TENANT_ID)).toBeNull();
    });

    it('debe limpiar estado local incluso si la API de logout falla', async () => {
      // Arrange — login primero
      const loginData = buildLoginResponse({ refreshToken: 'refresh-token-abc' });

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(buildUserProfile()))),
        http.post('*/v1/auth/logout', () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Backend down', details: null } },
            { status: 500 },
          ),
        ),
      );

      const { result } = await renderUseAuth();

      await act(async () => {
        await result.current.login({ email: 'test@club.es', password: 'pass' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Act — logout con backend caído
      await act(async () => {
        await result.current.logout();
      });

      // Assert — estado local limpio a pesar del error del backend
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    });
  });

  // -------------------------------------------
  // Switch tenant
  // -------------------------------------------
  describe('switchTenant', () => {
    it('debe cambiar tenant y actualizar estado sin re-autenticación', async () => {
      // Arrange — login con tenant A
      const tenantA = buildTenant({ name: 'Club A', slug: 'club-a' });
      const loginData = buildLoginResponse({ tenant: tenantA, role: 'admin' });
      const profileA = buildUserProfile({ permissions: ['*'] });

      // Tenant B para switch
      const tenantB = buildTenant({ name: 'Club B', slug: 'club-b' });
      const switchResponse = buildLoginResponse({
        tenant: tenantB,
        role: 'member',
        accessToken: 'new-access-for-tenant-b',
        refreshToken: 'new-refresh-for-tenant-b',
      });
      const profileB = buildUserProfile({
        permissions: ['membership:members:read'],
      });

      let meCallCount = 0;
      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => {
          meCallCount++;
          const data = meCallCount <= 1 ? profileA : profileB;
          return HttpResponse.json(apiResponse(data));
        }),
        http.post('*/v1/auth/switch-tenant', () => HttpResponse.json(apiResponse(switchResponse))),
      );

      const { result } = await renderUseAuth();

      await act(async () => {
        await result.current.login({ email: 'admin@club-a.es', password: 'pass' });
      });

      expect(result.current.tenant?.name).toBe('Club A');
      expect(result.current.role).toBe('admin');

      // Act — switch a tenant B
      await act(async () => {
        await result.current.switchTenant(tenantB.id);
      });

      // Assert — tenant cambiado, nuevo role y permisos
      expect(result.current.tenant?.name).toBe('Club B');
      expect(result.current.role).toBe('member');
      expect(result.current.accessToken).toBe('new-access-for-tenant-b');
      expect(result.current.permissions).toEqual(['membership:members:read']);
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('new-refresh-for-tenant-b');
      expect(localStorage.getItem(STORAGE_KEYS.TENANT_ID)).toBe(tenantB.id);
    });

    it('debe actualizar tokens en localStorage tras switch (triangulación)', async () => {
      // Arrange — otra combinación de datos para triangular
      const tenantX = buildTenant({ name: 'Fed X', slug: 'fed-x' });
      const loginData = buildLoginResponse({ tenant: tenantX });

      const tenantY = buildTenant({ name: 'Fed Y', slug: 'fed-y' });
      const switchResponse = buildLoginResponse({
        tenant: tenantY,
        refreshToken: 'refresh-after-switch-y',
      });

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(buildUserProfile()))),
        http.post('*/v1/auth/switch-tenant', () => HttpResponse.json(apiResponse(switchResponse))),
      );

      const { result } = await renderUseAuth();

      await act(async () => {
        await result.current.login({ email: 'user@fed-x.es', password: 'pwd' });
      });

      // Act
      await act(async () => {
        await result.current.switchTenant(tenantY.id);
      });

      // Assert
      expect(result.current.tenant?.slug).toBe('fed-y');
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refresh-after-switch-y');
    });
  });

  // -------------------------------------------
  // Restauración de sesión
  // -------------------------------------------
  describe('restauración de sesión', () => {
    it('debe restaurar sesión desde refresh token en localStorage', async () => {
      // Arrange — simular sesión previa guardada
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'stored-refresh-token');

      const tokens = buildAuthTokens({
        accessToken: 'restored-access-token',
        refreshToken: 'rotated-refresh-token',
      });
      const profile = buildUserProfile({
        id: 'a0000001-0000-4000-8000-000000000001',
        email: 'restored@club.es',
        name: 'Restored User',
        currentTenant: buildTenant({ name: 'Club Restored', slug: 'club-restored' }),
        role: 'secretary',
        permissions: ['membership:*', 'communication:*'],
      });

      server.use(
        http.post('*/v1/auth/refresh', () => HttpResponse.json(apiResponse(tokens))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(profile))),
      );

      // Act
      const { result } = await renderUseAuth();

      // Assert — sesión restaurada
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.name).toBe('Restored User');
      expect(result.current.user?.email).toBe('restored@club.es');
      expect(result.current.tenant?.name).toBe('Club Restored');
      expect(result.current.role).toBe('secretary');
      expect(result.current.permissions).toEqual(['membership:*', 'communication:*']);
      expect(result.current.accessToken).toBe('restored-access-token');
      // Refresh token rotado
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('rotated-refresh-token');
    });

    it('debe limpiar y quedar desautenticado si refresh falla al restaurar', async () => {
      // Arrange — hay un refresh token guardado pero es inválido
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'expired-refresh-token');

      server.use(
        http.post('*/v1/auth/refresh', () =>
          HttpResponse.json(
            { error: { code: 'TOKEN_EXPIRED', message: 'Refresh token expired', details: null } },
            { status: 401 },
          ),
        ),
      );

      // Act
      const { result } = await renderUseAuth();

      // Assert — desautenticado, token limpiado
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
    });

    it('debe restaurar con datos diferentes (triangulación)', async () => {
      // Arrange — segundo escenario de restauración con datos distintos
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'another-stored-refresh');

      const tokens = buildAuthTokens({
        accessToken: 'access-two',
        refreshToken: 'refresh-two-rotated',
      });
      const profile = buildUserProfile({
        name: 'María López',
        email: 'maria@asociacion.es',
        currentTenant: buildTenant({ name: 'Asociación Cultural', slug: 'asoc-cultural' }),
        role: 'admin',
        permissions: ['*'],
      });

      server.use(
        http.post('*/v1/auth/refresh', () => HttpResponse.json(apiResponse(tokens))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(profile))),
      );

      // Act
      const { result } = await renderUseAuth();

      // Assert
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.name).toBe('María López');
      expect(result.current.tenant?.slug).toBe('asoc-cultural');
      expect(result.current.accessToken).toBe('access-two');
    });
  });

  // -------------------------------------------
  // Auto-refresh de tokens
  // -------------------------------------------
  describe('auto-refresh de tokens', () => {
    it('debe programar refresh automático antes de expirar el token', async () => {
      // Arrange
      vi.useFakeTimers();

      const loginData = buildLoginResponse({
        expiresIn: 120, // 120 segundos → refresh a los 60s (120 - 60 margen)
        accessToken: 'initial-access',
        refreshToken: 'initial-refresh',
      });
      const refreshedTokens = buildAuthTokens({
        accessToken: 'refreshed-access',
        refreshToken: 'refreshed-refresh',
        expiresIn: 3600,
      });

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(buildUserProfile()))),
        http.post('*/v1/auth/refresh', () => HttpResponse.json(apiResponse(refreshedTokens))),
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createAuthWrapper(),
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Act — login para activar el timer de auto-refresh
      await act(async () => {
        await result.current.login({ email: 'test@club.es', password: 'pass' });
      });

      expect(result.current.accessToken).toBe('initial-access');

      // Avanzar el timer 60 segundos (120 - 60 margen = 60s delay)
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });

      // Esperar a que el refresh se procese
      await vi.waitFor(() => {
        expect(result.current.accessToken).toBe('refreshed-access');
      });

      // Assert — tokens actualizados
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBe('refreshed-refresh');

      vi.useRealTimers();
    });

    it('debe cerrar sesión si auto-refresh falla', async () => {
      // Arrange
      vi.useFakeTimers();

      const loginData = buildLoginResponse({
        expiresIn: 120,
        accessToken: 'will-expire-access',
        refreshToken: 'will-fail-refresh',
      });

      let refreshCallCount = 0;
      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(buildUserProfile()))),
        http.post('*/v1/auth/refresh', () => {
          refreshCallCount++;
          return HttpResponse.json(
            { error: { code: 'TOKEN_EXPIRED', message: 'Refresh expired', details: null } },
            { status: 401 },
          );
        }),
      );

      const { result } = renderHook(() => useAuth(), {
        wrapper: createAuthWrapper(),
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ email: 'test@club.es', password: 'pass' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Act — avanzar timer para trigger auto-refresh
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });

      // Esperar a que el refresh fallido limpie el estado
      await vi.waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      // Assert — sesión cerrada
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)).toBeNull();
      expect(refreshCallCount).toBeGreaterThanOrEqual(1);

      vi.useRealTimers();
    });
  });

  // -------------------------------------------
  // Login — manejo de errores
  // -------------------------------------------
  describe('login — manejo de errores', () => {
    it('debe propagar error si el API de login devuelve 401', async () => {
      // Arrange
      server.use(
        http.post('*/v1/auth/login', () =>
          HttpResponse.json(
            {
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Credenciales incorrectas',
                details: null,
              },
            },
            { status: 401 },
          ),
        ),
      );

      const { result } = await renderUseAuth();

      // Act — atrapar el error explícitamente para evitar
      // que async state quede pendiente entre tests
      let caughtError: unknown = null;
      await act(async () => {
        try {
          await result.current.login({ email: 'wrong@club.es', password: 'badpass' });
        } catch (err) {
          caughtError = err;
        }
      });

      // Assert
      expect(caughtError).not.toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('debe propagar error si el API de login devuelve 423 (cuenta bloqueada)', async () => {
      // Arrange — triangulación con error diferente
      server.use(
        http.post('*/v1/auth/login', () =>
          HttpResponse.json(
            { error: { code: 'ACCOUNT_LOCKED', message: 'Cuenta bloqueada', details: null } },
            { status: 423 },
          ),
        ),
      );

      const { result } = await renderUseAuth();

      // Act
      let caughtError: unknown = null;
      await act(async () => {
        try {
          await result.current.login({ email: 'locked@club.es', password: 'pass' });
        } catch (err) {
          caughtError = err;
        }
      });

      // Assert
      expect(caughtError).not.toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // -------------------------------------------
  // Token accessors para interceptors
  // -------------------------------------------
  describe('token accessors (module-level)', () => {
    it('debe registrar getAccessToken que devuelve el token actual', async () => {
      // Arrange
      const loginData = buildLoginResponse({ accessToken: 'interceptor-visible-token' });

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(buildUserProfile()))),
      );

      const { result } = await renderUseAuth();

      // Act
      await act(async () => {
        await result.current.login({ email: 'test@club.es', password: 'pass' });
      });

      // Assert — getAccessToken (module-level) retorna el token
      expect(getAccessToken()).toBe('interceptor-visible-token');
    });

    it('debe retornar null en getAccessToken cuando no hay sesión', async () => {
      // Arrange + Act
      await renderUseAuth();

      // Assert
      // Después de montar sin sesión, el getter queda registrado pero sin token
      // Nota: el valor inicial antes del mount puede ser null del getter default
      expect(getAccessToken()).toBeNull();
    });
  });

  // -------------------------------------------
  // isAuthenticated — lógica derivada
  // -------------------------------------------
  describe('isAuthenticated', () => {
    it('debe ser true solo cuando hay accessToken Y user', async () => {
      // Arrange
      const loginData = buildLoginResponse();

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(buildUserProfile()))),
        http.post('*/v1/auth/logout', () => new HttpResponse(null, { status: 204 })),
      );

      const { result } = await renderUseAuth();

      // Sin login → false
      expect(result.current.isAuthenticated).toBe(false);

      // Login → true
      await act(async () => {
        await result.current.login({ email: 'test@club.es', password: 'pass' });
      });
      expect(result.current.isAuthenticated).toBe(true);

      // Logout → false
      await act(async () => {
        await result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  // -------------------------------------------
  // Cleanup al desmontar
  // -------------------------------------------
  describe('cleanup al desmontar', () => {
    it('debe limpiar el timer de refresh al desmontar el provider', async () => {
      // Arrange
      vi.useFakeTimers();

      const loginData = buildLoginResponse({ expiresIn: 300 });
      let refreshCallCount = 0;

      server.use(
        http.post('*/v1/auth/login', () => HttpResponse.json(apiResponse(loginData))),
        http.get('*/v1/auth/me', () => HttpResponse.json(apiResponse(buildUserProfile()))),
        http.post('*/v1/auth/refresh', () => {
          refreshCallCount++;
          return HttpResponse.json(apiResponse(buildAuthTokens()));
        }),
      );

      const { result, unmount } = renderHook(() => useAuth(), {
        wrapper: createAuthWrapper(),
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login({ email: 'test@club.es', password: 'pass' });
      });

      // Act — desmontar antes de que el timer dispare
      unmount();

      // Avanzar el timer — no debería disparar refresh
      await act(async () => {
        vi.advanceTimersByTime(300_000);
      });

      // Assert — refresh no se llamó después del unmount
      expect(refreshCallCount).toBe(0);

      vi.useRealTimers();
    });
  });
});
