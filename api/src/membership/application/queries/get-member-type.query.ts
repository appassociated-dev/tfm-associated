import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener un tipo de socio por su ID.
 */
export class GetMemberTypeQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID del tipo de socio. */
    public readonly memberTypeId: string,
  ) {}
}
