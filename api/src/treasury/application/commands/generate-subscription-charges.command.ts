import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para generar cargos prorrateados al crear una nueva suscripción
 * a mitad de ejercicio fiscal.
 */
export class GenerateSubscriptionChargesCommand implements ICommand {
  constructor(
    /** ID del tenant. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio (UUID). */
    public readonly memberAccountId: string,
    /** ID de la suscripción para la que se generan cargos (UUID). */
    public readonly subscriptionId: string,
  ) {}
}
