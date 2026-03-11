/**
 * Error de dominio lanzado cuando no se encuentra un cargo.
 */
export class ChargeNotFoundError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'CHARGE.NOT_FOUND';

  constructor(id: string) {
    super(`Charge with id '${id}' not found`);
    this.name = 'ChargeNotFoundError';
  }
}
