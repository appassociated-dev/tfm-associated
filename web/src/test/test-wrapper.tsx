// TestWrapper configurable para tests unitarios y de integración.
// Replica la jerarquía de providers de AppProviders (providers.tsx)
// pero con configuración determinista para tests:
// - QueryClient con retry:false y gcTime:0
// - MemoryRouter en lugar de BrowserRouter
// - AuthContext.Provider directo en lugar de AuthProvider (evita side effects)
// - MantineProvider con el theme real de la aplicación

import { type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { AuthContext, type AuthContextValue } from '@/features/auth/context/auth.provider';
import i18n from '@/i18n/i18n';
import { associatedTheme } from '@/shared/theme/associated-theme';
import { vi } from 'vitest';

// === Default Auth Value ===

/**
 * Valor por defecto del contexto de auth para tests.
 * Simula un usuario admin autenticado con wildcard de permisos.
 * Los tests pueden sobreescribir campos individuales via options.auth.
 */
export const DEFAULT_AUTH: AuthContextValue = {
  user: { id: 'user-uuid-001', email: 'test@club.es', name: 'Test User' },
  tenant: { id: 'tenant-uuid-001', name: 'Club Test', slug: 'club-test' },
  role: 'admin',
  permissions: ['*'],
  isAuthenticated: true,
  isLoading: false,
  accessToken: 'test-access-token',
  login: vi.fn(),
  selectTenant: vi.fn(),
  switchTenant: vi.fn(),
  logout: vi.fn(),
};

// === Opciones del TestWrapper ===

export interface TestWrapperOptions {
  /** Patrón de ruta, ej: '/members/:memberId' */
  route?: string;
  /** URL real, ej: '/members/123'. Si no se da, se usa '/' */
  path?: string;
  /** Override parcial del contexto de auth */
  auth?: Partial<AuthContextValue>;
  /** Datos pre-populados en el QueryClient */
  queryData?: Array<{ queryKey: unknown[]; data: unknown }>;
}

/**
 * Crea un QueryClient fresco para cada test.
 * retry:false evita timeouts en tests de error.
 * gcTime:0 limpia cache entre tests para aislamiento.
 */
function createTestQueryClient(
  queryData?: Array<{ queryKey: unknown[]; data: unknown }>,
): QueryClient {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  // Pre-popular datos si se proporcionan
  if (queryData) {
    for (const { queryKey, data } of queryData) {
      client.setQueryData(queryKey, data);
    }
  }

  return client;
}

/**
 * Crea el wrapper de providers para tests.
 * Uso: render(<Component />, { wrapper: createTestWrapper({ auth: {...} }) })
 * O mejor, usar la función customRender de helpers/render.tsx.
 */
export function createTestWrapper(options: TestWrapperOptions = {}) {
  const { route, path = '/', auth, queryData } = options;

  const authValue: AuthContextValue = { ...DEFAULT_AUTH, ...auth };
  const queryClient = createTestQueryClient(queryData);

  function TestWrapper({ children }: { children: ReactNode }) {
    const routeContent = route ? (
      <Routes>
        <Route path={route} element={children} />
      </Routes>
    ) : (
      children
    );

    return (
      <MantineProvider theme={associatedTheme} defaultColorScheme="light">
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={authValue}>
              <MemoryRouter initialEntries={[path]}>{routeContent}</MemoryRouter>
            </AuthContext.Provider>
          </QueryClientProvider>
        </I18nextProvider>
      </MantineProvider>
    );
  }

  return TestWrapper;
}
