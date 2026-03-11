import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de creación de suscripción. */
export interface SubscriptionCreatedPayload {
  subscriptionId: string;
  memberAccountId: string;
  memberId: string;
  feePlanId: string;
  registrationDate: Date;
  effectiveAmount: number;
  typeDiscount: number;
  personalDiscount: number;
  tenantId: string;
}

/**
 * Evento de dominio emitido cuando se crea una nueva suscripción.
 * Contiene la información necesaria para que otros BCs reaccionen,
 * por ejemplo para generar las cuotas correspondientes.
 */
export class SubscriptionCreatedEvent extends DomainEvent<SubscriptionCreatedPayload> {
  readonly eventType = 'subscription.created';
}
