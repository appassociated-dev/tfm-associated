import { Request } from 'express';

/**
 * Request con usuario autenticado inyectado por JwtAuthGuard (ADR-006).
 * La forma de `user` coincide exactamente con el retorno de JwtStrategy.validate().
 */
export interface RequestWithUser extends Request {
  user: {
    userId: string;
    tenantId: string;
    email: string;
    name: string;
    rol: string;
    permissions: string[];
  };
  tenantId?: string;
}
