import { Money } from '../value-objects/money';
import { PlanData } from './prorata-calculator';

/**
 * Datos de una suscripción activa necesarios para la generación de cargos.
 */
export interface ActiveSubscriptionData {
  /** Identificador de la suscripción. */
  subscriptionId: string;
  /** Identificador de la cuenta del socio. */
  memberAccountId: string;
  /** Identificador del socio. */
  memberId: string;
  /** Importe efectivo mensual tras descuentos (en centavos). */
  effectiveAmount: Money;
  /** Fecha de alta de la suscripción. */
  registrationDate: Date;
  /** Datos del plan asociado a la suscripción. */
  plan: PlanData;
}

/**
 * Clave única que identifica un cargo existente para prevenir duplicados.
 * Corresponde al constraint UNIQUE (subscription_id, billing_month, billing_year).
 */
export interface ExistingChargeKey {
  /** Identificador de la suscripción. */
  subscriptionId: string;
  /** Mes de facturación (1-12). */
  billingMonth: number;
  /** Año de facturación. */
  billingYear: number;
}

/**
 * Resultado de la generación masiva de cargos para un mes/año.
 */
export interface GenerationResult {
  /** Cargos a crear. */
  charges: ChargeInput[];
  /** Suscripciones omitidas porque el mes no está en su plan. */
  skippedNoMonth: number;
  /** Suscripciones omitidas porque ya existía un cargo para el periodo. */
  skippedDuplicate: number;
  /** Errores encontrados durante la generación. */
  errors: Array<{ subscriptionId: string; error: string }>;
}

/**
 * Datos de entrada para crear un cargo (desacoplado de la Entity Charge).
 */
export interface ChargeInput {
  /** Identificador de la suscripción origen. */
  subscriptionId: string;
  /** Identificador de la cuenta del socio. */
  memberAccountId: string;
  /** Identificador del socio. */
  memberId: string;
  /** Importe base antes de prorrateo. */
  baseAmount: Money;
  /** Importe final a cobrar. */
  finalAmount: Money;
  /** Mes de facturación (1-12). */
  billingMonth: number;
  /** Año de facturación. */
  billingYear: number;
  /** Fecha de emisión del cargo (primer día del mes). */
  issueDate: Date;
  /** Fecha de vencimiento del cargo (último día del mes). */
  dueDate: Date;
  /** Indica si el cargo fue prorrateado. */
  isProrated: boolean;
  /** Descripción del cargo. */
  description: string;
}

/**
 * Domain Service puro (sin dependencias de infraestructura) que genera
 * cargos periódicos para suscripciones activas.
 *
 * Responsabilidades:
 * - Evaluar billingMonths del plan para cada suscripción.
 * - Prevenir duplicados verificando cargos existentes.
 * - Calcular fechas de emisión y vencimiento.
 * - Acumular contadores de resultado (generados, omitidos, errores).
 */
export class ChargeGenerator {
  /**
   * Genera cargos para un mes/año dado, evaluando todas las suscripciones activas.
   * Verifica billingMonths del plan y previene duplicados.
   *
   * @param subscriptions Suscripciones activas a evaluar.
   * @param month Mes de facturación (1-12).
   * @param year Año de facturación.
   * @param existingCharges Cargos ya existentes para prevenir duplicados.
   * @returns Resultado con cargos a crear, contadores y errores.
   */
  static generateForMonth(
    subscriptions: ActiveSubscriptionData[],
    month: number,
    year: number,
    existingCharges: ExistingChargeKey[],
  ): GenerationResult {
    const result: GenerationResult = {
      charges: [],
      skippedNoMonth: 0,
      skippedDuplicate: 0,
      errors: [],
    };

    // Crear un Set para búsqueda eficiente de duplicados
    const existingKeys = new Set(
      existingCharges.map((key) => `${key.subscriptionId}:${key.billingMonth}:${key.billingYear}`),
    );

    // Calcular fechas del periodo
    // issueDate = primer día del mes
    const issueDate = new Date(year, month - 1, 1);
    // dueDate = último día del mes (día 0 del mes siguiente)
    const dueDate = new Date(year, month, 0);

    for (const subscription of subscriptions) {
      try {
        // 1. Verificar si el mes está en los billingMonths del plan
        if (!subscription.plan.billingMonths.includes(month)) {
          result.skippedNoMonth++;
          continue;
        }

        // 2. Verificar si ya existe un cargo para esta suscripción en este periodo
        const chargeKey = `${subscription.subscriptionId}:${month}:${year}`;
        if (existingKeys.has(chargeKey)) {
          result.skippedDuplicate++;
          continue;
        }

        // 3. Crear el ChargeInput
        const chargeInput: ChargeInput = {
          subscriptionId: subscription.subscriptionId,
          memberAccountId: subscription.memberAccountId,
          memberId: subscription.memberId,
          baseAmount: subscription.effectiveAmount,
          finalAmount: subscription.effectiveAmount,
          billingMonth: month,
          billingYear: year,
          issueDate,
          dueDate,
          isProrated: false,
          description: `Cargo ${month.toString().padStart(2, '0')}/${year}`,
        };

        result.charges.push(chargeInput);
      } catch (error) {
        result.errors.push({
          subscriptionId: subscription.subscriptionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }
}
