import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener la suscripción periódica activa de una cuenta de socio.
 */
export class GetActiveSubscriptionQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio. */
    public readonly memberAccountId: string,
  ) {}
}
