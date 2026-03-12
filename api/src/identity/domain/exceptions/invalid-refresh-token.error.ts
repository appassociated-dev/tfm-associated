/**
 * Error de dominio lanzado cuando un refresh token es inválido, expirado o revocado.
 */
export class InvalidRefreshTokenError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'AUTH.INVALID_REFRESH_TOKEN';

  constructor() {
    super('Token de refresco inválido o expirado.');
    this.name = 'InvalidRefreshTokenError';
  }
}
