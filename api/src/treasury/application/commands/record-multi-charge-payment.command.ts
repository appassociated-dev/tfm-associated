import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para registrar un cobro sobre múltiples cargos pendientes.
 * Crea un pago por cada cargo con la misma referencia de pago compartida.
 */
export class RecordMultiChargePaymentCommand implements ICommand {
  constructor(
    /** ID del tenant donde se registra el cobro. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio (UUID). */
    public readonly memberAccountId: string,
    /** IDs de los cargos a pagar (UUIDs). */
    public readonly chargeIds: string[],
    /** Método de pago (CASH, TRANSFER, BIZUM, SEPA_DIRECT_DEBIT, CARD_TPV). */
    public readonly paymentMethod: string,
    /** Fecha del pago en formato ISO (YYYY-MM-DD). */
    public readonly paymentDate: string,
    /** Observaciones opcionales del pago. */
    public readonly notes: string | null,
    /** ID del usuario que registra el cobro (tesorero). */
    public readonly registeredBy: string,
  ) {}
}
