/**
 * Interfaz del repositorio de RefreshToken.
 * Define las operaciones de persistencia para los tokens de refresco.
 * La implementación concreta reside en la capa de infraestructura.
 */

/** Datos de un refresh token almacenado en persistencia. */
export interface RefreshTokenData {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

/** Token de inyección para el repositorio de RefreshToken (NestJS DI). */
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export interface RefreshTokenRepository {
  /** Crea un nuevo refresh token en persistencia. */
  create(data: { tokenHash: string; userId: string; expiresAt: Date }): Promise<void>;

  /** Busca un refresh token por su hash. */
  findByTokenHash(tokenHash: string): Promise<RefreshTokenData | null>;

  /** Revoca un refresh token específico por su hash. */
  revoke(tokenHash: string): Promise<void>;

  /** Revoca todos los refresh tokens de un usuario. */
  revokeAllForUser(userId: string): Promise<void>;
}
