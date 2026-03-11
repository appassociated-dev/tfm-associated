import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de modificación de plan de cuota. */
export interface FeePlanModifiedPayload {
  feePlanId: string;
  code: string;
  name: string;
  type: string;
  amount: number;
}

/**
 * Evento de dominio emitido cuando se modifica un plan de cuota existente.
 * Contiene la información actualizada del plan.
 */
export class FeePlanModifiedEvent extends DomainEvent<FeePlanModifiedPayload> {
  readonly eventType = 'fee-plan.modified';
}
