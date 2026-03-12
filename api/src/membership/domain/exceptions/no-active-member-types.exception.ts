/**
 * Error de dominio lanzado cuando no existen tipos de socio activos.
 * Precondición necesaria para el alta de socios (UC-011).
 * HTTP 412 Precondition Failed (mapeado por sufijo .NO_ACTIVE_MEMBER_TYPES en DomainExceptionFilter).
 */
export class NoActiveMemberTypesError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBERSHIP.NO_ACTIVE_MEMBER_TYPES';

  constructor() {
    super(
      'No existen tipos de socio activos. Es necesario configurar al menos uno antes de dar de alta socios.',
    );
    this.name = 'NoActiveMemberTypesError';
  }
}
