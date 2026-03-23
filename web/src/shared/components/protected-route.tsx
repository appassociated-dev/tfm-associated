import { Navigate, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Center, Loader, Stack, Text, Title } from '@mantine/core';
import { useAuth } from '@/features/auth/context/use-auth';
import { usePermissions } from '@/features/auth/context/use-permissions';

interface ProtectedRouteProps {
  permissions?: string[];
}

/**
 * Componente de ruta protegida que verifica autenticación y permisos.
 * Orden de evaluación: loading -> no auth -> sin permisos -> renderizar contenido.
 */
export function ProtectedRoute({ permissions }: ProtectedRouteProps) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const { hasAllPermissions } = usePermissions();

  // 1. Loading — verificación inicial en curso
  if (isLoading) {
    return (
      <Center mih="100vh">
        <Loader color="brand" size="lg" />
      </Center>
    );
  }

  // 2. No autenticado — redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Sin permisos requeridos — mostrar 403
  if (permissions && !hasAllPermissions(permissions)) {
    return (
      <Center mih="100vh">
        <Stack align="center" gap="md">
          <Title order={1}>403</Title>
          <Text c="dimmed">{t('errors.forbidden')}</Text>
        </Stack>
      </Center>
    );
  }

  // 4. Todo OK — renderizar contenido
  return <Outlet />;
}
