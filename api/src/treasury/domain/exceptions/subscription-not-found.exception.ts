/**
 * Error de dominio lanzado cuando no se encuentra una suscripción de cuota.
 */
export class SubscriptionNotFoundError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'SUBSCRIPTION.NOT_FOUND';

  constructor(id: string) {
    super(`FeeSubscription with id '${id}' not found`);
    this.name = 'SubscriptionNotFoundError';
  }
}
