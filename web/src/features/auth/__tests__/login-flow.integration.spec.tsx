// Test de integración del flujo de login completo.
// Usa componentes reales (LoginPage, AuthProvider, TenantSelector),
// MemoryRouter con rutas, MSW para API y Notifications de Mantine.
// NO usa vi.mock de módulos internos — testea comportamiento real del usuario.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/i18n';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import {
  buildLoginResponse,
  buildTenantSelectorResponse,
  buildUserProfile,
  buildUser,
  buildTenant,
  resetAuthCounters,
} from '@/test/factories';
import { AuthProvider } from '../context/auth.provider';
import { LoginPage } from '../pages/login.page';
import { associatedTheme } from '@/shared/theme/associated-theme';

// === Constantes ===

const AUTH_BASE = '*/v1/auth';

// === Helpers ===

/**
 * Crea el wrapper de integración con providers reales.
 * A diferencia del TestWrapper, usa AuthProvider REAL (no AuthContext.Provider mock).
 * Incluye Notifications de Mantine para que notifications.show() funcione.
 */
function createIntegrationWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function IntegrationWrapper({ children }: { children: ReactNode }) {
    return (
      <MantineProvider theme={associatedTheme} defaultColorScheme="light">
        <I18nextProvider i18n={i18n}>
          <Notifications />
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <MemoryRouter initialEntries={['/login']}>
                <Routes>
                  <Route path="/login" element={children} />
                  <Route path="/dashboard" element={<div>Dashboard Page</div>} />
                </Routes>
              </MemoryRouter>
            </AuthProvider>
          </QueryClientProvider>
        </I18nextProvider>
      </MantineProvider>
    );
  };
}

/**
 * Renderiza LoginPage dentro del wrapper de integración.
 * Espera a que AuthProvider termine la carga inicial (isLoading → false)
 * antes de considerar el render listo.
 */
async function renderLoginFlow() {
  const user = userEvent.setup();
  const Wrapper = createIntegrationWrapper();

  render(<LoginPage />, { wrapper: Wrapper });

  // Esperar a que AuthProvider termine la restauración de sesión
  // y la LoginPage se renderice con el formulario visible
  await waitFor(() => {
    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
  });

  return { user };
}

/**
 * Rellena el formulario de login con email y password usando userEvent.
 */
async function fillLoginForm(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string,
) {
  const emailInput = screen.getByPlaceholderText('tu@email.com');
  const passwordInput = screen.getByPlaceholderText('Tu contraseña');

  await user.clear(emailInput);
  await user.type(emailInput, email);
  await user.clear(passwordInput);
  await user.type(passwordInput, password);
}

/**
 * Envía el formulario haciendo click en el botón "Acceder".
 */
async function submitLoginForm(user: ReturnType<typeof userEvent.setup>) {
  const submitButton = screen.getByRole('button', { name: /acceder/i });
  await user.click(submitButton);
}

// === Setup ===

beforeEach(() => {
  localStorage.clear();
  resetAuthCounters();
});

// === Tests ===

