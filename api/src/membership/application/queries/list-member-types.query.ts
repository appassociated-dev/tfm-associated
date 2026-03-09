import { IQuery } from '@nestjs/cqrs';

/**
 * Query para listar todos los tipos de socio de un tenant.
 * Permite filtrar opcionalmente por estado activo/inactivo.
 */
export class ListMemberTypesQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** Filtro opcional por estado activo (null = sin filtro). */
    public readonly active?: boolean,
  ) {}
}
