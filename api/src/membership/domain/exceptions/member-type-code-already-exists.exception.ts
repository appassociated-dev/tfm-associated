/**
 * Error de dominio lanzado cuando se intenta crear un tipo de socio con un código que ya existe.
 */
export class MemberTypeCodeAlreadyExistsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER_TYPE.CODE_ALREADY_EXISTS';

  constructor(memberTypeCode: string) {
    super(`MemberType with code '${memberTypeCode}' already exists`);
    this.name = 'MemberTypeCodeAlreadyExistsError';
  }
}
