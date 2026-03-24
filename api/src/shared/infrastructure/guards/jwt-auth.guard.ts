import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../../identity/infrastructure/auth/public.decorator';

/**
 * Guard de autenticacion JWT (ADR-006).
 * Extiende AuthGuard('jwt') de @nestjs/passport para validar tokens JWT.
 *
 * Comportamiento:
 * - Si el endpoint tiene @Public(), permite el acceso sin token.
 * - En caso contrario, valida el JWT y establece req.user.
 * - Inyecta req.tenantId desde el payload del JWT para PrismaTenantService.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determina si la peticion puede proceder.
   * Comprueba primero si el endpoint es publico; si no, delega en Passport.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Procesa el resultado de la validacion JWT.
   * Si hay error o no hay usuario, lanza UnauthorizedException.
   * Inyecta tenantId en el request para uso posterior en la cadena.
   */
  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    // Inyectar tenantId en request para PrismaTenantService
    const request = context.switchToHttp().getRequest<{
      tenantId?: string;
    }>();

    const payload = user as Record<string, unknown>;
    if (payload['tenantId']) {
      request.tenantId = payload['tenantId'] as string;
    }

    return user;
  }
}
