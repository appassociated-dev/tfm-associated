import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener las plantillas de planes de cuota según el tipo de colectividad.
 */
export class GetFeePlanTemplatesQuery implements IQuery {
  constructor(
    /** Tipo de colectividad: ASSOCIATION, CLUB, FEDERATION. */
    public readonly collectivityType: string,
  ) {}
}
