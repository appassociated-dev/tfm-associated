import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para actualizar el descuento personal de una suscripción activa.
 * Recalcula el importe efectivo con el nuevo descuento.
 */
export class UpdateSubscriptionDiscountCommand implements ICommand {
  constructor(
    /** ID del tenant donde se actualiza el descuento. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio (UUID). */
    public readonly memberAccountId: string,
    /** ID de la suscripción a actualizar (UUID). */
    public readonly subscriptionId: string,
    /** Nuevo descuento personal (0 a 0.99). */
    public readonly newPersonalDiscount: number,
    /** Motivo del cambio de descuento. */
    public readonly reason: string,
    /** Quién aprobó el cambio (opcional). */
    public readonly approvedBy: string | null,
  ) {}
}
