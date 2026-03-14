import { useCallback } from 'react';
import { useAuth } from './use-auth';

/**
 * Hook derivado de useAuth para verificación de permisos.
 * Provee utilidades para chequear permisos individuales o combinados.
 */
export function usePermissions() {
  const { permissions } = useAuth();

  /** Verifica si el usuario tiene un permiso específico. */
  const hasPermission = useCallback(
    (permission: string): boolean => permissions.includes(permission),
    [permissions],
  );

  /** Verifica si el usuario tiene al menos uno de los permisos indicados. */
  const hasAnyPermission = useCallback(
    (perms: string[]): boolean => perms.some((p) => permissions.includes(p)),
    [permissions],
  );

  /** Verifica si el usuario tiene todos los permisos indicados. */
  const hasAllPermissions = useCallback(
    (perms: string[]): boolean => perms.every((p) => permissions.includes(p)),
    [permissions],
  );

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
}
