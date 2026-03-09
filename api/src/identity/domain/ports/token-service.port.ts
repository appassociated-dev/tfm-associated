/**
 * Puerto de salida para gestión de tokens JWT.
 * Abstrae la generación y verificación de tokens de acceso y refresco.
 * La implementación concreta reside en la capa de infraestructura.
 */

/** Payload contenido en un JWT de acceso. */
export interface JwtPayload {
  /** Identificador del usuario (subject). */
  sub: string;
  /** Identificador del tenant al que pertenece el usuario. */
  tenantId: string;
  /** Rol del usuario dentro del tenant. */
  rol: string;
  /** Permisos asignados al usuario. */
  permissions: string[];
  /** Email del usuario. */
  email: string;
  /** Nombre del usuario. */
  name: string;
}

/** Token de inyección para el puerto TokenService (NestJS DI). */
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenService {
  /** Genera un JWT de acceso firmado a partir del payload. */
  generateAccessToken(payload: JwtPayload): string;

  /** Genera un token de refresco opaco (aleatorio). */
  generateRefreshToken(): string;

  /** Genera un hash del token de refresco para almacenamiento seguro. */
  hashRefreshToken(token: string): string;

  /** Verifica y decodifica un JWT de acceso. Lanza error si es inválido. */
  verifyAccessToken(token: string): JwtPayload;
}
