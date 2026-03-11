/**
 * Error de dominio lanzado cuando no se encuentra un plan de cuota.
 */
export class FeePlanNotFoundError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FEE_PLAN.NOT_FOUND';

  constructor(feePlanId: string) {
    super(`FeePlan with id '${feePlanId}' not found`);
    this.name = 'FeePlanNotFoundError';
  }
}
