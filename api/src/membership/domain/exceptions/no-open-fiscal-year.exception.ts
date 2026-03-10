/**
 * Error de dominio lanzado cuando no existe un ejercicio fiscal abierto.
 * Precondición necesaria para el alta de socios (UC-011).
 * HTTP 412 Precondition Failed (mapeado por sufijo .NO_OPEN_FISCAL_YEAR en DomainExceptionFilter).
 */
export class NoOpenFiscalYearError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBERSHIP.NO_OPEN_FISCAL_YEAR';

  constructor() {
    super(
      'No existe un ejercicio fiscal abierto. Es necesario abrir uno antes de dar de alta socios.',
    );
    this.name = 'NoOpenFiscalYearError';
  }
}
