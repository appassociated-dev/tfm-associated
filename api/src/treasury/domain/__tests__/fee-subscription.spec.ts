import { describe, it, expect } from 'vitest';
import { FeeSubscription } from '../entities/fee-subscription';
import { Discount } from '../value-objects/discount';
import { Money } from '../value-objects/money';
import { SubscriptionCancelReason } from '../value-objects/subscription-cancel-reason';

/** UUID de ejemplo para feePlanId. */
const FEE_PLAN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea una suscripción válida con descuento por defecto (30% tipo, 10% personal). */
function createValidSubscription(
  overrides: Partial<{
    feePlanId: string;
    registrationDate: Date;
    typeDiscount: number;
    personalDiscount: number;
    amount: number;
  }> = {},
): FeeSubscription {
  const amount = overrides.amount ?? 12000;
  const typeDiscount = overrides.typeDiscount ?? 0.3;
  const personalDiscount = overrides.personalDiscount ?? 0.1;

  const moneyResult = Money.create(amount);
  if (!moneyResult.ok) throw new Error('Error creando Money para test');

  const discountResult = Discount.create(typeDiscount, personalDiscount);
  if (!discountResult.ok) throw new Error('Error creando Discount para test');

  return FeeSubscription.create({
    feePlanId: overrides.feePlanId ?? FEE_PLAN_ID,
    registrationDate: overrides.registrationDate ?? new Date('2025-01-01'),
    discount: discountResult.value,
    feePlanAmount: moneyResult.value,
    personalDiscountReason: null,
  });
}

describe('FeeSubscription Entity', () => {
  // --- Creación ---

  it('should create a subscription with valid data and precalculated effectiveAmount', () => {
    const subscription = createValidSubscription();

    expect(subscription.feePlanId.toValue()).toBe(FEE_PLAN_ID);
    expect(subscription.registrationDate).toEqual(new Date('2025-01-01'));
    expect(subscription.leaveDate).toBeNull();
    expect(subscription.cancelReason).toBeNull();
    expect(subscription.isActive()).toBe(true);
    // Verificar que el importe efectivo fue precalculado
    expect(subscription.effectiveAmount.amount).toBeGreaterThan(0);
  });

  it('should calculate effectiveAmount with multiplicative discount (12000 * 0.70 * 0.90 = 7560)', () => {
    const subscription = createValidSubscription({
      amount: 12000,
      typeDiscount: 0.3,
      personalDiscount: 0.1,
    });

    // Fórmula multiplicativa: 12000 * (1-0.30) * (1-0.10) = 7560
    expect(subscription.effectiveAmount.amount).toBe(7560);
  });

  // --- Cierre ---

  it('should close subscription with valid reason and date', () => {
    const subscription = createValidSubscription({
      registrationDate: new Date('2025-01-01'),
    });

    subscription.close(SubscriptionCancelReason.MEMBER_LEAVE, new Date('2025-06-15'));

    expect(subscription.leaveDate).toEqual(new Date('2025-06-15'));
    expect(subscription.cancelReason!.value).toBe('MEMBER_LEAVE');
    expect(subscription.isClosed()).toBe(true);
    expect(subscription.isActive()).toBe(false);
  });

  it('should throw error when leaveDate is before registrationDate', () => {
    const subscription = createValidSubscription({
      registrationDate: new Date('2025-06-01'),
    });

    expect(() =>
      subscription.close(
        SubscriptionCancelReason.MEMBER_LEAVE,
        new Date('2025-01-01'), // Anterior a la fecha de alta
      ),
    ).toThrow('La fecha de baja no puede ser anterior a la fecha de alta');
  });

  // --- Estado ---

  it('should return true for isActive() when subscription is open', () => {
    const subscription = createValidSubscription();

    expect(subscription.isActive()).toBe(true);
    expect(subscription.isClosed()).toBe(false);
  });

  it('should return true for isClosed() when subscription is closed', () => {
    const subscription = createValidSubscription();
    subscription.close(SubscriptionCancelReason.EXEMPTION, new Date('2025-12-31'));

    expect(subscription.isClosed()).toBe(true);
    expect(subscription.isActive()).toBe(false);
  });

  // --- Actualización de descuento ---

  it('should update discount and recalculate effectiveAmount', () => {
    const subscription = createValidSubscription({
      amount: 10000,
      typeDiscount: 0,
      personalDiscount: 0,
    });

    // Sin descuento, importe efectivo = 10000
    expect(subscription.effectiveAmount.amount).toBe(10000);

    // Actualizar descuento a 20% tipo + 5% personal
    const newDiscountResult = Discount.create(0.2, 0.05);
    expect(newDiscountResult.ok).toBe(true);
    if (!newDiscountResult.ok) return;

    const baseAmountResult = Money.create(10000);
    expect(baseAmountResult.ok).toBe(true);
    if (!baseAmountResult.ok) return;

    subscription.updateDiscount(newDiscountResult.value, baseAmountResult.value);

    // Nuevo importe: 10000 * (1-0.20) * (1-0.05) = 10000 * 0.80 * 0.95 = 7600
    expect(subscription.effectiveAmount.amount).toBe(7600);
    expect(subscription.discount.typeDiscount).toBe(0.2);
    expect(subscription.discount.personalDiscount).toBe(0.05);
  });

  // --- Reconstitución ---

  it('should reconstitute from persistence data without errors', () => {
    const now = new Date();
    const subscription = FeeSubscription.reconstitute({
      id: 'b1ffcd00-1d1c-4ef8-bb6d-7cc0ce491b22',
      feePlanId: FEE_PLAN_ID,
      registrationDate: new Date('2025-01-01'),
      leaveDate: new Date('2025-06-15'),
      typeDiscount: 0.3,
      personalDiscount: 0.1,
      personalDiscountReason: null,
      effectiveAmount: 7560,
      cancelReason: 'MEMBER_LEAVE',
      createdAt: now,
    });

    expect(subscription.id.toValue()).toBe('b1ffcd00-1d1c-4ef8-bb6d-7cc0ce491b22');
    expect(subscription.feePlanId.toValue()).toBe(FEE_PLAN_ID);
    expect(subscription.leaveDate).toEqual(new Date('2025-06-15'));
    expect(subscription.effectiveAmount.amount).toBe(7560);
    expect(subscription.cancelReason!.value).toBe('MEMBER_LEAVE');
    expect(subscription.isClosed()).toBe(true);
  });
});
