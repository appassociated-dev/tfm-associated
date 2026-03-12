/**
 * Error de dominio lanzado cuando un plan de pago único tiene meses de facturación.
 */
export class BillingMonthsNotAllowedError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FEE_PLAN.BILLING_MONTHS_NOT_ALLOWED';

  constructor() {
    super('A one-time fee plan must not have billing months');
    this.name = 'BillingMonthsNotAllowedError';
  }
}
