import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para actualizar un plan de cuota existente.
 * No permite modificar el código (es inmutable tras la creación).
 */
export class UpdateFeePlanCommand implements ICommand {
  constructor(
    /** ID del tenant propietario. */
    public readonly tenantId: string,
    /** ID del plan de cuota a actualizar. */
    public readonly feePlanId: string,
    /** Nombre actualizado. */
    public readonly name: string,
    /** Descripción actualizada. */
    public readonly description: string | null,
    /** Tipo de plan: ONE_TIME o RECURRING. */
    public readonly type: string,
    /** Frecuencia de cobro. */
    public readonly frequency: string,
    /** Importe en centavos (entero >= 0). */
    public readonly amount: number,
    /** Meses de facturación (1-12). */
    public readonly billingMonths: number[],
  ) {}
}
