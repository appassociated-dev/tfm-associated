/**
 * Error de dominio lanzado cuando los meses de facturación son inválidos.
 */
export class InvalidBillingMonthsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FEE_PLAN.INVALID_BILLING_MONTHS';

  constructor(reason: string) {
    super(`Invalid billing months: ${reason}`);
    this.name = 'InvalidBillingMonthsError';
  }
}
