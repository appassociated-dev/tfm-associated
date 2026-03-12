import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener el ejercicio fiscal activo (en estado OPEN).
 */
export class GetActiveFiscalYearQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
  ) {}
}
