import { describe, it, expect } from 'vitest';
import { Money } from '../value-objects/money';
import { ProrataCalculator, SubscriptionData, PlanData } from '../services/prorata-calculator';

/** Helper para crear un Money válido. */
function money(amount: number): Money {
  const result = Money.create(amount);
  if (!result.ok) throw result.error;
  return result.value;
}

/** Helper para crear datos de suscripción. */
function subscriptionData(overrides: Partial<SubscriptionData> = {}): SubscriptionData {
  return {
    subscriptionId: 'sub-uuid-001',
    effectiveAmount: money(5000), // 50,00 EUR
    registrationDate: new Date(2025, 6, 1), // 1 julio 2025
    ...overrides,
  };
}

/** Plan mensual: cobra todos los meses. */
function monthlyPlan(overrides: Partial<PlanData> = {}): PlanData {
  return {
    billingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    amount: money(5000),
    type: 'RECURRING',
    ...overrides,
  };
}

/** Plan trimestral: cobra en meses [1, 4, 7, 10]. */
function quarterlyPlan(overrides: Partial<PlanData> = {}): PlanData {
  return {
    billingMonths: [1, 4, 7, 10],
    amount: money(15000),
    type: 'RECURRING',
    ...overrides,
  };
}

/** Plan anual: cobra en un solo mes. */
function annualPlan(billingMonth: number, overrides: Partial<PlanData> = {}): PlanData {
  return {
    billingMonths: [billingMonth],
    amount: money(60000), // 600,00 EUR
    type: 'RECURRING',
    ...overrides,
  };
}

