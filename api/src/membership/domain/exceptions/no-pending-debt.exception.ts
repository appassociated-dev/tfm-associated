/**
 * Error de dominio lanzado cuando se intenta marcar como pagada una deuda inexistente.
 * HTTP 422 Unprocessable Entity (mapeado por sufijo .NO_PENDING_DEBT en DomainExceptionFilter).
 */
export class NoPendingDebtError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBERSHIP.NO_PENDING_DEBT';

  constructor(memberId: string) {
    super(`El socio '${memberId}' no tiene deuda pendiente que liquidar.`);
    this.name = 'NoPendingDebtError';
  }
}
