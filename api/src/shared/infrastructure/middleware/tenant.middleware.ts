// Middleware de resolución de tenant — extrae X-Tenant-Id del header
import { Injectable, type NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { type Request, type Response, type NextFunction } from 'express';

// Tipo extendido de Request que incluye el tenantId inyectado por este middleware
export type TenantRequest = Request & { tenantId?: string };

// Rutas excluidas de la validación de tenant — acceso público sin X-Tenant-Id
const PUBLIC_ROUTE_PREFIXES = ['/auth', '/tenants'];

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantRequest, _res: Response, next: NextFunction): void {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;
    const isPublicRoute = PUBLIC_ROUTE_PREFIXES.some((prefix) => req.path.startsWith(prefix));

    if (!tenantId && !isPublicRoute) {
      throw new UnauthorizedException('Tenant ID required');
    }

    if (tenantId) {
      // Inyecta el tenantId en el objeto de request para uso en handlers y servicios
      req.tenantId = tenantId;
    }

    next();
  }
}
