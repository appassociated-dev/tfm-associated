import { describe, it, expect } from 'vitest';
import { MemberAccount } from '../aggregates/member-account';
import { FeeSubscription } from '../entities/fee-subscription';
import { Discount } from '../value-objects/discount';
import { Money } from '../value-objects/money';
import { PlanType } from '../value-objects/plan-type';
import { SubscriptionId } from '../value-objects/subscription-id';
import { SubscriptionCancelReason } from '../value-objects/subscription-cancel-reason';
import { SubscriptionCreatedEvent } from '../events/subscription-created.event';
import { SubscriptionClosedEvent } from '../events/subscription-closed.event';
import { SubscriptionModifiedEvent } from '../events/subscription-modified.event';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'member-uuid-5678';
const FEE_PLAN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FEE_PLAN_ID_2 = 'c2aadc11-2e2d-4ef8-bb7e-8dd1df592c33';

/** Crea una cuenta de socio válida. */
function createValidAccount(): MemberAccount {
  const result = MemberAccount.create({
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
  });
  if (!result.ok) throw new Error('Error creando MemberAccount para test');
  // Limpiar eventos de creación (si los hubiera)
  result.value.pullDomainEvents();
  return result.value;
}

/** Crea una suscripción válida para añadir a la cuenta. */
function createSubscription(
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

describe('MemberAccount Aggregate', () => {
  // --- Creación ---

  it('should create a valid MemberAccount', () => {
    const result = MemberAccount.create({
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.memberId).toBe(MEMBER_ID);
      expect(result.value.tenantId).toBe(TENANT_ID);
      expect(result.value.subscriptions).toHaveLength(0);
    }
  });

  it('should fail with empty memberId', () => {
    const result = MemberAccount.create({
      memberId: '',
      tenantId: TENANT_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('memberId');
    }
  });

  // --- addSubscription ---

  it('should add a RECURRING subscription and emit SubscriptionCreatedEvent', () => {
    const account = createValidAccount();
    const subscription = createSubscription();

    const result = account.addSubscription(subscription, PlanType.RECURRING);

    expect(result.ok).toBe(true);
    expect(account.subscriptions).toHaveLength(1);

    // Verificar evento emitido
    const events = account.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SubscriptionCreatedEvent);
  });

  it('should reject second RECURRING subscription when one is active', () => {
    const account = createValidAccount();
    const subscription1 = createSubscription();
    const subscription2 = createSubscription({ feePlanId: FEE_PLAN_ID_2 });

    account.addSubscription(subscription1, PlanType.RECURRING);
    const result = account.addSubscription(subscription2, PlanType.RECURRING);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('suscripción periódica activa');
    }
  });

  it('should allow adding ONE_TIME subscription without affecting RECURRING', () => {
    const account = createValidAccount();
    const recurringSubscription = createSubscription();
    const oneTimeSubscription = createSubscription({ feePlanId: FEE_PLAN_ID_2 });

    account.addSubscription(recurringSubscription, PlanType.RECURRING);
    const result = account.addSubscription(oneTimeSubscription, PlanType.ONE_TIME);

    expect(result.ok).toBe(true);
    expect(account.subscriptions).toHaveLength(2);
  });

  // --- changePlan ---

  it('should close current subscription with PLAN_CHANGE and create new one', () => {
    const account = createValidAccount();
    const currentSubscription = createSubscription();

    account.addSubscription(currentSubscription, PlanType.RECURRING);
    // Limpiar eventos de la primera suscripción
    account.pullDomainEvents();

    const newSubscription = createSubscription({
      feePlanId: FEE_PLAN_ID_2,
      amount: 15000,
      typeDiscount: 0.2,
      personalDiscount: 0.05,
    });

    const result = account.changePlan(
      currentSubscription.id,
      newSubscription,
      new Date('2025-06-01'),
      PlanType.RECURRING,
    );

    expect(result.ok).toBe(true);

    // La suscripción original debe estar cerrada
    expect(currentSubscription.isClosed()).toBe(true);
    expect(currentSubscription.cancelReason!.value).toBe('PLAN_CHANGE');

    // Debe haber 2 suscripciones (la cerrada y la nueva)
    expect(account.subscriptions).toHaveLength(2);

    // Verificar eventos: SubscriptionClosed + SubscriptionCreated
    const events = account.pullDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[0]).toBeInstanceOf(SubscriptionClosedEvent);
    expect(events[1]).toBeInstanceOf(SubscriptionCreatedEvent);
  });

  // --- closeSubscription ---

  it('should close subscription with reason and emit SubscriptionClosedEvent', () => {
    const account = createValidAccount();
    const subscription = createSubscription();

    account.addSubscription(subscription, PlanType.RECURRING);
    account.pullDomainEvents(); // Limpiar eventos de creación

    const result = account.closeSubscription(
      subscription.id,
      SubscriptionCancelReason.MEMBER_LEAVE,
      new Date('2025-12-31'),
    );

    expect(result.ok).toBe(true);
    expect(subscription.isClosed()).toBe(true);

    const events = account.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SubscriptionClosedEvent);
  });

  it('should fail when closing a non-existent subscription', () => {
    const account = createValidAccount();
    const fakeId = SubscriptionId.create();

    const result = account.closeSubscription(
      fakeId,
      SubscriptionCancelReason.MEMBER_LEAVE,
      new Date('2025-12-31'),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('No se encontró la suscripción');
    }
  });

  // --- updateSubscriptionDiscount ---

  it('should update discount, recalculate effectiveAmount and emit SubscriptionModifiedEvent', () => {
    const account = createValidAccount();
    const subscription = createSubscription({
      amount: 10000,
      typeDiscount: 0,
      personalDiscount: 0,
    });

    account.addSubscription(subscription, PlanType.RECURRING);
    account.pullDomainEvents(); // Limpiar eventos de creación

    // Verificar importe sin descuento
    expect(subscription.effectiveAmount.amount).toBe(10000);

    // Actualizar descuento
    const newDiscountResult = Discount.create(0.2, 0.05);
    expect(newDiscountResult.ok).toBe(true);
    if (!newDiscountResult.ok) return;

    const baseAmountResult = Money.create(10000);
    expect(baseAmountResult.ok).toBe(true);
    if (!baseAmountResult.ok) return;

    const result = account.updateSubscriptionDiscount(
      subscription.id,
      newDiscountResult.value,
      baseAmountResult.value,
    );

    expect(result.ok).toBe(true);
    // Nuevo importe: 10000 * 0.80 * 0.95 = 7600
    expect(subscription.effectiveAmount.amount).toBe(7600);

    const events = account.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SubscriptionModifiedEvent);
  });

  // --- getActivePeriodicSubscription ---

  it('should return the active periodic subscription', () => {
    const account = createValidAccount();
    const subscription = createSubscription();

    account.addSubscription(subscription, PlanType.RECURRING);

    const active = account.getActivePeriodicSubscription();
    expect(active).not.toBeNull();
    expect(active!.id.equals(subscription.id)).toBe(true);
  });

  it('should return null when no active periodic subscription exists', () => {
    const account = createValidAccount();

    const active = account.getActivePeriodicSubscription();
    expect(active).toBeNull();
  });

  // --- getSubscriptionHistory ---

  it('should return all subscriptions sorted by registrationDate DESC', () => {
    const account = createValidAccount();

    const sub1 = createSubscription({ registrationDate: new Date('2024-01-01') });
    const sub2 = createSubscription({
      feePlanId: FEE_PLAN_ID_2,
      registrationDate: new Date('2025-06-01'),
    });

    // Añadir la primera como RECURRING, cerrarla, luego añadir la segunda
    account.addSubscription(sub1, PlanType.RECURRING);
    sub1.close(SubscriptionCancelReason.PLAN_CHANGE, new Date('2025-05-31'));
    account.addSubscription(sub2, PlanType.RECURRING);

    const history = account.getSubscriptionHistory();
    expect(history).toHaveLength(2);
    // La más reciente primero (2025-06-01 antes que 2024-01-01)
    expect(history[0].registrationDate.getTime()).toBeGreaterThan(
      history[1].registrationDate.getTime(),
    );
  });

  // --- findSubscriptionById ---

  it('should find subscription by id', () => {
    const account = createValidAccount();
    const subscription = createSubscription();

    account.addSubscription(subscription, PlanType.RECURRING);

    const found = account.findSubscriptionById(subscription.id);
    expect(found).not.toBeNull();
    expect(found!.id.equals(subscription.id)).toBe(true);
  });

  it('should return null for non-existent subscription id', () => {
    const account = createValidAccount();
    const fakeId = SubscriptionId.create();

    const found = account.findSubscriptionById(fakeId);
    expect(found).toBeNull();
  });
});
