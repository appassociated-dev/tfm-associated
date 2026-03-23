import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener el balance pendiente de una cuenta de socio.
 */
export class GetAccountBalanceQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio. */
    public readonly memberAccountId: string,
  ) {}
}
