import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de cambio de tipo de socio. */
export interface MemberTypeChangedPayload {
  memberId: string;
  previousTypeId: string;
  previousTypeName: string;
  newTypeId: string;
  newTypeName: string;
  reason: string;
  fiscalYearId: string;
}

/**
 * Evento de dominio emitido cuando se cambia el tipo de socio de un miembro.
 * Típicamente ocurre durante la apertura de un nuevo ejercicio fiscal.
 */
export class MemberTypeChangedEvent extends DomainEvent<MemberTypeChangedPayload> {
  readonly eventType = 'MemberTypeChanged';
}
