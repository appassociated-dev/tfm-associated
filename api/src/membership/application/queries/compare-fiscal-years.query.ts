import { IQuery } from '@nestjs/cqrs';

/**
 * Query para comparar estadísticas entre ejercicios fiscales.
 */
export class CompareFiscalYearsQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** IDs de los ejercicios fiscales a comparar. */
    public readonly fiscalYearIds: string[],
  ) {}
}