describe('Login Flow (Integración)', () => {
  // -----------------------------------------------
  // 1. Login directo — single tenant
  // -----------------------------------------------
  describe('login directo (single tenant)', () => {
    it('debe redirigir a /dashboard tras login exitoso con un solo tenant', async () => {
      // Arrange — API devuelve login directo (single tenant)
      const userData = buildUser({ name: 'Ana García', email: 'ana@club.es' });
      const tenantData = buildTenant({ name: 'Club Deportivo', slug: 'club-deportivo' });
      const loginResponse = buildLoginResponse({
        user: userData,
        tenant: tenantData,
        role: 'admin',
      });
      const profile = buildUserProfile({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        currentTenant: tenantData,
        role: 'admin',
        permissions: ['*'],
      });

      server.use(
        http.post(`${AUTH_BASE}/login`, () => HttpResponse.json(apiResponse(loginResponse))),
        http.get(`${AUTH_BASE}/me`, () => HttpResponse.json(apiResponse(profile))),
      );

      // Act
      const { user } = await renderLoginFlow();
      await fillLoginForm(user, 'ana@club.es', 'secret123');
      await submitLoginForm(user);

      // Assert — navegó al dashboard
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      });
    });

    it('debe redirigir a /dashboard con datos diferentes (triangulación)', async () => {
      // Arrange — segundo conjunto de datos para triangular
      const userData = buildUser({ name: 'Carlos Pérez', email: 'carlos@fed.es' });
      const tenantData = buildTenant({ name: 'Federación Vasca', slug: 'fed-vasca' });
      const loginResponse = buildLoginResponse({
        user: userData,
        tenant: tenantData,
        role: 'member',
      });
      const profile = buildUserProfile({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        currentTenant: tenantData,
        role: 'member',
        permissions: ['membership:members:read'],
      });

      server.use(
        http.post(`${AUTH_BASE}/login`, () => HttpResponse.json(apiResponse(loginResponse))),
        http.get(`${AUTH_BASE}/me`, () => HttpResponse.json(apiResponse(profile))),
      );

      // Act
      const { user } = await renderLoginFlow();
      await fillLoginForm(user, 'carlos@fed.es', 'password456');
      await submitLoginForm(user);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      });
    });
  });

  // -----------------------------------------------
  // 2. Login multi-tenant — selector de colectividad
  // -----------------------------------------------
  describe('login multi-tenant (selector de colectividad)', () => {
    it('debe mostrar selector de tenant y redirigir tras selección', async () => {
      // Arrange — login devuelve multi-tenant, luego select-tenant completa el flujo
      const tenantA = { ...buildTenant({ name: 'Club Alfa', slug: 'club-alfa' }), role: 'admin' };
      const tenantB = { ...buildTenant({ name: 'Club Beta', slug: 'club-beta' }), role: 'member' };
      const selectorResponse = buildTenantSelectorResponse({
        tenants: [tenantA, tenantB],
      });

      const selectTenantResponse = buildLoginResponse({
        tenant: { id: tenantA.id, name: tenantA.name, slug: tenantA.slug },
        role: 'admin',
      });
      const profile = buildUserProfile({ permissions: ['*'] });

      server.use(
        http.post(`${AUTH_BASE}/login`, () => HttpResponse.json(apiResponse(selectorResponse))),
        http.post(`${AUTH_BASE}/select-tenant`, () =>
          HttpResponse.json(apiResponse(selectTenantResponse)),
        ),
        http.get(`${AUTH_BASE}/me`, () => HttpResponse.json(apiResponse(profile))),
      );

      // Act — llenar credenciales y enviar
      const { user } = await renderLoginFlow();
      await fillLoginForm(user, 'multi@club.es', 'secret');
      await submitLoginForm(user);

      // Assert — aparece el selector de tenant con ambos clubs
      await waitFor(() => {
        expect(screen.getByText('Selecciona una colectividad')).toBeInTheDocument();
      });
      expect(screen.getByText('Club Alfa')).toBeInTheDocument();
      expect(screen.getByText('Club Beta')).toBeInTheDocument();

      // El formulario de login ya no debe estar visible
      expect(screen.queryByPlaceholderText('tu@email.com')).not.toBeInTheDocument();

      // Act — seleccionar Club Alfa
      await user.click(screen.getByText('Club Alfa'));

      // Assert — redirigió al dashboard
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      });
    });

    it('debe permitir seleccionar el segundo tenant (triangulación)', async () => {
      // Arrange — misma estructura pero seleccionamos el segundo tenant
      const tenantX = { ...buildTenant({ name: 'Fed X', slug: 'fed-x' }), role: 'treasurer' };
      const tenantY = { ...buildTenant({ name: 'Fed Y', slug: 'fed-y' }), role: 'secretary' };
      const selectorResponse = buildTenantSelectorResponse({
        tenants: [tenantX, tenantY],
      });

      const selectTenantResponse = buildLoginResponse({
        tenant: { id: tenantY.id, name: tenantY.name, slug: tenantY.slug },
        role: 'secretary',
      });
      const profile = buildUserProfile({ permissions: ['communication:*'] });

      server.use(
        http.post(`${AUTH_BASE}/login`, () => HttpResponse.json(apiResponse(selectorResponse))),
        http.post(`${AUTH_BASE}/select-tenant`, () =>
          HttpResponse.json(apiResponse(selectTenantResponse)),
        ),
        http.get(`${AUTH_BASE}/me`, () => HttpResponse.json(apiResponse(profile))),
      );

      // Act
      const { user } = await renderLoginFlow();
      await fillLoginForm(user, 'user@fed.es', 'password');
      await submitLoginForm(user);

      await waitFor(() => {
        expect(screen.getByText('Selecciona una colectividad')).toBeInTheDocument();
      });

      // Seleccionar Fed Y (el segundo)
      await user.click(screen.getByText('Fed Y'));

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      });
    });
  });

  // -----------------------------------------------
  // 3. Credenciales inválidas (401)
  // -----------------------------------------------
  describe('credenciales inválidas (401)', () => {
    it('debe mostrar notificación de error y mantener el formulario editable', async () => {
      // Arrange — API devuelve 401
      server.use(
        http.post(`${AUTH_BASE}/login`, () =>
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

      // Act
      const { user } = await renderLoginFlow();
      await fillLoginForm(user, 'wrong@club.es', 'badpassword');
      await submitLoginForm(user);

      // Assert — notificación de error visible en el DOM (Notifications de Mantine)
      await waitFor(() => {
        expect(screen.getByText('Credenciales incorrectas')).toBeInTheDocument();
      });

      // El formulario sigue presente y editable
      const emailInput = screen.getByPlaceholderText('tu@email.com');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).not.toBeDisabled();

      // No se navega a otro lugar
      expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });

    it('debe permitir reintentar después de un error 401', async () => {
      // Arrange — primero 401, luego éxito
      let loginAttempt = 0;
      const loginResponse = buildLoginResponse();
      const profile = buildUserProfile({ permissions: ['*'] });

      server.use(
        http.post(`${AUTH_BASE}/login`, () => {
          loginAttempt++;
          if (loginAttempt === 1) {
            return HttpResponse.json(
              {
                error: {
                  code: 'INVALID_CREDENTIALS',
                  message: 'Credenciales incorrectas',
                  details: null,
                },
              },
              { status: 401 },
            );
          }
          return HttpResponse.json(apiResponse(loginResponse));
        }),
        http.get(`${AUTH_BASE}/me`, () => HttpResponse.json(apiResponse(profile))),
      );

      // Act — primer intento (falla)
      const { user } = await renderLoginFlow();
      await fillLoginForm(user, 'wrong@club.es', 'badpassword');
      await submitLoginForm(user);

      // Verificar que la notificación de error apareció
      await waitFor(() => {
        const errors = screen.getAllByText('Credenciales incorrectas');
        expect(errors.length).toBeGreaterThanOrEqual(1);
      });

      // El formulario sigue visible — podemos reintentar
      expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();

      // Act — segundo intento (éxito) — rellenar con credenciales correctas
      await fillLoginForm(user, 'correct@club.es', 'goodpassword');
      await submitLoginForm(user);

      // Assert — ahora sí navega al dashboard
      await waitFor(() => {
        expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
      });
    });
  });

  // -----------------------------------------------
  // 4. Cuenta bloqueada (423)
  // -----------------------------------------------
  describe('cuenta bloqueada (423)', () => {
    it('debe mostrar mensaje de cuenta bloqueada', async () => {
      // Arrange — API devuelve 423
      server.use(
        http.post(`${AUTH_BASE}/login`, () =>
          HttpResponse.json(
            { error: { code: 'ACCOUNT_LOCKED', message: 'Account locked', details: null } },
            { status: 423 },
          ),
        ),
      );

      // Act
      const { user } = await renderLoginFlow();
      await fillLoginForm(user, 'locked@club.es', 'password123');
      await submitLoginForm(user);

      // Assert — notificación de cuenta bloqueada
      await waitFor(() => {
        expect(screen.getByText('Cuenta bloqueada')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Cuenta bloqueada temporalmente. Reintente en unos minutos'),
      ).toBeInTheDocument();

      // Formulario sigue visible
      expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------
  // 5. Error de red
  // -----------------------------------------------
  describe('error de red', () => {
    it('debe mostrar mensaje de error de conexión cuando la API no responde', async () => {
      // Arrange — MSW devuelve error de red
      server.use(
        http.post(`${AUTH_BASE}/login`, () => {
          return HttpResponse.error();
        }),
      );

      // Act
      const { user } = await renderLoginFlow();
      await fillLoginForm(user, 'test@club.es', 'password123');
      await submitLoginForm(user);

      // Assert — notificación de error de conexión
      await waitFor(() => {
        expect(screen.getByText('Error de conexión')).toBeInTheDocument();
      });
      expect(screen.getByText('Verifique su conexión a internet')).toBeInTheDocument();

      // Formulario sigue editable
      expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
    });
  });
});
