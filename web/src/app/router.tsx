import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Center, Loader } from '@mantine/core';
import { ProtectedRoute } from '@/shared/components/protected-route';
import { AppLayout } from '@/shared/components/layout/app-shell';

// Carga lazy de páginas para code splitting
const LoginPage = lazy(() =>
  import('@/features/auth/pages/login.page').then((m) => ({
    default: m.LoginPage,
  })),
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/dashboard.page').then((m) => ({
    default: m.DashboardPage,
  })),
);
const FeePlansListPage = lazy(() =>
  import('@/features/treasury/fee-plans/pages/fee-plans-list.page').then((m) => ({
    default: m.FeePlansListPage,
  })),
);

// Fallback de carga compartido para Suspense
const SuspenseFallback = (
  <Center mih="100vh">
    <Loader color="brand" />
  </Center>
);

/**
 * Configuración del enrutador de la aplicación.
 * Rutas públicas: /login
 * Rutas protegidas: / → ProtectedRoute → AppLayout (sidebar + navbar + Outlet)
 *   ├→ /dashboard → DashboardPage
 *   └→ index → redirige a /dashboard
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={SuspenseFallback}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: 'dashboard',
            element: (
              <Suspense fallback={SuspenseFallback}>
                <DashboardPage />
              </Suspense>
            ),
          },
          {
            path: 'treasury/fee-plans',
            element: <ProtectedRoute permissions={['treasury:fee-plans:read']} />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={SuspenseFallback}>
                    <FeePlansListPage />
                  </Suspense>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);
