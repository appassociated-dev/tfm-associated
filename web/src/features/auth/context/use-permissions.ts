import { useCallback } from 'react';
import { useAuth } from './use-auth';

/**
 * Verifica si un permiso requerido está cubierto por alguno de los permisos otorgados.
 * Soporta wildcards jerárquicos — port exacto del backend PermissionsGuard.hasPermission()
 * (api/src/shared/infrastructure/guards/permissions.guard.ts:90-103).
 *
 * Reglas:
 *   - Coincidencia exacta: 'membership:members:read' cubre 'membership:members:read'
 *   - Wildcard total: '*' cubre cualquier permiso
 *   - Wildcard jerárquico: 'treasury:*' cubre 'treasury:fee-plans:read', 'treasury:payments:create', etc.
 */
export function matchPermission(grantedPermissions: string[], required: string): boolean {
  return grantedPermissions.some((granted) => {
    // Coincidencia exacta
    if (granted === required) return true;
    // Wildcard total
    if (granted === '*') return true;
    // Wildcard jerárquico: 'membership:*' cubre 'membership:anything:here'
    if (granted.endsWith(':*')) {
      const prefix = granted.slice(0, -1); // 'membership:' de 'membership:*'
      return required.startsWith(prefix);
    }
    return false;
  });
}

/**
 * Hook derivado de useAuth para verificación de permisos.
 * Provee utilidades para chequear permisos individuales o combinados.
 * Soporta wildcards jerárquicos (*, bc:*, bc:resource:*).
 */
export function usePermissions() {
  const { permissions } = useAuth();

  /** Verifica si el usuario tiene un permiso específico (soporta wildcards). */
  const hasPermission = useCallback(
    (permission: string): boolean => matchPermission(permissions, permission),
    [permissions],
  );

  /** Verifica si el usuario tiene al menos uno de los permisos indicados (soporta wildcards). */
  const hasAnyPermission = useCallback(
    (perms: string[]): boolean => perms.some((p) => matchPermission(permissions, p)),
    [permissions],
  );

  /** Verifica si el usuario tiene todos los permisos indicados (soporta wildcards). */
  const hasAllPermissions = useCallback(
    (perms: string[]): boolean => perms.every((p) => matchPermission(permissions, p)),
    [permissions],
  );

  return { permissions, hasPermission, hasAnyPermission, hasAllPermissions };
}