describe('ProrataCalculator', () => {
  describe('calculateProratedCharges', () => {
    it('alta julio, plan mensual → 6 cargos (jul-dic)', () => {
      const sub = subscriptionData();
      const plan = monthlyPlan();

      const charges = ProrataCalculator.calculateProratedCharges(
        sub,
        plan,
        7, // registrationMonth
        12, // fiscalYearEndMonth
      );

      expect(charges).toHaveLength(6);
      // Verificar meses: 7, 8, 9, 10, 11, 12
      const months = charges.map((c) => c.billingMonth);
      expect(months).toEqual([7, 8, 9, 10, 11, 12]);

      // Todos marcados como prorrateados (no se cobra desde enero)
      for (const charge of charges) {
        expect(charge.isProrated).toBe(true);
        expect(charge.finalAmount.amount).toBe(5000);
        expect(charge.baseAmount.amount).toBe(5000);
      }
    });

    it('alta julio, plan trimestral [1,4,7,10] → 2 cargos (jul, oct)', () => {
      const sub = subscriptionData({ effectiveAmount: money(15000) });
      const plan = quarterlyPlan();

      const charges = ProrataCalculator.calculateProratedCharges(
        sub,
        plan,
        7, // registrationMonth
        12, // fiscalYearEndMonth
      );

      expect(charges).toHaveLength(2);
      const months = charges.map((c) => c.billingMonth);
      expect(months).toEqual([7, 10]);

      // Prorrateados porque no se cobra enero ni abril
      for (const charge of charges) {
        expect(charge.isProrated).toBe(true);
        expect(charge.finalAmount.amount).toBe(15000);
      }
    });

    it('alta julio, plan anual [2] ya pasado → 1 cargo prorrateado (6/12 del importe)', () => {
      // El socio tiene effectiveAmount = 60000 (importe anual con descuentos)
      const sub = subscriptionData({ effectiveAmount: money(60000) });
      const plan = annualPlan(2); // Mes de cobro febrero, ya pasó

      const charges = ProrataCalculator.calculateProratedCharges(
        sub,
        plan,
        7, // registrationMonth (julio)
        12, // fiscalYearEndMonth
      );

      expect(charges).toHaveLength(1);
      const charge = charges[0];

      // Meses restantes = 12 - 7 + 1 = 6
      // Prorrateo = (60000 / 12) * 6 = 30000
      expect(charge.finalAmount.amount).toBe(30000);
      expect(charge.baseAmount.amount).toBe(60000);
      expect(charge.isProrated).toBe(true);
      expect(charge.billingMonth).toBe(7); // Se cobra en el mes de alta
    });

    it('alta enero, plan mensual → 12 cargos (sin prorrateo)', () => {
      const sub = subscriptionData({
        registrationDate: new Date(2025, 0, 1), // 1 enero
      });
      const plan = monthlyPlan();

      const charges = ProrataCalculator.calculateProratedCharges(
        sub,
        plan,
        1, // registrationMonth
        12, // fiscalYearEndMonth
      );

      expect(charges).toHaveLength(12);
      const months = charges.map((c) => c.billingMonth);
      expect(months).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

      // Sin prorrateo: alta desde el primer mes
      for (const charge of charges) {
        expect(charge.isProrated).toBe(false);
        expect(charge.finalAmount.amount).toBe(5000);
      }
    });

    it('plan ONE_TIME → no genera cargos prorrateados', () => {
      const sub = subscriptionData();
      const plan: PlanData = {
        billingMonths: [],
        amount: money(5000),
        type: 'ONE_TIME',
      };

      const charges = ProrataCalculator.calculateProratedCharges(sub, plan, 7, 12);

      expect(charges).toHaveLength(0);
    });

    it('alta octubre, plan anual [2] → 3 meses restantes, prorrateo 3/12', () => {
      const sub = subscriptionData({ effectiveAmount: money(12000) });
      const plan = annualPlan(2);

      const charges = ProrataCalculator.calculateProratedCharges(
        sub,
        plan,
        10, // registrationMonth (octubre)
        12, // fiscalYearEndMonth
      );

      expect(charges).toHaveLength(1);
      // Meses restantes = 12 - 10 + 1 = 3
      // Prorrateo = (12000 / 12) * 3 = 3000
      expect(charges[0].finalAmount.amount).toBe(3000);
      expect(charges[0].isProrated).toBe(true);
    });

    it('alta enero, plan trimestral → 4 cargos sin prorrateo', () => {
      const sub = subscriptionData({ effectiveAmount: money(15000) });
      const plan = quarterlyPlan();

      const charges = ProrataCalculator.calculateProratedCharges(sub, plan, 1, 12);

      expect(charges).toHaveLength(4);
      const months = charges.map((c) => c.billingMonth);
      expect(months).toEqual([1, 4, 7, 10]);

      for (const charge of charges) {
        expect(charge.isProrated).toBe(false);
      }
    });
  });

  describe('calculateMonthlyCharge', () => {
    it('mes en billingMonths → retorna cargo con importe efectivo', () => {
      const sub = subscriptionData({ effectiveAmount: money(5000) });
      const plan = monthlyPlan();

      const result = ProrataCalculator.calculateMonthlyCharge(
        sub,
        plan,
        4, // abril
        2025,
      );

      expect(result).not.toBeNull();
      expect(result!.finalAmount.amount).toBe(5000);
      expect(result!.baseAmount.amount).toBe(5000);
    });

    it('mes NO en billingMonths → retorna null', () => {
      const sub = subscriptionData();
      const plan: PlanData = {
        billingMonths: [1, 7], // semestral
        amount: money(30000),
        type: 'RECURRING',
      };

      const result = ProrataCalculator.calculateMonthlyCharge(
        sub,
        plan,
        4, // abril, no está en billingMonths
        2025,
      );

      expect(result).toBeNull();
    });

    it('plan ONE_TIME → retorna null para cualquier mes', () => {
      const sub = subscriptionData();
      const plan: PlanData = {
        billingMonths: [],
        amount: money(5000),
        type: 'ONE_TIME',
      };

      const result = ProrataCalculator.calculateMonthlyCharge(sub, plan, 1, 2025);

      expect(result).toBeNull();
    });

    it('mes en billingMonths de plan trimestral → retorna cargo', () => {
      const sub = subscriptionData({ effectiveAmount: money(15000) });
      const plan = quarterlyPlan();

      // Mes 7 está en [1,4,7,10]
      const result = ProrataCalculator.calculateMonthlyCharge(sub, plan, 7, 2025);

      expect(result).not.toBeNull();
      expect(result!.finalAmount.amount).toBe(15000);
    });

    it('mes fuera de billingMonths de plan trimestral → retorna null', () => {
      const sub = subscriptionData({ effectiveAmount: money(15000) });
      const plan = quarterlyPlan();

      // Mes 5 no está en [1,4,7,10]
      const result = ProrataCalculator.calculateMonthlyCharge(sub, plan, 5, 2025);

      expect(result).toBeNull();
    });
  });
});
