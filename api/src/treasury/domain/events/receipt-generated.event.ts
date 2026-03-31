import { DomainEvent } from '../../../shared/domain';

/** Payload del evento de generación de recibo. */
export interface ReceiptGeneratedPayload {
  receiptId: string;
  paymentId: string;
  receiptNumber: string;
  issueDate: Date;
}

/**
 * Evento de dominio emitido cuando se genera un recibo para un pago.
 * Permite que otros BCs reaccionen, por ejemplo BC-Documents
 * para archivar el recibo.
 */
export class ReceiptGeneratedEvent extends DomainEvent<ReceiptGeneratedPayload> {
  readonly eventType = 'ReceiptGenerated';
}
