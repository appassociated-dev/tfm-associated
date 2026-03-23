import { IQuery } from '@nestjs/cqrs';

/**
 * Query para obtener el perfil del usuario autenticado.
 * Incluye el tenant activo para resolver permisos y contexto.
 */
export class GetCurrentUserQuery implements IQuery {
  constructor(
    /** ID del usuario autenticado. */
    public readonly userId: string,
    /** ID del tenant activo. */
    public readonly tenantId: string,
  ) {}
}
