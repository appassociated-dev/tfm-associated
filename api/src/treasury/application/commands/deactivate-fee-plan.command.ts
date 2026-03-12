import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para desactivar un plan de cuota.
 * No permite desactivar si tiene suscripciones activas.
 */
export class DeactivateFeePlanCommand implements ICommand {
  constructor(
    /** ID del tenant propietario. */
    public readonly tenantId: string,
    /** ID del plan de cuota a desactivar. */
    public readonly feePlanId: string,
  ) {}
}
