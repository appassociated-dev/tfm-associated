// Tests de integración para flujos de error y recuperación.
// Verifica el comportamiento real de:
// 1. React Query error states cuando la API falla (500, red caída)
// 2. Recuperación con retry (error → éxito)
// 3. React ErrorBoundary capturando errores de render
//
// NO usa vi.mock — integración real con MSW, React Query, y ErrorBoundary.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AuthContext, type AuthContextValue } from '@/features/auth/context/auth.provider';
import { DEFAULT_AUTH } from '@/test';
import { associatedTheme } from '@/shared/theme/associated-theme';
import { ErrorBoundary } from '@/shared/observability/error-boundary';
import { httpClient } from '@/shared/api/http-client';
import { server } from '@/test/msw/server';

// === Helpers internos ===

/**
 * QueryClient para tests de error: retry desactivado para que
 * los errores se propaguen inmediatamente sin reintentos automáticos.
 */
function createErrorTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

/**
 * Wrapper con todos los providers necesarios para tests de integración.
 * Incluye ErrorBoundary en la jerarquía, replicando AppProviders.
 */
function ErrorTestWrapper({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient: QueryClient;
}) {
  const authValue: AuthContextValue = { ...DEFAULT_AUTH };

  return (
    <ErrorBoundary>
      <MantineProvider theme={associatedTheme} defaultColorScheme="light">
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={authValue}>
            <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>
          </AuthContext.Provider>
        </QueryClientProvider>
      </MantineProvider>
    </ErrorBoundary>
  );
}

// === Componentes de prueba ===

/**
 * Componente que carga datos de un endpoint de prueba usando React Query.
 * Muestra loading, error con botón de reintentar, o los datos.
 */
function DataLoaderPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['test-data'],
    queryFn: async () => {
      const { data: response } = await httpClient.get('/v1/test/items');
      return response.data ?? response;
    },
  });

  if (isLoading) {
    return <div data-testid="loading-state">Cargando datos...</div>;
  }

  if (isError) {
    return (
      <div data-testid="error-state">
        <p data-testid="error-message">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
        <button onClick={() => refetch()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div data-testid="data-loaded">
      <ul>
        {(Array.isArray(data) ? data : []).map((item: { id: string; name: string }) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Componente que lanza un error durante el render al recibir una prop.
 * Usado para verificar que ErrorBoundary captura errores de render.
 */
function ExplodingComponent({ shouldExplode }: { shouldExplode: boolean }) {
  if (shouldExplode) {
    throw new Error('Componente explotó durante render');
  }
  return <div data-testid="healthy-component">Componente saludable</div>;
}

// === Tests ===

describe('Error Boundary — integración', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createErrorTestQueryClient();
  });

  // --- API 500 → error display ---

  describe('API 500 → error display', () => {
    it('debería mostrar estado de error cuando la API devuelve 500', async () => {
      // Arrange: endpoint devuelve 500
      server.use(
        http.get('*/v1/test/items', () => {
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        }),
      );

      // Act
      rtlRender(
        <ErrorTestWrapper queryClient={queryClient}>
          <DataLoaderPage />
        </ErrorTestWrapper>,
      );

      // Assert: primero se ve el loading
      expect(screen.getByTestId('loading-state')).toBeInTheDocument();

      // Luego aparece el error
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    });

    it('debería mostrar el mensaje del error del backend en el estado de error', async () => {
      // Arrange: endpoint devuelve 500 con error estandarizado
      server.use(
        http.get('*/v1/test/items', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Fallo interno del servidor',
                details: null,
              },
            },
            { status: 500 },
          );
        }),
      );

      // Act
      rtlRender(
        <ErrorTestWrapper queryClient={queryClient}>
          <DataLoaderPage />
        </ErrorTestWrapper>,
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Fallo interno del servidor');
      });
    });
  });

  // --- Retry → success recovery ---

  describe('Retry → success recovery', () => {
    it('debería recuperarse al hacer click en Reintentar después de un error', async () => {
      // Arrange: primer request falla, segundo tiene éxito
      let callCount = 0;
      const items = [
        { id: '1', name: 'Item Recuperado A' },
        { id: '2', name: 'Item Recuperado B' },
      ];

      server.use(
        http.get('*/v1/test/items', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ message: 'Error temporal' }, { status: 500 });
          }
          return HttpResponse.json({ data: items });
        }),
      );

      // Act
      const user = userEvent.setup();
      rtlRender(
        <ErrorTestWrapper queryClient={queryClient}>
          <DataLoaderPage />
        </ErrorTestWrapper>,
      );

      // Assert: primero error
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      // Act: click en Reintentar
      await user.click(screen.getByRole('button', { name: 'Reintentar' }));

      // Assert: datos cargados correctamente
      await waitFor(() => {
        expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
      });
      expect(screen.getByText('Item Recuperado A')).toBeInTheDocument();
      expect(screen.getByText('Item Recuperado B')).toBeInTheDocument();
    });

    it('debería mantener el error si el retry también falla', async () => {
      // Arrange: todos los requests fallan
      server.use(
        http.get('*/v1/test/items', () => {
          return HttpResponse.json({ message: 'Servicio no disponible' }, { status: 503 });
        }),
      );

      // Act
      const user = userEvent.setup();
      rtlRender(
        <ErrorTestWrapper queryClient={queryClient}>
          <DataLoaderPage />
        </ErrorTestWrapper>,
      );

      // Assert: error inicial
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      // Act: click en Reintentar
      await user.click(screen.getByRole('button', { name: 'Reintentar' }));

      // Assert: sigue en error (vuelve a loading y luego error)
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
    });

    it('debería recuperarse después de múltiples fallos (triangulación)', async () => {
      // Arrange: 3 fallos, luego éxito
      let callCount = 0;
      const items = [{ id: '1', name: 'Finalmente cargó' }];

      server.use(
        http.get('*/v1/test/items', () => {
          callCount++;
          if (callCount <= 3) {
            return HttpResponse.json({ message: `Error ${callCount}` }, { status: 500 });
          }
          return HttpResponse.json({ data: items });
        }),
      );

      // Act
      const user = userEvent.setup();
      rtlRender(
        <ErrorTestWrapper queryClient={queryClient}>
          <DataLoaderPage />
        </ErrorTestWrapper>,
      );

      // Primer fallo
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      // Segundo intento — fallo
      await user.click(screen.getByRole('button', { name: 'Reintentar' }));
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      // Tercer intento — fallo
      await user.click(screen.getByRole('button', { name: 'Reintentar' }));
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      // Cuarto intento — éxito
      await user.click(screen.getByRole('button', { name: 'Reintentar' }));
      await waitFor(() => {
        expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
      });
      expect(screen.getByText('Finalmente cargó')).toBeInTheDocument();
    });
  });

  // --- React ErrorBoundary ---

  describe('React ErrorBoundary', () => {
    it('debería capturar un error de render y mostrar fallback UI', () => {
      // Arrange: suprimir error de consola esperado
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act: renderizar componente que explota durante render
      rtlRender(
        <ErrorBoundary>
          <ExplodingComponent shouldExplode={true} />
        </ErrorBoundary>,
      );

      // Assert: fallback UI del ErrorBoundary real
      expect(screen.getByText('Ha ocurrido un error inesperado')).toBeInTheDocument();
      expect(screen.getByText('Componente explotó durante render')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Recargar página' })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('debería renderizar children normalmente cuando no hay error', () => {
      // Act
      rtlRender(
        <ErrorBoundary>
          <ExplodingComponent shouldExplode={false} />
        </ErrorBoundary>,
      );

      // Assert: componente hijo visible, sin fallback
      expect(screen.getByTestId('healthy-component')).toBeInTheDocument();
      expect(screen.getByText('Componente saludable')).toBeInTheDocument();
      expect(screen.queryByText('Ha ocurrido un error inesperado')).not.toBeInTheDocument();
    });

    it('debería mostrar fallback personalizado cuando se provee la prop fallback', () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const customFallback = <div data-testid="custom-fallback">Error personalizado</div>;

      // Act
      rtlRender(
        <ErrorBoundary fallback={customFallback}>
          <ExplodingComponent shouldExplode={true} />
        </ErrorBoundary>,
      );

      // Assert: fallback personalizado en lugar del por defecto
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Error personalizado')).toBeInTheDocument();
      expect(screen.queryByText('Ha ocurrido un error inesperado')).not.toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('debería reportar el error al ErrorReporter (componentDidCatch)', () => {
      // Arrange: crear un reporter mock para verificar que se llama
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockReporter = {
        captureException: vi.fn(),
        captureMessage: vi.fn(),
        setUser: vi.fn(),
        setContext: vi.fn(),
      };

      // Act
      rtlRender(
        <ErrorBoundary errorReporter={mockReporter}>
          <ExplodingComponent shouldExplode={true} />
        </ErrorBoundary>,
      );

      // Assert: se reportó el error al reporter
      expect(mockReporter.captureException).toHaveBeenCalledTimes(1);
      expect(mockReporter.captureException).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Componente explotó durante render',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        }),
      );

      consoleSpy.mockRestore();
    });
  });

  // --- Network failure ---

  describe('Network timeout/failure', () => {
    it('debería mostrar error cuando la red falla (endpoint inalcanzable)', async () => {
      // Arrange: simular error de red con HttpResponse.error()
      server.use(
        http.get('*/v1/test/items', () => {
          return HttpResponse.error();
        }),
      );

      // Act
      rtlRender(
        <ErrorTestWrapper queryClient={queryClient}>
          <DataLoaderPage />
        </ErrorTestWrapper>,
      );

      // Assert: estado de error visible
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
      // El httpClient transforma errores de red en ApiError con mensaje "Error de conexion"
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        /error de conexion|network|failed to fetch/i,
      );
    });

    it('debería recuperarse de un error de red al reintentar', async () => {
      // Arrange: primer request falla por red, segundo tiene éxito
      let callCount = 0;
      const items = [{ id: '1', name: 'Reconectado' }];

      server.use(
        http.get('*/v1/test/items', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json({ data: items });
        }),
      );

      // Act
      const user = userEvent.setup();
      rtlRender(
        <ErrorTestWrapper queryClient={queryClient}>
          <DataLoaderPage />
        </ErrorTestWrapper>,
      );

      // Assert: error de red
      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });

      // Act: reintentar
      await user.click(screen.getByRole('button', { name: 'Reintentar' }));

      // Assert: datos cargados
      await waitFor(() => {
        expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
      });
      expect(screen.getByText('Reconectado')).toBeInTheDocument();
    });
  });
});
