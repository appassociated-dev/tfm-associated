/**
 * Error de dominio lanzado cuando el tipo de socio existe pero no está activo.
 * HTTP 422 Unprocessable Entity (mapeado por sufijo .INVALID en DomainExceptionFilter).
 */
export class MemberTypeNotActiveError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER.MEMBER_TYPE_NOT_ACTIVE_INVALID';

  constructor(memberTypeId: string) {
    super(`El tipo de socio con id '${memberTypeId}' no está activo.`);
    this.name = 'MemberTypeNotActiveError';
  }
}
