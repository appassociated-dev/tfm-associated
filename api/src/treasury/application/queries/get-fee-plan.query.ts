import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener un plan de cuota por su ID.
 */
export class GetFeePlanQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID del plan de cuota. */
    public readonly feePlanId: string,
  ) {}
}
