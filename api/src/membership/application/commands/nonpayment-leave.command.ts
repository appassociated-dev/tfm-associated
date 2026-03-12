import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para procesar la baja por impago de un socio (UC-013).
 * No requiere parámetros adicionales — la fecha efectiva es siempre inmediata
 * y el motivo es fijo ('Baja por impago').
 */
export class ProcessNonpaymentLeaveCommand implements ICommand {
  constructor(
    /** ID del tenant donde se ejecuta la operación. */
    public readonly tenantId: string,
    /** ID del socio que será dado de baja por impago. */
    public readonly memberId: string,
  ) {}
}
