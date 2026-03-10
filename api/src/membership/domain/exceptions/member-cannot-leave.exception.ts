/**
 * Error de dominio lanzado cuando un socio no puede causar baja desde su estado actual.
 * HTTP 422 Unprocessable Entity (mapeado por sufijo .CANNOT_LEAVE en DomainExceptionFilter).
 */
export class MemberCannotLeaveError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBERSHIP.CANNOT_LEAVE';

  constructor(currentStatus: string) {
    super(
      `El socio no puede causar baja desde el estado '${currentStatus}'. Solo es posible desde estados activos o con pago pendiente.`,
    );
    this.name = 'MemberCannotLeaveError';
  }
}
