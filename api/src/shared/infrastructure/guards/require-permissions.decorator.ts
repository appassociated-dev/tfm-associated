// Decorador para requerir permisos granulares en controladores o handlers (ADR-007)
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';

// Aplica el decorador en un controlador o método para exigir los permisos especificados
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);
