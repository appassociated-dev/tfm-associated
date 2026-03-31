import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de actualización de datos de socio. */
export interface MemberDataUpdatedPayload {
  memberId: string;
  modifiedFields: string[];
  newEmail?: string;
  newIban?: string;
  ibanChanged: boolean;
  updateDate: Date;
}

/**
 * Evento de dominio emitido cuando se actualizan datos de un socio.
 * Consumido por BC-Treasury (actualizar IBAN si cambió) y BC-Communication (actualizar email si cambió).
 */
export class MemberDataUpdatedEvent extends DomainEvent<MemberDataUpdatedPayload> {
  readonly eventType = 'MemberDataUpdated';
}
