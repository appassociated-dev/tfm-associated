import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { validate as uuidValidate } from 'uuid';

/** Rutas excluidas de la validación de tenant. */
const EXCLUDED_PREFIXES = ['/auth', '/tenants', '/api/docs', '/health'];

/**
 * Middleware que extrae y valida el header X-Tenant-Id.
 * Las rutas excluidas (auth, tenants, docs, health) no requieren este header.
 * Establece req.tenantId para uso posterior en la cadena de handlers.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    // Comprobar si la ruta está excluida
    const path = req.baseUrl || req.path;
    const isExcluded = EXCLUDED_PREFIXES.some((prefix) =>
      path.startsWith(prefix),
    );

    if (isExcluded) {
      next();
      return;
    }

    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    if (!tenantId) {
      _res.status(400).json({
        error: {
          code: 'TENANT_HEADER_MISSING',
          message: 'El header X-Tenant-Id es obligatorio.',
          details: null,
        },
      });
      return;
    }

    if (!uuidValidate(tenantId)) {
      _res.status(400).json({
        error: {
          code: 'TENANT_HEADER_INVALID',
          message:
            'El header X-Tenant-Id debe ser un UUID válido.',
          details: null,
        },
      });
      return;
    }

    // Establecer tenantId en el request para uso posterior
    (req as Request & { tenantId: string }).tenantId = tenantId;
    next();
  }
}
