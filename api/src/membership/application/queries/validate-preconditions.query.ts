import { IQuery } from '@nestjs/cqrs';

/**
 * Query para validar las precondiciones del alta simple (UC-011).
 * Verifica: ejercicio fiscal abierto, tipos de socio activos, plan de alta activo.
 */
export class ValidatePreconditionsQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
  ) {}
}
