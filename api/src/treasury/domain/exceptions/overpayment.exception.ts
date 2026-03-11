/**
 * Error de dominio lanzado cuando el importe del pago excede el pendiente (FE-1).
 */
export class OverpaymentError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'PAYMENT.OVERPAYMENT';

  constructor(paymentAmount: number, remainingAmount: number) {
    super(
      `El importe del pago (${(paymentAmount / 100).toFixed(2)}€) supera el pendiente (${(remainingAmount / 100).toFixed(2)}€).`,
    );
    this.name = 'OverpaymentError';
  }
}
