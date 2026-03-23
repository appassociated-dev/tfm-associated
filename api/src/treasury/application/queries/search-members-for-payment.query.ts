import { IQuery } from '@nestjs/cqrs';

/**
 * Query para buscar socios candidatos al registro de cobro.
 * Busca por nombre, apellidos, número de socio o DNI.
 */
export class SearchMembersForPaymentQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** Término de búsqueda (nombre, apellidos, número de socio o DNI). */
    public readonly query: string,
  ) {}
}
