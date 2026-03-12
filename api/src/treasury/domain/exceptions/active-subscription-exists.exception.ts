/**
 * Error de dominio lanzado cuando ya existe una suscripción periódica activa
 * para una cuenta de socio.
 */
export class ActiveSubscriptionExistsError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'SUBSCRIPTION.ACTIVE_EXISTS';

  constructor(accountId: string) {
    super(`Ya existe una suscripción periódica activa para la cuenta '${accountId}'`);
    this.name = 'ActiveSubscriptionExistsError';
  }
}
