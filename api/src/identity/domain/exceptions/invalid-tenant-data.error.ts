/**
 * Error de dominio lanzado cuando los datos de un tenant son inválidos.
 */
export class InvalidTenantDataError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'TENANT.INVALID_DATA';

  constructor(field: string, reason: string) {
    super(`Invalid tenant data: ${field} — ${reason}`);
    this.name = 'InvalidTenantDataError';
  }
}
