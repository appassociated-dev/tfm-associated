/**
 * Error de dominio lanzado cuando un ejercicio fiscal tiene
 * advertencias pendientes que deben ser reconocidas antes de cerrar.
 */
export class FiscalYearCloseWarningsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FISCAL_YEAR.CLOSE_WARNINGS';

  /** Lista de advertencias pendientes. */
  readonly warnings: string[];

  constructor(warnings: string[]) {
    super('Fiscal year has pending warnings that must be acknowledged');
    this.name = 'FiscalYearCloseWarningsError';
    this.warnings = warnings;
  }
}
