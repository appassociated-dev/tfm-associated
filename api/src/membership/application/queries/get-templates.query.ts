import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener las plantillas de tipos de socio disponibles
 * para un tipo de colectividad.
 */
export class GetTemplatesQuery implements IQuery {
  constructor(
    /** Tipo de colectividad para filtrar plantillas. */
    public readonly collectivityType: string,
  ) {}
}
