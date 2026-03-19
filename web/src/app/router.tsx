import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Center, Loader } from '@mantine/core';
import { ProtectedRoute } from '@/shared/components/protected-route';
import { AppLayout } from '@/shared/components/layout/app-shell';
import { RouteError } from '@/shared/components/route-error';

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
const MemberSubscriptionsPage = lazy(() =>
  import('@/features/treasury/subscriptions/pages/member-subscriptions.page').then((m) => ({
    default: m.MemberSubscriptionsPage,
  })),
);
const SimpleRegistrationPage = lazy(() =>
  import('@/features/membership/registration/pages/simple-registration.page').then((m) => ({
    default: m.SimpleRegistrationPage,
  })),
);
const VoluntaryLeavePage = lazy(() =>
  import('@/features/membership/leave/pages/voluntary-leave.page').then((m) => ({
    default: m.VoluntaryLeavePage,
  })),
);
const NonpaymentLeavePage = lazy(() =>
  import('@/features/membership/leave/pages/nonpayment-leave.page').then((m) => ({
    default: m.NonpaymentLeavePage,
  })),
);
const ReinstatementPage = lazy(() =>
  import('@/features/membership/leave/pages/reinstatement.page').then((m) => ({
    default: m.ReinstatementPage,
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
    errorElement: <RouteError />,
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
          {
            path: 'members/new',
            element: <ProtectedRoute permissions={['membership:members:create']} />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={SuspenseFallback}>
                    <SimpleRegistrationPage />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: 'treasury/members/:memberId/subscriptions',
            element: <ProtectedRoute permissions={['treasury:subscriptions:read']} />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={SuspenseFallback}>
                    <MemberSubscriptionsPage />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: 'members/:memberId/leave',
            element: <ProtectedRoute permissions={['membership:members:deactivate']} />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={SuspenseFallback}>
                    <VoluntaryLeavePage />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: 'members/:memberId/nonpayment-leave',
            element: <ProtectedRoute permissions={['membership:members:deactivate']} />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={SuspenseFallback}>
                    <NonpaymentLeavePage />
                  </Suspense>
                ),
              },
            ],
          },
          {
            path: 'members/:memberId/reinstate',
            element: <ProtectedRoute permissions={['membership:members:reinstate']} />,
            children: [
              {
                index: true,
                element: (
                  <Suspense fallback={SuspenseFallback}>
                    <ReinstatementPage />
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
