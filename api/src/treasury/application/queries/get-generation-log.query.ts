import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener el log de generación de cargos de un mes/año dado.
 * Consulta los eventos de outbox de tipo 'monthly-generation.completed'.
 */
export class GetGenerationLogQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** Mes de facturación (1-12). */
    public readonly month: number,
    /** Año de facturación. */
    public readonly year: number,
  ) {}
}
