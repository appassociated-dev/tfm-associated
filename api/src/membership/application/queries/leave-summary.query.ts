import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener el resumen previo a la baja de un socio (UC-013).
 * Reúne información de suscripciones, cargos pendientes y opciones de fecha efectiva.
 */
export class GetLeaveSummaryQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID del socio. */
    public readonly memberId: string,
  ) {}
}
