import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../domain/ports/token-service.port';

/**
 * Estrategia JWT para Passport.
 * Extrae y valida el token Bearer del header Authorization.
 * El metodo validate() devuelve el objeto que se asigna a req.user (ADR-006).
 *
 * Lee JWT_SECRET desde variables de entorno (process.env).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env['JWT_SECRET'] ?? '',
    });
  }

  /**
   * Passport invoca este método tras verificar la firma del JWT.
   * El valor de retorno se asigna a req.user.
   */
  validate(payload: JwtPayload): {
    userId: string;
    tenantId: string;
    email: string;
    name: string;
    rol: string;
    permissions: string[];
  } {
    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      name: payload.name,
      rol: payload.rol,
      permissions: payload.permissions,
    };
  }
}
