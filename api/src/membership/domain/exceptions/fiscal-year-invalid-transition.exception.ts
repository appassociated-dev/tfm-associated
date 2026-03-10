/**
 * Error de dominio lanzado cuando se intenta una transición de estado
 * no permitida en un ejercicio fiscal.
 */
export class FiscalYearInvalidTransitionError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FISCAL_YEAR.INVALID_TRANSITION';

  constructor(currentStatus: string, targetStatus: string) {
    super(`Cannot transition fiscal year from '${currentStatus}' to '${targetStatus}'`);
    this.name = 'FiscalYearInvalidTransitionError';
  }
}
