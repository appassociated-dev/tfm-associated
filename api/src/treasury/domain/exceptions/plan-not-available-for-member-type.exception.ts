/**
 * Error de dominio lanzado cuando un plan de cuota no está disponible
 * para el tipo de socio indicado.
 */
export class PlanNotAvailableForMemberTypeError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'SUBSCRIPTION.PLAN_NOT_AVAILABLE';

  constructor(planName: string, memberTypeName: string) {
    super(`El plan '${planName}' no está disponible para el tipo de socio '${memberTypeName}'`);
    this.name = 'PlanNotAvailableForMemberTypeError';
  }
}
