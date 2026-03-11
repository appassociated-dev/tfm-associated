/**
 * Error de dominio lanzado cuando el importe monetario es inválido.
 */
export class InvalidMoneyError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FEE_PLAN.INVALID_MONEY';

  constructor(reason: string) {
    super(`Invalid money amount: ${reason}`);
    this.name = 'InvalidMoneyError';
  }
}
