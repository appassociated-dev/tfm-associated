// Configuración de rutas de la aplicación
import { createBrowserRouter } from 'react-router';

export const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('../features/auth/pages/login-page'),
  },
  {
    path: '/dashboard',
    lazy: () => import('../features/dashboard/pages/dashboard-page'),
  },
]);
