/**
 * Error de dominio lanzado cuando el descuento total aplicado
 * alcanza o supera el 100%.
 */
export class DiscountExceedsLimitError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'SUBSCRIPTION.DISCOUNT_EXCEEDS_LIMIT';

  constructor(rate: string) {
    super(`El descuento total no puede ser 100% o superior. Descuento efectivo: ${rate}%`);
    this.name = 'DiscountExceedsLimitError';
  }
}
