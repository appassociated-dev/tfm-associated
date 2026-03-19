import { IQuery } from '@nestjs/cqrs';

/**
 * Query para verificar si un email ya existe en el tenant (UC-011).
 */
export class CheckEmailQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** Email a verificar. */
    public readonly email: string,
  ) {}
}
