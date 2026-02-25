// Guard de autorización RBAC por permisos granulares (ADR-007)
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from './require-permissions.decorator';
import { type Request } from 'express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtiene los permisos requeridos definidos en el decorador @RequirePermissions
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se definen permisos requeridos, el acceso está permitido
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as { permissions?: string[] } | undefined;

    if (!user?.permissions) {
      return false;
    }

    // Verifica que el usuario posea todos los permisos requeridos
    return requiredPermissions.every((permission) => user.permissions!.includes(permission));
  }
}
