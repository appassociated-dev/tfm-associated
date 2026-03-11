import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de registro de pago. */
export interface PaymentRecordedPayload {
  paymentId: string;
  chargeId: string;
  memberAccountId: string;
  memberId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  paymentReference: string;
  chargeNewStatus: string;
}

/**
 * Evento de dominio emitido cuando se registra un pago sobre un cargo.
 * Permite que otros BCs reaccionen, por ejemplo BC-Membership
 * para actualizar estado de morosidad, o BC-Communication
 * para enviar recibo por email.
 */
export class PaymentRecordedEvent extends DomainEvent<PaymentRecordedPayload> {
  readonly eventType = 'payment.recorded';
}
