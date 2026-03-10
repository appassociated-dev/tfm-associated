/**
 * Error de dominio lanzado cuando no se encuentra un ejercicio fiscal.
 */
export class FiscalYearNotFoundError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FISCAL_YEAR.NOT_FOUND';

  constructor(fiscalYearId: string) {
    super(`FiscalYear with id '${fiscalYearId}' not found`);
    this.name = 'FiscalYearNotFoundError';
  }
}
