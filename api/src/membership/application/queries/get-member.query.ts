import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener la ficha completa de un socio (UC-006).
 */
export class GetMemberQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID del socio. */
    public readonly memberId: string,
  ) {}
}
