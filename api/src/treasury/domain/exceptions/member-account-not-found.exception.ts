/**
 * Error de dominio lanzado cuando no se encuentra una cuenta de socio.
 */
export class MemberAccountNotFoundError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER_ACCOUNT.NOT_FOUND';

  constructor(id: string) {
    super(`MemberAccount with id '${id}' not found`);
    this.name = 'MemberAccountNotFoundError';
  }
}
