/**
 * Error de dominio lanzado cuando se intenta abrir un ejercicio fiscal
 * mientras otro ya está abierto.
 */
export class FiscalYearAlreadyOpenError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FISCAL_YEAR.ALREADY_OPEN';

  constructor() {
    super(
      'Cannot open a new fiscal year while another is already open. Close the current one first.',
    );
    this.name = 'FiscalYearAlreadyOpenError';
  }
}
