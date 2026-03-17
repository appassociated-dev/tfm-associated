import { describe, it, expect } from 'vitest';
import { Charge, ChargeInvariantError, ChargeOperationError } from '../entities/charge';
import { Money } from '../value-objects/money';
import { ChargeDescription } from '../value-objects/charge-description';
import { ChargeStatus } from '../value-objects/charge-status';

/** UUID de ejemplo para suscripción. */
const SUBSCRIPTION_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FISCAL_YEAR_ID = 'b1ffcd00-0d1c-5ef9-cc7e-7cc0ce491b22';

/** Crea un cargo válido con valores por defecto. */
function createValidCharge(
  overrides: Partial<{
    subscriptionId: string | null;
    baseAmount: number;
    finalAmount: number;
    description: string;
    billingMonth: number | null;
    billingYear: number;
    issueDate: Date;
    dueDate: Date;
    isProrated: boolean;
    isManual: boolean;
  }> = {},
): Charge {
  const baseAmount = overrides.baseAmount ?? 5000;
  const finalAmount = overrides.finalAmount ?? 5000;

  const baseMoneyResult = Money.create(baseAmount);
  if (!baseMoneyResult.ok) throw new Error('Error creando Money base para test');

  const finalMoneyResult = Money.create(finalAmount);
  if (!finalMoneyResult.ok) throw new Error('Error creando Money final para test');

  const descResult = ChargeDescription.create(
    overrides.description ?? 'Cuota mensual enero 2025',
    FISCAL_YEAR_ID,
  );
  if (!descResult.ok) throw new Error('Error creando ChargeDescription para test');

  return Charge.create({
    subscriptionId:
      overrides.subscriptionId !== undefined ? overrides.subscriptionId : SUBSCRIPTION_ID,
    baseAmount: baseMoneyResult.value,
    finalAmount: finalMoneyResult.value,
    description: descResult.value,
    billingMonth: overrides.billingMonth !== undefined ? overrides.billingMonth : 1,
    billingYear: overrides.billingYear ?? 2025,
    issueDate: overrides.issueDate ?? new Date('2025-01-01'),
    dueDate: overrides.dueDate ?? new Date('2025-01-31'),
    isProrated: overrides.isProrated ?? false,
    isManual: overrides.isManual ?? false,
  });
}

