import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener los cargos pendientes (PENDING o PARTIALLY_PAID) de una cuenta de socio.
 */
export class GetPendingChargesQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio. */
    public readonly memberAccountId: string,
  ) {}
}
