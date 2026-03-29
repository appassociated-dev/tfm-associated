import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de registro de socio. */
export interface MemberRegisteredPayload {
  memberId: string;
  memberNumber: string;
  name: string;
  surnames: string;
  email: string;
  memberTypeId: string;
  registrationDate: Date;
  iban?: string;
}

/**
 * Evento de dominio emitido cuando se registra un nuevo socio.
 * Consumido por BC-Treasury (crear MemberAccount + MandatoSepa) y BC-Communication (email bienvenida).
 */
export class MemberRegisteredEvent extends DomainEvent<MemberRegisteredPayload> {
  readonly eventType = 'MemberRegistered';
}
