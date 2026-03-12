import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para cambiar el plan de cuota de una suscripción activa.
 * Cierra la suscripción actual y crea una nueva con el plan indicado.
 */
export class ChangeSubscriptionPlanCommand implements ICommand {
  constructor(
    /** ID del tenant donde se realiza el cambio. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio (UUID). */
    public readonly memberAccountId: string,
    /** ID de la suscripción actual que se va a cerrar (UUID). */
    public readonly currentSubscriptionId: string,
    /** ID del nuevo plan de cuota (UUID). */
    public readonly newFeePlanId: string,
    /** Fecha efectiva del cambio de plan. */
    public readonly effectiveDate: Date,
    /** Si true, mantiene el descuento de la suscripción actual en la nueva. */
    public readonly maintainDiscount: boolean,
  ) {}
}
