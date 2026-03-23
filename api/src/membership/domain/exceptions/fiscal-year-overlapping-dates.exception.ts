/**
 * Error de dominio lanzado cuando las fechas de un ejercicio fiscal
 * se solapan con las de un ejercicio existente.
 */
export class FiscalYearOverlappingDatesError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FISCAL_YEAR.OVERLAPPING_DATES';

  constructor(overlappingName: string) {
    super(`Fiscal year dates overlap with existing fiscal year '${overlappingName}'`);
    this.name = 'FiscalYearOverlappingDatesError';
  }
}
