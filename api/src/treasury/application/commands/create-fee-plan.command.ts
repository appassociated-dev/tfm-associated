import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para crear un nuevo plan de cuota.
 * Contiene todos los datos necesarios para definir un plan de cobro.
 */
export class CreateFeePlanCommand implements ICommand {
  constructor(
    /** ID del tenant donde se crea el plan de cuota. */
    public readonly tenantId: string,
    /** Código único del plan de cuota (2-20 caracteres [A-Z0-9_-]). */
    public readonly code: string,
    /** Nombre del plan de cuota. */
    public readonly name: string,
    /** Descripción del plan de cuota. */
    public readonly description: string | null,
    /** Tipo de plan: ONE_TIME o RECURRING. */
    public readonly type: string,
    /** Frecuencia de cobro: MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, CUSTOM. */
    public readonly frequency: string,
    /** Importe en centavos (entero >= 0). */
    public readonly amount: number,
    /** Meses de facturación (1-12). */
    public readonly billingMonths: number[],
  ) {}
}
