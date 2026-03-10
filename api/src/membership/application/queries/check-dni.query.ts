import { IQuery } from '@nestjs/cqrs';

/**
 * Query para verificar si un documento de identidad ya existe en el tenant (UC-011).
 */
export class CheckDniQuery implements IQuery {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** Tipo de documento de identidad (DNI, NIE, PASSPORT). */
    public readonly documentType: string,
    /** Número de documento de identidad. */
    public readonly documentNumber: string,
  ) {}
}
