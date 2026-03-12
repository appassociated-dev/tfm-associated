import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para cerrar (dar de baja) una suscripción de cuota.
 * La suscripción se marca con fecha de baja y motivo de cancelación.
 */
export class CloseSubscriptionCommand implements ICommand {
  constructor(
    /** ID del tenant donde se cierra la suscripción. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio (UUID). */
    public readonly memberAccountId: string,
    /** ID de la suscripción a cerrar (UUID). */
    public readonly subscriptionId: string,
    /** Motivo de cancelación: PLAN_CHANGE, MEMBER_LEAVE, EXEMPTION, ONE_TIME_COMPLETED. */
    public readonly cancelReason: string,
  ) {}
}
