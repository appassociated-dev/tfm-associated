import { describe, it, expect } from 'vitest';
import { Money } from '../value-objects/money';
import {
  ChargeGenerator,
  ActiveSubscriptionData,
  ExistingChargeKey,
} from '../services/charge-generator';
import { PlanData } from '../services/prorata-calculator';

/** Helper para crear un Money válido. */
function money(amount: number): Money {
  const result = Money.create(amount);
  if (!result.ok) throw result.error;
  return result.value;
}

/** Plan mensual: cobra todos los meses. */
function monthlyPlan(): PlanData {
  return {
    billingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    amount: money(5000),
    type: 'RECURRING',
  };
}

/** Plan semestral: cobra en enero y julio. */
function semestralPlan(): PlanData {
  return {
    billingMonths: [1, 7],
    amount: money(30000),
    type: 'RECURRING',
  };
}

/** Helper para crear datos de suscripción activa. */
function activeSubscription(
  overrides: Partial<ActiveSubscriptionData> = {},
): ActiveSubscriptionData {
  return {
    subscriptionId: 'sub-uuid-001',
    memberAccountId: 'account-uuid-001',
    memberId: 'member-uuid-001',
    effectiveAmount: money(5000),
    registrationDate: new Date(2025, 0, 1),
    plan: monthlyPlan(),
    ...overrides,
  };
}

describe('ChargeGenerator', () => {
  describe('generateForMonth', () => {
    it('mes 4 con plan mensual → genera cargo', () => {
      const subscriptions = [activeSubscription()];

      const result = ChargeGenerator.generateForMonth(
        subscriptions,
        4, // abril
        2025,
        [], // sin cargos existentes
      );

      expect(result.charges).toHaveLength(1);
      expect(result.skippedNoMonth).toBe(0);
      expect(result.skippedDuplicate).toBe(0);
      expect(result.errors).toHaveLength(0);

      const charge = result.charges[0];
      expect(charge.subscriptionId).toBe('sub-uuid-001');
      expect(charge.memberAccountId).toBe('account-uuid-001');
      expect(charge.memberId).toBe('member-uuid-001');
      expect(charge.finalAmount.amount).toBe(5000);
      expect(charge.baseAmount.amount).toBe(5000);
      expect(charge.billingMonth).toBe(4);
      expect(charge.billingYear).toBe(2025);
      expect(charge.isProrated).toBe(false);
      expect(charge.description).toBe('Cargo 04/2025');
    });

    it('mes 4 con plan semestral [1,7] → no genera cargo (skip)', () => {
      const subscriptions = [activeSubscription({ plan: semestralPlan() })];

      const result = ChargeGenerator.generateForMonth(
        subscriptions,
        4, // abril no está en [1,7]
        2025,
        [],
      );

      expect(result.charges).toHaveLength(0);
      expect(result.skippedNoMonth).toBe(1);
      expect(result.skippedDuplicate).toBe(0);
    });

    it('mes 4 con cargo ya existente → skip duplicado', () => {
      const subscriptions = [activeSubscription()];
      const existingCharges: ExistingChargeKey[] = [
        {
          subscriptionId: 'sub-uuid-001',
          billingMonth: 4,
          billingYear: 2025,
        },
      ];

      const result = ChargeGenerator.generateForMonth(subscriptions, 4, 2025, existingCharges);

      expect(result.charges).toHaveLength(0);
      expect(result.skippedNoMonth).toBe(0);
      expect(result.skippedDuplicate).toBe(1);
    });

    it('resultado con contadores correctos para múltiples suscripciones', () => {
      const subscriptions = [
        // Suscripción 1: plan mensual, sin duplicado → genera cargo
        activeSubscription({
          subscriptionId: 'sub-001',
          memberAccountId: 'acc-001',
          memberId: 'mem-001',
        }),
        // Suscripción 2: plan semestral, mes no aplica → skip
        activeSubscription({
          subscriptionId: 'sub-002',
          memberAccountId: 'acc-002',
          memberId: 'mem-002',
          plan: semestralPlan(),
        }),
        // Suscripción 3: plan mensual, ya tiene cargo → duplicado
        activeSubscription({
          subscriptionId: 'sub-003',
          memberAccountId: 'acc-003',
          memberId: 'mem-003',
        }),
        // Suscripción 4: plan mensual, sin duplicado → genera cargo
        activeSubscription({
          subscriptionId: 'sub-004',
          memberAccountId: 'acc-004',
          memberId: 'mem-004',
        }),
      ];

      const existingCharges: ExistingChargeKey[] = [
        { subscriptionId: 'sub-003', billingMonth: 4, billingYear: 2025 },
      ];

      const result = ChargeGenerator.generateForMonth(subscriptions, 4, 2025, existingCharges);

      expect(result.charges).toHaveLength(2); // sub-001 y sub-004
      expect(result.skippedNoMonth).toBe(1); // sub-002
      expect(result.skippedDuplicate).toBe(1); // sub-003
      expect(result.errors).toHaveLength(0);
    });

    it('dueDate = último día del mes', () => {
      const subscriptions = [activeSubscription()];

      // Febrero 2025 (no bisiesto) → último día = 28
      const resultFeb = ChargeGenerator.generateForMonth(subscriptions, 2, 2025, []);
      expect(resultFeb.charges[0].dueDate.getDate()).toBe(28);
      expect(resultFeb.charges[0].dueDate.getMonth()).toBe(1); // 0-indexed

      // Febrero 2024 (bisiesto) → último día = 29
      const resultFebLeap = ChargeGenerator.generateForMonth(subscriptions, 2, 2024, []);
      expect(resultFebLeap.charges[0].dueDate.getDate()).toBe(29);

      // Abril → último día = 30
      const resultApr = ChargeGenerator.generateForMonth(subscriptions, 4, 2025, []);
      expect(resultApr.charges[0].dueDate.getDate()).toBe(30);

      // Enero → último día = 31
      const resultJan = ChargeGenerator.generateForMonth(subscriptions, 1, 2025, []);
      expect(resultJan.charges[0].dueDate.getDate()).toBe(31);
    });

    it('issueDate = primer día del mes', () => {
      const subscriptions = [activeSubscription()];

      const result = ChargeGenerator.generateForMonth(subscriptions, 4, 2025, []);

      const issueDate = result.charges[0].issueDate;
      expect(issueDate.getFullYear()).toBe(2025);
      expect(issueDate.getMonth()).toBe(3); // 0-indexed: abril = 3
      expect(issueDate.getDate()).toBe(1);
    });

    it('sin suscripciones → resultado vacío', () => {
      const result = ChargeGenerator.generateForMonth([], 4, 2025, []);

      expect(result.charges).toHaveLength(0);
      expect(result.skippedNoMonth).toBe(0);
      expect(result.skippedDuplicate).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('descripción del cargo incluye mes y año formateados', () => {
      const subscriptions = [activeSubscription()];

      const result = ChargeGenerator.generateForMonth(
        subscriptions,
        1, // enero
        2025,
        [],
      );

      expect(result.charges[0].description).toBe('Cargo 01/2025');
    });

    it('mes 7 con plan semestral [1,7] → genera cargo', () => {
      const subscriptions = [
        activeSubscription({
          plan: semestralPlan(),
          effectiveAmount: money(30000),
        }),
      ];

      const result = ChargeGenerator.generateForMonth(
        subscriptions,
        7, // julio está en [1,7]
        2025,
        [],
      );

      expect(result.charges).toHaveLength(1);
      expect(result.charges[0].finalAmount.amount).toBe(30000);
    });
  });
});
