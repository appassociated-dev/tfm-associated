/**
 * Error de dominio lanzado cuando se intenta rehabilitar un socio con deuda pendiente
 * sin confirmar el pago previo.
 * HTTP 422 Unprocessable Entity (mapeado por sufijo .PAYMENT_NOT_CONFIRMED en DomainExceptionFilter).
 */
export class PaymentNotConfirmedError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBERSHIP.PAYMENT_NOT_CONFIRMED';

  constructor(memberId: string) {
    super(
      `No se puede rehabilitar al socio '${memberId}' sin confirmar el pago de la deuda pendiente.`,
    );
    this.name = 'PaymentNotConfirmedError';
  }
}
