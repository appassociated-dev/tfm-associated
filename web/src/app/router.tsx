import { createBrowserRouter } from 'react-router';

/**
 * Página placeholder de login.
 * Se reemplazará con la implementación real del módulo auth.
 */
function LoginPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Associated — Login</h1>
      <p>Página de login (placeholder)</p>
    </div>
  );
}

/**
 * Página placeholder de dashboard.
 * Se reemplazará con la implementación real del dashboard principal.
 */
function DashboardPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Associated — Dashboard</h1>
      <p>Panel principal (placeholder)</p>
    </div>
  );
}

/**
 * Configuración del enrutador de la aplicación.
 * Rutas básicas: login y dashboard (placeholders).
 */
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <DashboardPage />,
  },
]);
