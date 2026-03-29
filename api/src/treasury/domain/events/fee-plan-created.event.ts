import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de creación de plan de cuota. */
export interface FeePlanCreatedPayload {
  feePlanId: string;
  code: string;
  name: string;
  type: string;
  amount: number;
  tenantId: string;
}

/**
 * Evento de dominio emitido cuando se crea un nuevo plan de cuota.
 * Contiene la información necesaria para que otros BCs reaccionen.
 */
export class FeePlanCreatedEvent extends DomainEvent<FeePlanCreatedPayload> {
  readonly eventType = 'FeePlanCreated';
}
