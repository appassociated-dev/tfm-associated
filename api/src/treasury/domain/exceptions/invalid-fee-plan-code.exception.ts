/**
 * Error de dominio lanzado cuando el código del plan de cuota es inválido.
 */
export class InvalidFeePlanCodeError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FEE_PLAN.INVALID_CODE';

  constructor(value: string) {
    super(`Invalid fee plan code: '${value}'. Must be 2-20 uppercase characters [A-Z0-9_-]`);
    this.name = 'InvalidFeePlanCodeError';
  }
}
