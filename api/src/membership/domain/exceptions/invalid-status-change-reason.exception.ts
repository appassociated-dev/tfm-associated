/**
 * Error de dominio lanzado cuando el motivo de cambio de estado es inválido.
 */
export class InvalidStatusChangeReasonError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER.INVALID_REASON';

  constructor(reason: string) {
    super(
      `Invalid status change reason: "${reason}". Reason must be between 3 and 500 characters.`,
    );
    this.name = 'InvalidStatusChangeReasonError';
  }
}
