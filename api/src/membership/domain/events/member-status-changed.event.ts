import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de cambio de estado de socio. */
export interface MemberStatusChangedPayload {
  memberId: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
  changedBy: string;
  changedAt: Date;
}

/**
 * Evento de dominio emitido cuando cambia el estado de un socio.
 * Consumido por BC-Treasury (suspender/reactivar cobros) y BC-Communication (notificar socio).
 */
export class MemberStatusChangedEvent extends DomainEvent<MemberStatusChangedPayload> {
  readonly eventType = 'MemberStatusChanged';
}
