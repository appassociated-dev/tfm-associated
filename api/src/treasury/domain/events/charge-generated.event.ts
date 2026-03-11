import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de generación de cargo. */
export interface ChargeGeneratedPayload {
  chargeId: string;
  memberAccountId: string;
  memberId: string;
  subscriptionId: string;
  amount: number;
  billingMonth: number;
  billingYear: number;
  dueDate: Date;
}

/**
 * Evento de dominio emitido cuando se genera un nuevo cargo periódico.
 * Permite que otros BCs reaccionen, por ejemplo BC-Communication
 * para enviar aviso de cargo al socio.
 */
export class ChargeGeneratedEvent extends DomainEvent<ChargeGeneratedPayload> {
  readonly eventType = 'charge.generated';
}
