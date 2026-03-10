import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de rehabilitación de socio. */
export interface MemberReinstatedPayload {
  /** Identificador del socio. */
  memberId: string;
  /** Número de socio. */
  memberNumber: string;
  /** Tipo de baja previa (VOLUNTARY_LEAVE o NONPAYMENT_LEAVE). */
  previousLeaveType: string;
  /** Fecha de rehabilitación. */
  reinstatementDate: Date;
  /** Indica si se pagó la deuda pendiente antes de rehabilitar. */
  debtPaid: boolean;
  /** Indica si se recuperó la antigüedad original. */
  seniorityRecovered: boolean;
}

/**
 * Evento de dominio emitido cuando un socio dado de baja es rehabilitado.
 * Consumido por BC-Treasury (reactivar cuenta, crear suscripciones) y BC-Communication (notificación).
 */
export class MemberReinstatedEvent extends DomainEvent<MemberReinstatedPayload> {
  readonly eventType = 'member.reinstated';
}
