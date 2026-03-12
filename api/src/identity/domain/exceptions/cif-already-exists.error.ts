/**
 * Error de dominio lanzado cuando se intenta crear un tenant con un CIF que ya existe.
 */
export class CifAlreadyExistsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'TENANT.CIF_ALREADY_EXISTS';

  constructor(cif: string) {
    super(`Tenant with CIF '${cif}' already exists`);
    this.name = 'CifAlreadyExistsError';
  }
}
