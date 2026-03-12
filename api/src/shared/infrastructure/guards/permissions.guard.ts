import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permissions.decorator';

/**
 * Guard de permisos basado en RBAC (ADR-007).
 * Verifica que el usuario autenticado tenga todos los permisos requeridos
 * definidos mediante el decorador @RequirePermissions().
 *
 * Politica de denegacion por defecto: si no hay usuario o no tiene permisos,
 * se deniega el acceso con ForbiddenException.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[] | undefined>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se requieren permisos especificos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { permissions?: string[] };
    }>();
    const user = request.user;

    // Denegacion por defecto: sin usuario o sin permisos -> ForbiddenException
    if (!user || !user.permissions) {
      throw new ForbiddenException('No permissions found');
    }

    // Verificar que el usuario tenga TODOS los permisos requeridos
    // Soporta wildcards: '*' concede todo, 'membership:*' concede todo bajo membership
    const hasAll = requiredPermissions.every((permission) =>
      this.hasPermission(user.permissions!, permission),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  /**
   * Verifica si un permiso requerido está cubierto por alguno de los permisos del usuario.
   * Soporta wildcards jerárquicos:
   *   - '*' concede acceso total
   *   - 'membership:*' concede 'membership:fiscal-years:create', 'membership:members:read', etc.
   *   - 'treasury:payments:read:*' concede 'treasury:payments:read:own', etc.
   */
  private hasPermission(userPermissions: string[], required: string): boolean {
    return userPermissions.some((granted) => {
      // Coincidencia exacta
      if (granted === required) return true;
      // Wildcard total
      if (granted === '*') return true;
      // Wildcard jerárquico: 'membership:*' cubre 'membership:anything:here'
      if (granted.endsWith(':*')) {
        const prefix = granted.slice(0, -1); // 'membership:'
        return required.startsWith(prefix);
      }
      return false;
    });
  }
}
