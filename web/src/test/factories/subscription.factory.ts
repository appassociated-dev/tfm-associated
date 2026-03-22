// Factories de datos de suscripciones.
// Producen objetos que pasan los Zod schemas de subscription.schemas.ts.

import type {
  FeeSubscription,
  MemberSubscriptionsResponse,
} from '@/features/treasury/subscriptions/schemas/subscription.schemas';

let subscriptionCounter = 0;

/**
 * Genera un UUID v4 determinista basado en un prefijo y contador.
 */
function deterministicUuid(prefix: string, counter: number): string {
  const hex = counter.toString(16).padStart(12, '0');
  const pfx = prefix.padEnd(8, '0').slice(0, 8);
  return `${pfx}-0000-4000-8000-${hex}`;
}

/**
 * Construye una FeeSubscription con defaults deterministas.
 * Importes en centavos (12000 = 120.00 EUR).
 */
export function buildSubscription(overrides?: Partial<FeeSubscription>): FeeSubscription {
  subscriptionCounter++;
  return {
    id: deterministicUuid('a0000001', subscriptionCounter),
    feePlanId: deterministicUuid('b0000001', subscriptionCounter),
    feePlanName: `Plan de Cuota ${subscriptionCounter}`,
    feePlanCode: `CUOTA-${String(subscriptionCounter).padStart(3, '0')}`,
    feePlanType: 'RECURRING',
    baseAmount: 12000,
    typeDiscount: null,
    personalDiscount: null,
    personalDiscountReason: null,
    effectiveAmount: 12000,
    registrationDate: '2026-01-01T00:00:00.000Z',
    leaveDate: null,
    cancelReason: null,
    chargesGenerated: 3,
    totalCollected: 36000,
    ...overrides,
  };
}

/**
 * Construye una respuesta completa de suscripciones de un socio.
 */
export function buildMemberSubscriptionsResponse(
  overrides?: Partial<MemberSubscriptionsResponse>,
): MemberSubscriptionsResponse {
  subscriptionCounter++;
  return {
    memberId: deterministicUuid('c0000001', subscriptionCounter),
    memberName: `Socio Test ${subscriptionCounter}`,
    memberTypeId: deterministicUuid('d0000001', subscriptionCounter),
    memberTypeName: 'Socio Numerario',
    activeSubscription: buildSubscription(),
    closedSubscriptions: [],
    ...overrides,
  };
}

/**
 * Resetea el contador de subscription factories.
 */
export function resetSubscriptionCounters(): void {
  subscriptionCounter = 0;
}
