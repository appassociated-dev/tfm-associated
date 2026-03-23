import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener los pagos registrados de una cuenta de socio.
 */
export class GetPaymentsByAccountQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio. */
    public readonly memberAccountId: string,
  ) {}
}
