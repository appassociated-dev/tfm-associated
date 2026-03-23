/**
 * Error de dominio lanzado cuando un plan recurrente no tiene meses de facturación.
 */
export class BillingMonthsRequiredError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FEE_PLAN.BILLING_MONTHS_REQUIRED';

  constructor() {
    super('A recurring fee plan requires at least one billing month');
    this.name = 'BillingMonthsRequiredError';
  }
}
