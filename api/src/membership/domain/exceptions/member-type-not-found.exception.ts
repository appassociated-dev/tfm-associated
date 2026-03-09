/**
 * Error de dominio lanzado cuando no se encuentra un tipo de socio.
 */
export class MemberTypeNotFoundError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER_TYPE.NOT_FOUND';

  constructor(memberTypeId: string) {
    super(`MemberType with id '${memberTypeId}' not found`);
    this.name = 'MemberTypeNotFoundError';
  }
}
