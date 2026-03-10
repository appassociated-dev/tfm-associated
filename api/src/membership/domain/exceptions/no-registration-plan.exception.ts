/**
 * Error de dominio lanzado cuando no existe un plan de cuota de alta activo.
 * Precondición necesaria para el alta de socios (UC-011).
 * HTTP 412 Precondition Failed (mapeado por sufijo .NO_REGISTRATION_PLAN en DomainExceptionFilter).
 */
export class NoRegistrationPlanError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBERSHIP.NO_REGISTRATION_PLAN';

  constructor() {
    super(
      'No existe un plan de cuota de alta activo. Es necesario configurar uno antes de dar de alta socios.',
    );
    this.name = 'NoRegistrationPlanError';
  }
}
