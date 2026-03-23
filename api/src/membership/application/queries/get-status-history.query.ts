import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener el historial de estados de un socio.
 */
export class GetStatusHistoryQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID del socio. */
    public readonly memberId: string,
  ) {}
}
