import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen } from '@testing-library/react';
import { Route, Routes, MemoryRouter } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type AuthContextValue } from '@/features/auth/context/auth.provider';
import { DEFAULT_AUTH } from '@/test';
import { associatedTheme } from '@/shared/theme/associated-theme';

import { ProtectedRoute } from './protected-route';

// === Helpers ===

/**
 * Render personalizado para ProtectedRoute.
 * Usa rtlRender directamente (NO nuestro custom render) porque:
 * - ProtectedRoute usa <Outlet /> que requiere estar en <Routes>/<Route>
 * - Nuestro custom render ya incluye un MemoryRouter => doble Router crash
 *
 * Recibe un override parcial de auth y los permisos requeridos por la ruta.
 */
function renderProtectedRoute(options: {
  auth?: Partial<AuthContextValue>;
  permissions?: string[];
  path?: string;
}) {
  const authValue: AuthContextValue = { ...DEFAULT_AUTH, ...options.auth };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });

  return rtlRender(
    <MantineProvider theme={associatedTheme} defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={[options.path ?? '/protected']}>
            <Routes>
              <Route element={<ProtectedRoute permissions={options.permissions} />}>
                <Route
                  path="/protected"
                  element={<div data-testid="protected-content">Contenido protegido</div>}
                />
              </Route>
              <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    </MantineProvider>,
  );
}

