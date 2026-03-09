/**
 * Error de dominio lanzado cuando se intenta desactivar un tipo de socio que es destino de transición.
 */
export class MemberTypeIsTransitionTargetError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER_TYPE.IS_TRANSITION_TARGET';

  constructor(memberTypeId: string) {
    super(`MemberType '${memberTypeId}' cannot be deactivated because it is a transition target`);
    this.name = 'MemberTypeIsTransitionTargetError';
  }
}
