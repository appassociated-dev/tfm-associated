import { IQuery } from '@nestjs/cqrs';

/**
 * Query para listar todos los planes de cuota de un tenant.
 * Permite filtrar opcionalmente por estado activo/inactivo y por tipo de socio.
 */
export class ListFeePlansQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** Filtro opcional por estado activo (undefined = sin filtro). */
    public readonly active?: boolean,
    /** Filtro opcional por tipo de socio (REQ-SPU-005). Devuelve solo planes vinculados. */
    public readonly memberTypeId?: string,
  ) {}
}
