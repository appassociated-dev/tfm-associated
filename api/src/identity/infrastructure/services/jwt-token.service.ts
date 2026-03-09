import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { TokenService, JwtPayload } from '../../domain/ports/token-service.port';

/**
 * Implementación del puerto TokenService usando @nestjs/jwt.
 * Genera y verifica tokens de acceso JWT y tokens de refresco opacos.
 */
@Injectable()
export class JwtTokenServiceImpl implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  /** Genera un JWT de acceso firmado con el payload proporcionado. */
  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  /** Genera un token de refresco opaco usando UUID v4. */
  generateRefreshToken(): string {
    return crypto.randomUUID();
  }

  /** Genera un hash SHA-256 del token de refresco para almacenamiento seguro. */
  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Verifica y decodifica un JWT de acceso. Lanza error si es inválido o expirado. */
  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token);
  }
}
