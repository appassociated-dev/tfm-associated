import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de baja de socio. */
export interface MemberDeactivatedPayload {
  /** Identificador del socio. */
  memberId: string;
  /** Número de socio. */
  memberNumber: string;
  /** Tipo de baja (VOLUNTARY_LEAVE, NONPAYMENT_LEAVE, DISCIPLINARY_LEAVE, DECEASED). */
  leaveType: string;
  /** Fecha efectiva de la baja. */
  effectiveDate: Date;
  /** Motivo de la baja. */
  reason: string;
  /** Deuda pendiente en centavos (0 si no hay). */
  pendingDebt: number;
}

/**
 * Evento de dominio emitido cuando un socio causa baja.
 * Consumido por BC-Treasury (cancelar suscripciones, cerrar cuenta) y BC-Communication (notificación).
 */
export class MemberDeactivatedEvent extends DomainEvent<MemberDeactivatedPayload> {
  readonly eventType = 'member.deactivated';
}
