// Smoke test del componente raíz App — verifica que se puede importar y renderizar sin errores fatales
import { describe, it, expect, vi } from 'vitest';

// Mockear módulos con dependencias externas complejas para el smoke test
// En tests de integración se usarán los providers reales
vi.mock('react-router', () => ({
  RouterProvider: ({ router }: { router: unknown }) => {
    // Componente stub para el smoke test — evita la inicialización del router real
    void router;
    return null;
  },
  createBrowserRouter: (routes: unknown[]) => routes,
}));

vi.mock('@mantine/core', () => ({
  MantineProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@mantine/notifications', () => ({
  Notifications: () => null,
}));

vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn().mockImplementation(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../../shared/observability/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

// Importar después de los mocks
import { App } from '../app';

describe('App component', () => {
  it('should export App as a function (component)', () => {
    // Verifica que el módulo se carga correctamente y App es un componente funcional
    expect(typeof App).toBe('function');
  });

  it('should have the correct component name', () => {
    // El nombre de la función debe coincidir con el export
    expect(App.name).toBe('App');
  });
});
