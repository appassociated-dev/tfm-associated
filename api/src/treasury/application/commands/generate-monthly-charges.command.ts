import { ICommand } from '@nestjs/cqrs';

/**
 * Comando para generar cargos periódicos masivos para un mes/año dado.
 * Evalúa todas las suscripciones activas y genera cargos según billingMonths del plan.
 *
 * Si tenantId es null, el cron se encarga de iterar sobre todos los tenants
 * y lanzar un comando por cada uno con su tenantId concreto.
 */
export class GenerateMonthlyChargesCommand implements ICommand {
  constructor(
    /** ID del tenant donde se generan los cargos (null = el cron itera todos). */
    public readonly tenantId: string | null,
    /** Mes de facturación (1-12). */
    public readonly month: number,
    /** Año de facturación. */
    public readonly year: number,
  ) {}
}
