import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Request } from 'express';
import { UnauthorizedException } from '../../../shared/infrastructure/filters/domain-exception.filter';

/**
 * Guard para proteger endpoints de superadmin.
 * Verifica el header X-Api-Key contra la variable de entorno SUPERADMIN_API_KEY.
 * En modo desarrollo (sin SUPERADMIN_API_KEY), permite todas las peticiones.
 */
@Injectable()
export class SuperadminGuard implements CanActivate {
  private readonly logger = new Logger(SuperadminGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const apiKey = process.env.SUPERADMIN_API_KEY;

    // Modo desarrollo: si no hay API key configurada, permitir todo
    if (!apiKey) {
      this.logger.warn('SUPERADMIN_API_KEY no configurada — acceso permitido (dev mode)');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers['x-api-key'];

    if (!providedKey || providedKey !== apiKey) {
      throw new UnauthorizedException('API key inválida o no proporcionada.');
    }

    return true;
  }
}
