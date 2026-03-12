/**
 * Error de dominio lanzado cuando se intenta pagar un cargo ya pagado (FE-4).
 */
export class ChargeAlreadyPaidError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'CHARGE.ALREADY_PAID';

  constructor(chargeId: string) {
    super(`El cargo '${chargeId}' ya está pagado.`);
    this.name = 'ChargeAlreadyPaidError';
  }
}
