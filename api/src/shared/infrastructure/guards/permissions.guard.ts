import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permissions.decorator';

/**
 * Guard de permisos basado en RBAC (ADR-007).
 * Verifica que el usuario autenticado tenga los permisos requeridos
 * definidos mediante el decorador @RequirePermissions().
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      string[] | undefined
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // Si no se requieren permisos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { permissions?: string[] };
    }>();
    const user = request.user;

    if (!user || !user.permissions) {
      return false;
    }

    // Verificar que el usuario tenga todos los permisos requeridos
    return requiredPermissions.every((permission) =>
      user.permissions!.includes(permission),
    );
  }
}
