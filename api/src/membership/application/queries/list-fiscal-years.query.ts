import { IQuery } from '@nestjs/cqrs';

/**
 * Query para listar todos los ejercicios fiscales del tenant.
 */
export class ListFiscalYearsQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
  ) {}
}
