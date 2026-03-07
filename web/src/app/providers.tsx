import { type ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { ErrorBoundary } from '@/shared/observability/error-boundary';
import { theme } from './theme';
import { router } from './router';

/** Cliente de React Query con configuración por defecto. */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface AppProvidersProps {
  /** Contenido hijo opcional (si no se usa RouterProvider directo). */
  children?: ReactNode;
}

/**
 * Jerarquía de proveedores de la aplicación.
 * Orden: ErrorBoundary → MantineProvider → QueryClientProvider → RouterProvider.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <MantineProvider theme={theme}>
        <Notifications />
        <QueryClientProvider client={queryClient}>
          {children ?? <RouterProvider router={router} />}
        </QueryClientProvider>
      </MantineProvider>
    </ErrorBoundary>
  );
}
