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
    const hasAll = requiredPermissions.every((permission) =>
      user.permissions!.includes(permission),
    );

    if (!hasAll) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
