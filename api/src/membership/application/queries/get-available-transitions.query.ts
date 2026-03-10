import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener las transiciones de estado disponibles de un socio.
 */
export class GetAvailableTransitionsQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID del socio. */
    public readonly memberId: string,
  ) {}
}
