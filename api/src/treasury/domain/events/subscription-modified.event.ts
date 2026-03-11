import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de modificación de suscripción. */
export interface SubscriptionModifiedPayload {
  subscriptionId: string;
  memberAccountId: string;
  modifiedFields: string[];
  modificationDate: Date;
  tenantId: string;
}

/**
 * Evento de dominio emitido cuando se modifica una suscripción existente.
 * Incluye los campos modificados para facilitar la trazabilidad de cambios.
 */
export class SubscriptionModifiedEvent extends DomainEvent<SubscriptionModifiedPayload> {
  readonly eventType = 'subscription.modified';
}
