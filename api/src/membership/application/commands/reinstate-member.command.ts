import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para rehabilitar un socio dado de baja (UC-013).
 * Requiere confirmación explícita del pago de deuda pendiente.
 */
export class ReinstateMemberCommand implements ICommand {
  constructor(
    /** ID del tenant donde se ejecuta la operación. */
    public readonly tenantId: string,
    /** ID del socio a rehabilitar. */
    public readonly memberId: string,
    /** Confirmación de que se ha pagado la deuda pendiente. */
    public readonly paymentConfirmed: boolean,
  ) {}
}
