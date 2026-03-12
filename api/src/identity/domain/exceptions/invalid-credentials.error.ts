/**
 * Error de dominio lanzado cuando las credenciales de autenticación son inválidas.
 * Mensaje genérico para no revelar si el email o la contraseña son incorrectos.
 */
export class InvalidCredentialsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'AUTH.INVALID_CREDENTIALS';

  constructor() {
    super('Credenciales inválidas.');
    this.name = 'InvalidCredentialsError';
  }
}
