import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener los cargos de una cuenta de socio,
 * opcionalmente filtrados por estado.
 */
export class GetChargesByAccountQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio. */
    public readonly memberAccountId: string,
    /** Estado de cargo para filtrar (opcional). */
    public readonly status?: string,
  ) {}
}
