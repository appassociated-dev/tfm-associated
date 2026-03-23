import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener los datos de un recibo de pago.
 */
export class GetReceiptQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID del pago cuyo recibo se solicita. */
    public readonly paymentId: string,
  ) {}
}
