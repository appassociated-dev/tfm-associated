import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de vinculación de plan de cuota a tipo de socio. */
export interface FeePlanLinkedToMemberTypePayload {
  feePlanId: string;
  memberTypeId: string;
  isDefault: boolean;
  tenantId: string;
}

/**
 * Evento de dominio emitido cuando se vincula un plan de cuota a un tipo de socio.
 */
export class FeePlanLinkedToMemberTypeEvent extends DomainEvent<FeePlanLinkedToMemberTypePayload> {
  readonly eventType = 'fee-plan.linked-to-member-type';
}
