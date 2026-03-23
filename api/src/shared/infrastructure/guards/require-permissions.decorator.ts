import { SetMetadata } from '@nestjs/common';

/** Clave de metadata para el decorador de permisos. */
export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorador que define los permisos requeridos para acceder a un endpoint.
 * Se usa en combinación con PermissionsGuard (ADR-007).
 *
 * @example
 * @RequirePermissions('members:read', 'members:write')
 * @Get()
 * findAll() { ... }
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
