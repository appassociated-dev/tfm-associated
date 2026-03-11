/**
 * Error de dominio lanzado cuando se intenta desactivar un plan de cuota
 * que tiene suscripciones activas.
 */
export class FeePlanHasActiveSubscriptionsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'FEE_PLAN.HAS_ACTIVE_SUBSCRIPTIONS';

  constructor(feePlanId: string) {
    super(`FeePlan with id '${feePlanId}' has active subscriptions and cannot be deactivated`);
    this.name = 'FeePlanHasActiveSubscriptionsError';
  }
}
