import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para activar un plan de cuota inactivo.
 */
export class ActivateFeePlanCommand implements ICommand {
  constructor(
    /** ID del tenant propietario. */
    public readonly tenantId: string,
    /** ID del plan de cuota a activar. */
    public readonly feePlanId: string,
  ) {}
}
