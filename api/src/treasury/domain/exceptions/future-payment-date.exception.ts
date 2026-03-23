/**
 * Error de dominio lanzado cuando la fecha de pago es posterior a hoy (FE-2).
 */
export class FuturePaymentDateError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'PAYMENT.FUTURE_DATE';

  constructor(paymentDate: string) {
    super(`La fecha de pago '${paymentDate}' no puede ser posterior a la fecha actual.`);
    this.name = 'FuturePaymentDateError';
  }
}
