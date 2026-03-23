/**
 * Error de dominio lanzado cuando se intenta pagar un cargo cancelado o en estado no pagable.
 */
export class ChargeNotPayableError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'CHARGE.NOT_PAYABLE';

  constructor(chargeId: string, status: string) {
    super(`No se puede pagar el cargo '${chargeId}' con estado '${status}'.`);
    this.name = 'ChargeNotPayableError';
  }
}
