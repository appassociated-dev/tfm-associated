/**
 * Error de dominio lanzado cuando no se encuentra un pago.
 */
export class PaymentNotFoundError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'PAYMENT.NOT_FOUND';

  constructor(id: string) {
    super(`Payment with id '${id}' not found`);
    this.name = 'PaymentNotFoundError';
  }
}
