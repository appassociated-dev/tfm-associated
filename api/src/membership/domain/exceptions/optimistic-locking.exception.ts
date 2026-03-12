/**
 * Error de dominio lanzado cuando se detecta un conflicto de concurrencia
 * al intentar guardar un socio con versión desactualizada.
 */
export class OptimisticLockingError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER.OPTIMISTIC_LOCKING';

  constructor(memberId: string) {
    super(
      `Optimistic locking conflict for member '${memberId}'. The member was modified concurrently.`,
    );
    this.name = 'OptimisticLockingError';
  }
}
