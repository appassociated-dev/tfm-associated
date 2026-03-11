import { Money } from '../value-objects/money';

/**
 * Resultado de un cargo calculado por prorrateo.
 */
export interface ProratedChargeResult {
  /** Mes de facturación (1-12). */
  billingMonth: number;
  /** Importe final a cobrar (puede ser prorrateado). */
  finalAmount: Money;
  /** Importe base antes de prorrateo. */
  baseAmount: Money;
  /** Indica si el cargo fue prorrateado por alta a mitad de ejercicio. */
  isProrated: boolean;
}

/**
 * Datos de suscripción necesarios para el cálculo de prorrateo.
 * Interfaz desacoplada de la entidad FeeSubscription.
 */
export interface SubscriptionData {
  /** Identificador de la suscripción. */
  subscriptionId: string;
  /** Importe efectivo mensual tras descuentos (en centavos). */
  effectiveAmount: Money;
  /** Fecha de alta de la suscripción. */
  registrationDate: Date;
}

/**
 * Datos del plan necesarios para el cálculo de prorrateo.
 * Interfaz desacoplada del aggregate FeePlan.
 */
export interface PlanData {
  /** Meses de facturación del plan (e.g., [1,2,...,12] para mensual). */
  billingMonths: number[];
  /** Importe base del plan (en centavos). */
  amount: Money;
  /** Tipo de plan: 'RECURRING' o 'ONE_TIME'. */
  type: string;
}

/**
 * Domain Service puro (sin dependencias de infraestructura) que calcula
 * prorrateos para altas a mitad de ejercicio fiscal.
 *
 * Reglas:
 * - Plan periódico (mensual/trimestral): filtra billingMonths >= mes de alta.
 * - Plan anual con mes de cobro ya pasado: prorataAmount = (effectiveAmount / 12) * meses restantes.
 * - Marca cargos como isProrated=true cuando el alta es posterior al primer mes de facturación.
 */
export class ProrataCalculator {
  /**
   * Calcula los cargos prorrateados para una suscripción que se da de alta
   * a mitad de ejercicio fiscal.
   *
   * @param subscription Datos de la suscripción (importe efectivo y fecha de alta).
   * @param plan Datos del plan (billingMonths, amount, type).
   * @param registrationMonth Mes de alta del socio (1-12).
   * @param fiscalYearEndMonth Último mes del ejercicio fiscal (1-12, típicamente 12).
   * @returns Array de cargos prorrateados a generar.
   */
  static calculateProratedCharges(
    subscription: SubscriptionData,
    plan: PlanData,
    registrationMonth: number,
    fiscalYearEndMonth: number,
  ): ProratedChargeResult[] {
    // Solo aplica a planes recurrentes
    if (plan.type !== 'RECURRING') {
      return [];
    }

    const results: ProratedChargeResult[] = [];
    const billingMonths = plan.billingMonths;

    // Determinar si es plan anual (un solo mes de facturación)
    // y ese mes ya pasó respecto al mes de alta
    const isAnnualWithPassedMonth =
      billingMonths.length === 1 && billingMonths[0] < registrationMonth;

    if (isAnnualWithPassedMonth) {
      // Plan anual con mes de cobro ya pasado:
      // Calcular prorrateo = (effectiveAmount / 12) * meses restantes usando Money methods
      const remainingMonths = fiscalYearEndMonth - registrationMonth + 1;

      const monthlyResult = subscription.effectiveAmount.divide(12);
      if (!monthlyResult.ok) {
        return [];
      }

      const proratedMoneyResult = monthlyResult.value.multiply(remainingMonths);
      if (!proratedMoneyResult.ok) {
        return [];
      }

      results.push({
        billingMonth: registrationMonth,
        finalAmount: proratedMoneyResult.value,
        baseAmount: subscription.effectiveAmount,
        isProrated: true,
      });
    } else {
      // Plan periódico (mensual/trimestral): filtrar meses >= mes de alta
      const applicableMonths = billingMonths.filter((month) => month >= registrationMonth);

      // Determinar si hay prorrateo (no se cobra desde el inicio del ejercicio)
      const isProrated = applicableMonths.length < billingMonths.length;

      for (const month of applicableMonths) {
        results.push({
          billingMonth: month,
          finalAmount: subscription.effectiveAmount,
          baseAmount: subscription.effectiveAmount,
          isProrated,
        });
      }
    }

    return results;
  }

  /**
   * Calcula si corresponde generar un cargo para un mes dado.
   * Retorna null si el mes no está en billingMonths del plan.
   *
   * @param subscription Datos de la suscripción.
   * @param plan Datos del plan.
   * @param month Mes a evaluar (1-12).
   * @param _year Año de facturación (reservado para futuras validaciones).
   * @returns Objeto con finalAmount y baseAmount, o null si no aplica.
   */
  static calculateMonthlyCharge(
    subscription: SubscriptionData,
    plan: PlanData,
    month: number,
    _year: number,
  ): { finalAmount: Money; baseAmount: Money } | null {
    // Solo aplica a planes recurrentes
    if (plan.type !== 'RECURRING') {
      return null;
    }

    // Verificar si el mes está en los meses de facturación del plan
    if (!plan.billingMonths.includes(month)) {
      return null;
    }

    return {
      finalAmount: subscription.effectiveAmount,
      baseAmount: subscription.effectiveAmount,
    };
  }
}
