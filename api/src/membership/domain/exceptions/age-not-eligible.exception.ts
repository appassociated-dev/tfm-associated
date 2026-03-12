/**
 * Error de dominio lanzado cuando la edad no cumple los requisitos del tipo de socio.
 * HTTP 422 Unprocessable Entity (mapeado por sufijo .INVALID en DomainExceptionFilter).
 */
export class AgeNotEligibleError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'MEMBER.AGE_NOT_ELIGIBLE_INVALID';

  constructor(age: number, memberTypeName: string) {
    super(`La edad (${age}) no cumple los requisitos del tipo '${memberTypeName}'.`);
    this.name = 'AgeNotEligibleError';
  }
}
