/**
 * Error de dominio lanzado cuando se detecta una transición circular entre tipos de socio.
 */
export class CircularTransitionError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER_TYPE.CIRCULAR_TRANSITION';

  constructor(sourceId: string, targetId: string) {
    super(
      `Circular transition detected: MemberType '${sourceId}' cannot transition to '${targetId}'`,
    );
    this.name = 'CircularTransitionError';
  }
}
