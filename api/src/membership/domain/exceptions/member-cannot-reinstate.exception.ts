/**
 * Error de dominio lanzado cuando un socio dado de baja no puede ser rehabilitado.
 * HTTP 422 Unprocessable Entity (mapeado por sufijo .CANNOT_REINSTATE en DomainExceptionFilter).
 */
export class MemberCannotReinstateError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBERSHIP.CANNOT_REINSTATE';

  constructor(currentStatus: string) {
    super(
      `El socio no puede ser rehabilitado desde el estado '${currentStatus}'. Solo es posible desde VOLUNTARY_LEAVE o NONPAYMENT_LEAVE.`,
    );
    this.name = 'MemberCannotReinstateError';
  }
}
