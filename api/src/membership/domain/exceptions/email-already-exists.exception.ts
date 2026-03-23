/**
 * Error de dominio lanzado cuando ya existe un socio con el mismo email.
 * HTTP 409 Conflict (mapeado por sufijo ALREADY_EXISTS en DomainExceptionFilter).
 */
export class EmailAlreadyExistsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER.EMAIL_ALREADY_EXISTS';

  constructor(email: string) {
    super(`El email '${email}' ya está en uso por otro socio.`);
    this.name = 'EmailAlreadyExistsError';
  }
}
