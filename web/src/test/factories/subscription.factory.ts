// Factories de datos de suscripciones.
// Producen objetos que pasan los Zod schemas de subscription.schemas.ts.
// Alineados con SubscriptionResponseDto y SubscriptionHistoryResponseDto (REQ-ZOD-001, REQ-ZOD-002).

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
 * Alineado con SubscriptionResponseDto — sin campos fantasma.
 * Importes en centavos (12000 = 120.00 EUR).
 */
export function buildSubscription(overrides?: Partial<FeeSubscription>): FeeSubscription {
  subscriptionCounter++;
  return {
    id: deterministicUuid('a0000001', subscriptionCounter),
    feePlanId: deterministicUuid('b0000001', subscriptionCounter),
    feePlanName: `Plan de Cuota ${subscriptionCounter}`,
    feePlanCode: `CUOTA-${String(subscriptionCounter).padStart(3, '0')}`,
    typeDiscount: 0,
    personalDiscount: 0,
    personalDiscountReason: null,
    effectiveAmount: 12000,
    effectiveAmountFormatted: '120.00 EUR',
    isActive: true,
    registrationDate: '2026-01-01T00:00:00.000Z',
    leaveDate: null,
    cancelReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * Construye una respuesta completa de suscripciones de un socio.
 * Alineado con SubscriptionHistoryResponseDto — sin campos fantasma.
 */
export function buildMemberSubscriptionsResponse(
  overrides?: Partial<MemberSubscriptionsResponse>,
): MemberSubscriptionsResponse {
  subscriptionCounter++;
  return {
    memberAccountId: deterministicUuid('c0000001', subscriptionCounter),
    memberId: deterministicUuid('d0000001', subscriptionCounter),
    activeSubscription: buildSubscription(),
    history: [],
    ...overrides,
  };
}

/**
 * Resetea el contador de subscription factories.
 */
export function resetSubscriptionCounters(): void {
  subscriptionCounter = 0;
}
