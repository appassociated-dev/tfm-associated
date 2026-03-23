/**
 * Error de dominio lanzado cuando se intenta una transición de estado
 * no permitida para un socio.
 */
export class TransitionNotAllowedError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER.TRANSITION_NOT_ALLOWED';

  constructor(currentStatus: string, targetStatus: string, availableTransitions: string[] = []) {
    const available =
      availableTransitions.length > 0
        ? ` Transiciones permitidas desde '${currentStatus}': ${availableTransitions.join(', ')}.`
        : ` No hay transiciones permitidas desde '${currentStatus}'.`;

    super(`Cannot transition member from '${currentStatus}' to '${targetStatus}'.${available}`);
    this.name = 'TransitionNotAllowedError';
  }
}
