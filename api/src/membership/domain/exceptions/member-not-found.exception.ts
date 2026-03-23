/**
 * Error de dominio lanzado cuando no se encuentra un socio.
 */
export class MemberNotFoundError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER.NOT_FOUND';

  constructor(memberId: string) {
    super(`Member with id '${memberId}' not found`);
    this.name = 'MemberNotFoundError';
  }
}
