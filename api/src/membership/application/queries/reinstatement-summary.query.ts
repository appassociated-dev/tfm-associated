import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener el resumen previo a la rehabilitación de un socio (UC-013).
 * El socio debe estar en estado VOLUNTARY_LEAVE o NONPAYMENT_LEAVE.
 */
export class GetReinstatementSummaryQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID del socio. */
    public readonly memberId: string,
  ) {}
}
