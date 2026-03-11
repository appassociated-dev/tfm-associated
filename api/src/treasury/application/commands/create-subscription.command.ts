import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para crear una nueva suscripción de cuota para un socio.
 * Vincula una cuenta de socio a un plan de cuota con descuentos opcionales.
 */
export class CreateSubscriptionCommand implements ICommand {
  constructor(
    /** ID del tenant donde se crea la suscripción. */
    public readonly tenantId: string,
    /** ID de la cuenta de socio (UUID). */
    public readonly memberAccountId: string,
    /** ID del plan de cuota al que se suscribe (UUID). */
    public readonly feePlanId: string,
    /** Descuento por tipo de socio (0 a 0.99). */
    public readonly typeDiscount: number,
    /** Descuento personal (0 a 0.99). */
    public readonly personalDiscount: number,
    /** Motivo del descuento personal, si aplica. */
    public readonly personalDiscountReason: string | null,
  ) {}
}