// === Tests ===

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Estado de carga ---

  describe('cuando isLoading es true', () => {
    it('deberia mostrar loader y no redirigir ni mostrar contenido', () => {
      // Arrange & Act
      renderProtectedRoute({
        auth: { isAuthenticated: false, isLoading: true },
      });

      // Assert — no se ve contenido protegido, ni login, ni 403
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      expect(screen.queryByText('403')).not.toBeInTheDocument();
    });

    it('deberia mostrar loader incluso si el usuario tiene permisos', () => {
      // Arrange & Act — isLoading prevalece sobre todo
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: true,
          permissions: ['*'],
        },
        permissions: ['treasury:fee-plans:read'],
      });

      // Assert
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });
  });

  // --- Redirección a login (no autenticado) ---

  describe('cuando no esta autenticado', () => {
    it('deberia redirigir a /login', () => {
      // Arrange & Act
      renderProtectedRoute({
        auth: { isAuthenticated: false, isLoading: false },
      });

      // Assert
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('deberia redirigir a /login sin importar los permisos del usuario', () => {
      // Arrange & Act — tiene permisos pero no está autenticado
      renderProtectedRoute({
        auth: {
          isAuthenticated: false,
          isLoading: false,
          permissions: ['*'],
        },
        permissions: ['treasury:fee-plans:read'],
      });

      // Assert
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  // --- 403 — permisos insuficientes ---

  describe('cuando esta autenticado pero sin permisos suficientes', () => {
    it('deberia mostrar 403 cuando no tiene ningun permiso requerido', () => {
      // Arrange & Act
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:members:read'],
        },
        permissions: ['treasury:fee-plans:create'],
      });

      // Assert
      expect(screen.getByText('403')).toBeInTheDocument();
      expect(
        screen.getByText('No tienes permisos para acceder a esta página.'),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('deberia mostrar 403 cuando tiene solo algunos de los permisos requeridos', () => {
      // Arrange & Act — tiene read pero no update
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:fee-plans:read'],
        },
        permissions: ['treasury:fee-plans:read', 'treasury:fee-plans:update'],
      });

      // Assert — hasAllPermissions requiere TODOS
      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('deberia mostrar 403 con permisos de distinto bounded context', () => {
      // Arrange & Act — tiene permisos de membership pero necesita treasury
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:members:read', 'membership:members:write'],
        },
        permissions: ['treasury:accounts:read'],
      });

      // Assert
      expect(screen.getByText('403')).toBeInTheDocument();
    });

    it('deberia mostrar 403 con array de permisos vacio', () => {
      // Arrange & Act — sin permisos asignados
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: [],
        },
        permissions: ['membership:members:read'],
      });

      // Assert
      expect(screen.getByText('403')).toBeInTheDocument();
    });
  });

  // --- Acceso autorizado ---

  describe('cuando esta autenticado con permisos correctos', () => {
    it('deberia renderizar contenido con coincidencia exacta de permisos', () => {
      // Arrange & Act
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:fee-plans:read'],
        },
        permissions: ['treasury:fee-plans:read'],
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    });

    it('deberia renderizar contenido cuando tiene mas permisos de los requeridos', () => {
      // Arrange & Act
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: [
            'membership:members:read',
            'membership:members:write',
            'treasury:fee-plans:read',
            'treasury:fee-plans:update',
          ],
        },
        permissions: ['membership:members:read'],
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('deberia renderizar contenido cuando se requieren multiples permisos y el usuario los tiene todos', () => {
      // Arrange & Act
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: [
            'treasury:fee-plans:read',
            'treasury:fee-plans:update',
            'treasury:fee-plans:create',
          ],
        },
        permissions: ['treasury:fee-plans:read', 'treasury:fee-plans:update'],
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('deberia renderizar contenido cuando no se requieren permisos (sin prop)', () => {
      // Arrange & Act — ruta sin restriccion de permisos
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: [],
        },
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('deberia renderizar contenido cuando permissions es undefined', () => {
      // Arrange & Act
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:members:read'],
        },
        permissions: undefined,
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  // --- Wildcards ---

  describe('wildcards de permisos', () => {
    it('deberia autorizar con wildcard total (*)', () => {
      // Arrange & Act — superadmin con wildcard total
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['*'],
        },
        permissions: ['treasury:fee-plans:create', 'treasury:fee-plans:update'],
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('deberia autorizar con wildcard de bounded context (treasury:*)', () => {
      // Arrange & Act — wildcard cubre todo el BC
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:*'],
        },
        permissions: ['treasury:fee-plans:read'],
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('deberia autorizar con wildcard de recurso (treasury:fee-plans:*)', () => {
      // Arrange & Act — wildcard cubre todas las acciones del recurso
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:fee-plans:*'],
        },
        permissions: ['treasury:fee-plans:read', 'treasury:fee-plans:update'],
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('deberia autorizar con wildcard de membership (membership:*)', () => {
      // Arrange & Act — triangulacion con otro BC
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['membership:*'],
        },
        permissions: ['membership:members:read'],
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('no deberia autorizar cuando el wildcard es de un BC diferente al requerido', () => {
      // Arrange & Act — tiene treasury:* pero necesita membership
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:*'],
        },
        permissions: ['membership:members:read'],
      });

      // Assert
      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('deberia autorizar con combinacion de wildcard y permiso exacto', () => {
      // Arrange & Act — wildcard para treasury + exacto para membership
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:*', 'membership:members:read'],
        },
        permissions: ['treasury:fee-plans:create', 'membership:members:read'],
      });

      // Assert
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('no deberia autorizar cuando el wildcard de recurso no cubre otro recurso del mismo BC', () => {
      // Arrange & Act — treasury:fee-plans:* NO cubre treasury:accounts:read
      renderProtectedRoute({
        auth: {
          isAuthenticated: true,
          isLoading: false,
          permissions: ['treasury:fee-plans:*'],
        },
        permissions: ['treasury:accounts:read'],
      });

      // Assert
      expect(screen.getByText('403')).toBeInTheDocument();
    });
  });

  // --- Orden de evaluacion ---

  describe('orden de evaluacion (loading > auth > permisos > render)', () => {
    it('deberia priorizar loading sobre autenticacion', () => {
      // Arrange & Act
      renderProtectedRoute({
        auth: {
          isAuthenticated: false,
          isLoading: true,
        },
      });

      // Assert — NO redirige a login mientras carga
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('deberia priorizar autenticacion sobre permisos', () => {
      // Arrange & Act — no autenticado con permisos
      renderProtectedRoute({
        auth: {
          isAuthenticated: false,
          isLoading: false,
          permissions: ['treasury:*'],
        },
        permissions: ['treasury:fee-plans:read'],
      });

      // Assert — redirige a login, no muestra 403
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
      expect(screen.queryByText('403')).not.toBeInTheDocument();
    });
  });
});
