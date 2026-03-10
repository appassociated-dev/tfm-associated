import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener un ejercicio fiscal por su ID.
 */
export class GetFiscalYearQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID del ejercicio fiscal. */
    public readonly fiscalYearId: string,
  ) {}
}