describe('Charge Entity', () => {
  // --- Creación ---

  describe('create()', () => {
    it('should create a charge with valid data in PENDING status', () => {
      const charge = createValidCharge();

      expect(charge.id.toValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(charge.subscriptionId).not.toBeNull();
      expect(charge.subscriptionId!.toValue()).toBe(SUBSCRIPTION_ID);
      expect(charge.baseAmount.amount).toBe(5000);
      expect(charge.finalAmount.amount).toBe(5000);
      expect(charge.description.description).toBe('Cuota mensual enero 2025');
      expect(charge.description.fiscalYearId).toBe(FISCAL_YEAR_ID);
      expect(charge.billingMonth).toBe(1);
      expect(charge.billingYear).toBe(2025);
      expect(charge.issueDate).toEqual(new Date('2025-01-01'));
      expect(charge.dueDate).toEqual(new Date('2025-01-31'));
      expect(charge.status.equals(ChargeStatus.PENDING)).toBe(true);
      expect(charge.paidAmount.amount).toBe(0);
      expect(charge.isProrated).toBe(false);
      expect(charge.isManual).toBe(false);
      expect(charge.createdAt).toBeInstanceOf(Date);
    });

    it('should create a prorated charge', () => {
      const charge = createValidCharge({
        baseAmount: 12000,
        finalAmount: 6000,
        isProrated: true,
      });

      expect(charge.isProrated).toBe(true);
      expect(charge.baseAmount.amount).toBe(12000);
      expect(charge.finalAmount.amount).toBe(6000);
    });

    it('should create a manual charge without subscription', () => {
      const charge = createValidCharge({
        subscriptionId: null,
        isManual: true,
        billingMonth: null,
      });

      expect(charge.isManual).toBe(true);
      expect(charge.subscriptionId).toBeNull();
      expect(charge.billingMonth).toBeNull();
    });

    it('should throw when finalAmount <= 0', () => {
      expect(() => createValidCharge({ finalAmount: 0 })).toThrow(ChargeInvariantError);
      expect(() => createValidCharge({ finalAmount: 0 })).toThrow(/importe final/i);
    });

    it('should throw when dueDate < issueDate', () => {
      expect(() =>
        createValidCharge({
          issueDate: new Date('2025-02-01'),
          dueDate: new Date('2025-01-15'),
        }),
      ).toThrow(ChargeInvariantError);
      expect(() =>
        createValidCharge({
          issueDate: new Date('2025-02-01'),
          dueDate: new Date('2025-01-15'),
        }),
      ).toThrow(/vencimiento/i);
    });

    it('should allow dueDate equal to issueDate', () => {
      const charge = createValidCharge({
        issueDate: new Date('2025-01-15'),
        dueDate: new Date('2025-01-15'),
      });

      expect(charge.issueDate).toEqual(charge.dueDate);
    });

    it('should throw when isManual=true but subscriptionId is provided', () => {
      expect(() =>
        createValidCharge({
          isManual: true,
          subscriptionId: SUBSCRIPTION_ID,
        }),
      ).toThrow(ChargeInvariantError);
      expect(() =>
        createValidCharge({
          isManual: true,
          subscriptionId: SUBSCRIPTION_ID,
        }),
      ).toThrow(/manual.*suscripción/i);
    });

    it('should throw when isManual=false but subscriptionId is null', () => {
      expect(() =>
        createValidCharge({
          isManual: false,
          subscriptionId: null,
        }),
      ).toThrow(ChargeInvariantError);
      expect(() =>
        createValidCharge({
          isManual: false,
          subscriptionId: null,
        }),
      ).toThrow(/no manual.*suscripción/i);
    });
  });

  // --- reconstitute ---

  describe('reconstitute()', () => {
    it('should reconstitute a charge from persistence data', () => {
      const chargeId = 'c2aabb11-1e2d-4fa0-ad8f-8dd1df502c33';

      const charge = Charge.reconstitute({
        id: chargeId,
        subscriptionId: SUBSCRIPTION_ID,
        baseAmount: 12000,
        finalAmount: 6000,
        description: 'Cuota prorrateada',
        fiscalYearId: FISCAL_YEAR_ID,
        billingMonth: 7,
        billingYear: 2025,
        issueDate: new Date('2025-07-01'),
        dueDate: new Date('2025-07-31'),
        status: 'PARTIALLY_PAID',
        paidAmount: 3000,
        isProrated: true,
        isManual: false,
        createdAt: new Date('2025-07-01T02:00:00Z'),
      });

      expect(charge.id.toValue()).toBe(chargeId);
      expect(charge.subscriptionId!.toValue()).toBe(SUBSCRIPTION_ID);
      expect(charge.baseAmount.amount).toBe(12000);
      expect(charge.finalAmount.amount).toBe(6000);
      expect(charge.description.description).toBe('Cuota prorrateada');
      expect(charge.billingMonth).toBe(7);
      expect(charge.billingYear).toBe(2025);
      expect(charge.status.equals(ChargeStatus.PARTIALLY_PAID)).toBe(true);
      expect(charge.paidAmount.amount).toBe(3000);
      expect(charge.isProrated).toBe(true);
    });

    it('should reconstitute a charge with null subscriptionId', () => {
      const charge = Charge.reconstitute({
        id: 'c2aabb11-1e2d-4fa0-ad8f-8dd1df502c33',
        subscriptionId: null,
        baseAmount: 5000,
        finalAmount: 5000,
        description: 'Cargo manual',
        fiscalYearId: null,
        billingMonth: null,
        billingYear: 2025,
        issueDate: new Date('2025-01-01'),
        dueDate: new Date('2025-01-31'),
        status: 'PENDING',
        paidAmount: 0,
        isProrated: false,
        isManual: true,
        createdAt: new Date('2025-01-01'),
      });

      expect(charge.subscriptionId).toBeNull();
      expect(charge.isManual).toBe(true);
    });
  });

  // --- recordPayment ---

  describe('recordPayment()', () => {
    it('should record a partial payment and set status to PARTIALLY_PAID', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const paymentResult = Money.create(2000);
      expect(paymentResult.ok).toBe(true);
      if (!paymentResult.ok) return;

      charge.recordPayment(paymentResult.value);

      expect(charge.paidAmount.amount).toBe(2000);
      expect(charge.status.equals(ChargeStatus.PARTIALLY_PAID)).toBe(true);
    });

    it('should record a full payment and set status to PAID', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const paymentResult = Money.create(5000);
      expect(paymentResult.ok).toBe(true);
      if (!paymentResult.ok) return;

      charge.recordPayment(paymentResult.value);

      expect(charge.paidAmount.amount).toBe(5000);
      expect(charge.status.equals(ChargeStatus.PAID)).toBe(true);
    });

    it('should accumulate multiple partial payments', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const payment1 = Money.create(2000);
      const payment2 = Money.create(1500);
      const payment3 = Money.create(1500);
      if (!payment1.ok || !payment2.ok || !payment3.ok) return;

      charge.recordPayment(payment1.value);
      expect(charge.status.equals(ChargeStatus.PARTIALLY_PAID)).toBe(true);

      charge.recordPayment(payment2.value);
      expect(charge.paidAmount.amount).toBe(3500);
      expect(charge.status.equals(ChargeStatus.PARTIALLY_PAID)).toBe(true);

      charge.recordPayment(payment3.value);
      expect(charge.paidAmount.amount).toBe(5000);
      expect(charge.status.equals(ChargeStatus.PAID)).toBe(true);
    });

    it('should throw when payment exceeds remaining amount', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const paymentResult = Money.create(6000);
      expect(paymentResult.ok).toBe(true);
      if (!paymentResult.ok) return;

      expect(() => charge.recordPayment(paymentResult.value)).toThrow(ChargeOperationError);
      expect(() => charge.recordPayment(paymentResult.value)).toThrow(/excede/i);
    });

    it('should throw when payment amount is 0', () => {
      const charge = createValidCharge();

      const paymentResult = Money.create(0);
      expect(paymentResult.ok).toBe(true);
      if (!paymentResult.ok) return;

      expect(() => charge.recordPayment(paymentResult.value)).toThrow(ChargeOperationError);
    });

    it('should throw when paying a cancelled charge', () => {
      const charge = createValidCharge();
      charge.cancel();

      const paymentResult = Money.create(1000);
      if (!paymentResult.ok) return;

      expect(() => charge.recordPayment(paymentResult.value)).toThrow(ChargeOperationError);
      expect(() => charge.recordPayment(paymentResult.value)).toThrow(/CANCELLED/);
    });

    it('should allow payment on PARTIALLY_PAID charge', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const payment1 = Money.create(2000);
      const payment2 = Money.create(3000);
      if (!payment1.ok || !payment2.ok) return;

      charge.recordPayment(payment1.value);
      expect(charge.status.equals(ChargeStatus.PARTIALLY_PAID)).toBe(true);

      charge.recordPayment(payment2.value);
      expect(charge.status.equals(ChargeStatus.PAID)).toBe(true);
    });
  });

  // --- cancel ---

  describe('cancel()', () => {
    it('should cancel a pending charge', () => {
      const charge = createValidCharge();

      charge.cancel();

      expect(charge.status.equals(ChargeStatus.CANCELLED)).toBe(true);
    });

    it('should cancel a partially paid charge', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const paymentResult = Money.create(2000);
      if (!paymentResult.ok) return;
      charge.recordPayment(paymentResult.value);

      charge.cancel();

      expect(charge.status.equals(ChargeStatus.CANCELLED)).toBe(true);
    });

    it('should throw when cancelling a paid charge', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const paymentResult = Money.create(5000);
      if (!paymentResult.ok) return;
      charge.recordPayment(paymentResult.value);

      expect(() => charge.cancel()).toThrow(ChargeOperationError);
      expect(() => charge.cancel()).toThrow(/pagado/i);
    });

    it('should throw when cancelling an already cancelled charge', () => {
      const charge = createValidCharge();
      charge.cancel();

      expect(() => charge.cancel()).toThrow(ChargeOperationError);
      expect(() => charge.cancel()).toThrow(/cancelado/i);
    });
  });

  // --- markAsReturned ---

  describe('markAsReturned()', () => {
    it('should mark a paid charge as returned', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const paymentResult = Money.create(5000);
      if (!paymentResult.ok) return;
      charge.recordPayment(paymentResult.value);

      charge.markAsReturned();

      expect(charge.status.equals(ChargeStatus.RETURNED)).toBe(true);
    });

    it('should throw when marking a pending charge as returned', () => {
      const charge = createValidCharge();

      expect(() => charge.markAsReturned()).toThrow(ChargeOperationError);
      expect(() => charge.markAsReturned()).toThrow(/pagado/i);
    });

    it('should throw when marking a cancelled charge as returned', () => {
      const charge = createValidCharge();
      charge.cancel();

      expect(() => charge.markAsReturned()).toThrow(ChargeOperationError);
    });
  });

  // --- isPending ---

  describe('isPending()', () => {
    it('should return true for a new charge', () => {
      const charge = createValidCharge();
      expect(charge.isPending()).toBe(true);
    });

    it('should return false after partial payment', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const paymentResult = Money.create(1000);
      if (!paymentResult.ok) return;
      charge.recordPayment(paymentResult.value);

      expect(charge.isPending()).toBe(false);
    });

    it('should return false after cancellation', () => {
      const charge = createValidCharge();
      charge.cancel();

      expect(charge.isPending()).toBe(false);
    });
  });

  // --- remainingAmount ---

  describe('remainingAmount()', () => {
    it('should return full amount for a new charge', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      expect(charge.remainingAmount().amount).toBe(5000);
    });

    it('should return correct remaining after partial payment', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const paymentResult = Money.create(2000);
      if (!paymentResult.ok) return;
      charge.recordPayment(paymentResult.value);

      expect(charge.remainingAmount().amount).toBe(3000);
    });

    it('should return 0 after full payment', () => {
      const charge = createValidCharge({ finalAmount: 5000 });

      const paymentResult = Money.create(5000);
      if (!paymentResult.ok) return;
      charge.recordPayment(paymentResult.value);

      expect(charge.remainingAmount().amount).toBe(0);
    });

    it('should return correct remaining after multiple partial payments', () => {
      const charge = createValidCharge({ finalAmount: 10000 });

      const p1 = Money.create(3000);
      const p2 = Money.create(2500);
      if (!p1.ok || !p2.ok) return;

      charge.recordPayment(p1.value);
      charge.recordPayment(p2.value);

      expect(charge.remainingAmount().amount).toBe(4500);
    });
  });
});
