// Factories de datos de planes de cuota.
// Producen objetos que pasan los Zod schemas de fee-plan.schemas.ts.

import type {
  FeePlan,
  FeePlanDetail,
  MemberTypeOption,
} from '@/features/treasury/fee-plans/schemas/fee-plan.schemas';

let feePlanCounter = 0;

/**
 * Genera un UUID v4 determinista basado en un prefijo y contador.
 */
function deterministicUuid(prefix: string, counter: number): string {
  const hex = counter.toString(16).padStart(12, '0');
  const pfx = prefix.padEnd(8, '0').slice(0, 8);
  return `${pfx}-0000-4000-8000-${hex}`;
}

/**
 * Construye un FeePlan con defaults deterministas.
 * amount está en centavos (12000 = 120.00 EUR).
 */
export function buildFeePlan(overrides?: Partial<FeePlan>): FeePlan {
  feePlanCounter++;
  return {
    id: deterministicUuid('f0000001', feePlanCounter),
    code: `CUOTA-${String(feePlanCounter).padStart(3, '0')}`,
    name: `Plan de Cuota ${feePlanCounter}`,
    description: null,
    type: 'RECURRING',
    amount: 12000,
    amountFormatted: '120.00 EUR',
    currency: 'EUR',
    frequency: 'ANNUAL',
    billingMonths: [1],
    active: true,
    activeSubscriptionsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * Construye un FeePlanDetail (plan con vinculaciones a tipos de socio).
 */
export function buildFeePlanDetail(overrides?: Partial<FeePlanDetail>): FeePlanDetail {
  const base = buildFeePlan();
  return {
    ...base,
    linkedMemberTypes: [],
    ...overrides,
  };
}

/**
 * Construye un MemberTypeOption (para el selector de vinculación).
 */
export function buildMemberTypeOption(overrides?: Partial<MemberTypeOption>): MemberTypeOption {
  feePlanCounter++;
  return {
    id: deterministicUuid('c0000001', feePlanCounter),
    code: `TIPO-${feePlanCounter}`,
    name: `Tipo ${feePlanCounter}`,
    active: true,
    ...overrides,
  };
}

/**
 * Resetea el contador de fee-plan factories.
 */
export function resetFeePlanCounters(): void {
  feePlanCounter = 0;
}
