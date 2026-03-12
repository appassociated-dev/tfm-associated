/**
 * Error de dominio lanzado cuando se intenta crear un plan de cuota con un código que ya existe.
 */
export class FeePlanCodeAlreadyExistsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FEE_PLAN.CODE_ALREADY_EXISTS';

  constructor(feePlanCode: string) {
    super(`FeePlan with code '${feePlanCode}' already exists`);
    this.name = 'FeePlanCodeAlreadyExistsError';
  }
}
