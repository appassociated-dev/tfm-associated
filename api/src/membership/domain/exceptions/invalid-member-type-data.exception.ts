/**
 * Error de dominio lanzado cuando los datos de un tipo de socio son inválidos.
 */
export class InvalidMemberTypeDataError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER_TYPE.INVALID_DATA';

  constructor(field: string, reason: string) {
    super(`Invalid member type data: ${field} — ${reason}`);
    this.name = 'InvalidMemberTypeDataError';
  }
}
