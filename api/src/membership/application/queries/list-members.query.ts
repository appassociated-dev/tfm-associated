import { IQuery } from '@nestjs/cqrs';

/**
 * Query para listar socios con filtros opcionales (UC-006).
 */
export class ListMembersQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** Filtro por estado del socio (opcional). */
    public readonly status?: string,
    /** Filtro por tipo de socio UUID (opcional). */
    public readonly memberTypeId?: string,
    /** Búsqueda textual por nombre, apellidos o email (opcional). */
    public readonly search?: string,
  ) {}
}
