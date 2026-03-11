import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de cierre/cancelación de suscripción. */
export interface SubscriptionClosedPayload {
  subscriptionId: string;
  memberAccountId: string;
  cancelReason: string;
  leaveDate: Date;
  tenantId: string;
}

/**
 * Evento de dominio emitido cuando se cierra o cancela una suscripción.
 * Se dispara cuando un socio causa baja y su suscripción deja de estar vigente.
 */
export class SubscriptionClosedEvent extends DomainEvent<SubscriptionClosedPayload> {
  readonly eventType = 'subscription.closed';
}
