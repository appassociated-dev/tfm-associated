import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import { Route, Routes, MemoryRouter, Outlet } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type AuthContextValue } from '@/features/auth/context/auth.provider';
import { DEFAULT_AUTH } from '@/test';
import { associatedTheme } from '@/shared/theme/associated-theme';
import { ProtectedRoute } from '@/shared/components/protected-route';

// === Mini App Layout para integración ===

/**
 * Layout simplificado que replica la estructura real del router (router.tsx).
 * Renderiza un Outlet donde se montan las páginas hijas.
 */
function TestAppLayout() {
  return (
    <div data-testid="app-layout">
      <nav data-testid="sidebar">Sidebar</nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

// === Páginas dummy para verificación ===

function DashboardPage() {
  return <div data-testid="dashboard-page">Dashboard</div>;
}

function FeePlansPage() {
  return <div data-testid="fee-plans-page">Fee Plans</div>;
}

function MemberRegistrationPage() {
  return <div data-testid="member-registration-page">Nuevo Socio</div>;
}

function SubscriptionsPage() {
  return <div data-testid="subscriptions-page">Suscripciones</div>;
}

function LoginPage() {
  return <div data-testid="login-page">Login</div>;
}

// === Render helper ===

/**
 * Renderiza la mini-app completa con el árbol de rutas que replica
 * la estructura real de router.tsx (ProtectedRoute anidado + layout).
 *
 * NO usa vi.mock — integración real con ProtectedRoute + AuthContext + MemoryRouter.
 */
function renderApp(options: { auth?: Partial<AuthContextValue>; initialPath?: string }) {
  const authValue: AuthContextValue = { ...DEFAULT_AUTH, ...options.auth };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return rtlRender(
    <MantineProvider theme={associatedTheme} defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={[options.initialPath ?? '/dashboard']}>
            <Routes>
              {/* Ruta pública */}
              <Route path="/login" element={<LoginPage />} />

              {/* Guard raíz — requiere autenticación */}
              <Route path="/" element={<ProtectedRoute />}>
                <Route element={<TestAppLayout />}>
                  <Route path="dashboard" element={<DashboardPage />} />

                  {/* Guard de treasury:fee-plans:read */}
                  <Route
                    path="treasury/fee-plans"
                    element={<ProtectedRoute permissions={['treasury:fee-plans:read']} />}
                  >
                    <Route index element={<FeePlansPage />} />
                  </Route>

                  {/* Guard de membership:members:create */}
                  <Route
                    path="members/new"
                    element={<ProtectedRoute permissions={['membership:members:create']} />}
                  >
                    <Route index element={<MemberRegistrationPage />} />
                  </Route>

                  {/* Guard de treasury:subscriptions:read */}
                  <Route
                    path="treasury/subscriptions"
                    element={<ProtectedRoute permissions={['treasury:subscriptions:read']} />}
                  >
                    <Route index element={<SubscriptionsPage />} />
                  </Route>
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </MantineProvider>,
  );
}

// === Tests ===

describe('Route Guards Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 1. Usuario no autenticado → redirección a /login ---

  describe('usuario no autenticado', () => {
    const unauthenticatedAuth: Partial<AuthContextValue> = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tenant: null,
      permissions: [],
    };

    it('debería redirigir a /login al intentar acceder a /dashboard', () => {
      renderApp({
        auth: unauthenticatedAuth,
        initialPath: '/dashboard',
      });

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument();
    });

    it('debería redirigir a /login al intentar acceder a una ruta con permisos específicos', () => {
      renderApp({
        auth: unauthenticatedAuth,
        initialPath: '/treasury/fee-plans',
      });

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('fee-plans-page')).not.toBeInTheDocument();
    });

    it('debería redirigir a /login al intentar acceder a /members/new', () => {
      renderApp({
        auth: unauthenticatedAuth,
        initialPath: '/members/new',
      });

      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('member-registration-page')).not.toBeInTheDocument();
    });
  });

  // --- 2. Permisos insuficientes → 403 ---

  describe('permisos insuficientes', () => {
    it('debería mostrar 403 cuando el usuario no tiene el permiso de la ruta', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:members:read'],
        },
        initialPath: '/treasury/fee-plans',
      });

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(
        screen.getByText('No tienes permisos para acceder a esta página.'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('fee-plans-page')).not.toBeInTheDocument();
    });

    it('debería mostrar 403 con permisos vacíos en ruta que requiere permiso', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: [],
        },
        initialPath: '/members/new',
      });

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.queryByTestId('member-registration-page')).not.toBeInTheDocument();
    });

    it('debería mostrar 403 cuando tiene permiso parcial (read pero necesita create)', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:members:read'],
        },
        initialPath: '/members/new',
      });

      // La ruta /members/new requiere membership:members:create
      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.queryByTestId('member-registration-page')).not.toBeInTheDocument();
    });
  });

  // --- 3. Usuario autorizado → renderiza la página ---

  describe('usuario autorizado', () => {
    it('debería renderizar /dashboard para usuario autenticado (sin permiso específico)', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: [],
        },
        initialPath: '/dashboard',
      });

      // Dashboard no tiene guard de permisos específico, solo autenticación
      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('debería renderizar fee-plans con permiso exacto', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:fee-plans:read'],
        },
        initialPath: '/treasury/fee-plans',
      });

      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      expect(screen.getByTestId('fee-plans-page')).toBeInTheDocument();
    });

    it('debería renderizar member registration con permiso exacto', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:members:create'],
        },
        initialPath: '/members/new',
      });

      expect(screen.getByTestId('app-layout')).toBeInTheDocument();
      expect(screen.getByTestId('member-registration-page')).toBeInTheDocument();
    });

    it('debería renderizar con wildcard total (*)', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['*'],
        },
        initialPath: '/treasury/fee-plans',
      });

      expect(screen.getByTestId('fee-plans-page')).toBeInTheDocument();
    });
  });

  // --- 4. Wildcard permissions ---

  describe('wildcard de permisos', () => {
    it('debería autorizar con treasury:* para ruta que requiere treasury:fee-plans:read', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:*'],
        },
        initialPath: '/treasury/fee-plans',
      });

      expect(screen.getByTestId('fee-plans-page')).toBeInTheDocument();
      expect(screen.queryByText('403')).not.toBeInTheDocument();
    });

    it('debería autorizar con treasury:* para ruta que requiere treasury:subscriptions:read', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:*'],
        },
        initialPath: '/treasury/subscriptions',
      });

      expect(screen.getByTestId('subscriptions-page')).toBeInTheDocument();
      expect(screen.queryByText('403')).not.toBeInTheDocument();
    });

    it('debería autorizar con membership:* para ruta que requiere membership:members:create', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:*'],
        },
        initialPath: '/members/new',
      });

      expect(screen.getByTestId('member-registration-page')).toBeInTheDocument();
      expect(screen.queryByText('403')).not.toBeInTheDocument();
    });

    it('debería autorizar con wildcard de recurso (treasury:fee-plans:*)', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:fee-plans:*'],
        },
        initialPath: '/treasury/fee-plans',
      });

      expect(screen.getByTestId('fee-plans-page')).toBeInTheDocument();
    });
  });

  // --- 5. Cross-BC denial ---

  describe('denegación cross-BC', () => {
    it('membership:* NO debería autorizar acceso a treasury:fee-plans:read', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:*'],
        },
        initialPath: '/treasury/fee-plans',
      });

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.queryByTestId('fee-plans-page')).not.toBeInTheDocument();
    });

    it('membership:* NO debería autorizar acceso a treasury:subscriptions:read', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:*'],
        },
        initialPath: '/treasury/subscriptions',
      });

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.queryByTestId('subscriptions-page')).not.toBeInTheDocument();
    });

    it('treasury:* NO debería autorizar acceso a membership:members:create', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:*'],
        },
        initialPath: '/members/new',
      });

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.queryByTestId('member-registration-page')).not.toBeInTheDocument();
    });

    it('treasury:fee-plans:* NO debería autorizar treasury:subscriptions:read', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:fee-plans:*'],
        },
        initialPath: '/treasury/subscriptions',
      });

      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.queryByTestId('subscriptions-page')).not.toBeInTheDocument();
    });

    it('debería permitir acceso con permisos de ambos BCs', () => {
      renderApp({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:*', 'membership:*'],
        },
        initialPath: '/treasury/fee-plans',
      });

      expect(screen.getByTestId('fee-plans-page')).toBeInTheDocument();
    });
  });

  // --- 6. Estado de carga ---

  describe('estado de carga', () => {
    it('debería mostrar loader mientras isLoading es true (no redirige ni muestra 403)', () => {
      renderApp({
        auth: {
          isAuthenticated: false,
          isLoading: true,
          permissions: [],
        },
        initialPath: '/treasury/fee-plans',
      });

      // No debe redirigir a login ni mostrar 403 ni contenido
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      expect(screen.queryByText('403')).not.toBeInTheDocument();
      expect(screen.queryByTestId('fee-plans-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument();
    });
  });
});
