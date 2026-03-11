import { describe, it, expect } from 'vitest';
import { Payment, PaymentInvariantError } from '../entities/payment';
import { ChargeId } from '../value-objects/charge-id';
import { Money } from '../value-objects/money';
import { PaymentMethod } from '../value-objects/payment-method';
import { PaymentReference } from '../value-objects/payment-reference';
import { PaymentStatus } from '../value-objects/payment-status';
import { ReceiptNumber } from '../value-objects/receipt-number';

/** UUID de ejemplo para el tesorero. */
const REGISTERED_BY = 'b1ffcd00-0d1c-4ef9-ac7e-7cc0ce491b22';

/** Crea un pago válido con valores por defecto. */
function createValidPayment(
  overrides: Partial<{
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: Date;
    notes: string | null;
  }> = {},
): Payment {
  const amount = overrides.amount ?? 5000;
  const amountResult = Money.create(amount);
  if (!amountResult.ok) throw new Error('Error creando Money para test');

  const chargeId = ChargeId.create();
  const method = overrides.paymentMethod ?? PaymentMethod.CASH;
  const reference = PaymentReference.generate(method, 2025, 1);

  return Payment.create({
    chargeId,
    amount: amountResult.value,
    paymentMethod: method,
    paymentDate: overrides.paymentDate ?? new Date('2025-01-15'),
    paymentReference: reference,
    notes: overrides.notes !== undefined ? overrides.notes : null,
    registeredBy: REGISTERED_BY,
  });
}

describe('Payment Entity', () => {
  // --- Creación ---

  describe('create()', () => {
    it('should create a payment with valid data in CONFIRMED status', () => {
      const payment = createValidPayment();

      expect(payment.id).toBeDefined();
      expect(payment.id.toValue()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(payment.amount.amount).toBe(5000);
      expect(payment.paymentMethod.equals(PaymentMethod.CASH)).toBe(true);
      expect(payment.paymentReference.value).toBe('EF-2025-00001');
      expect(payment.status.equals(PaymentStatus.CONFIRMED)).toBe(true);
      expect(payment.receiptNumber).toBeNull();
      expect(payment.notes).toBeNull();
      expect(payment.registeredBy).toBe(REGISTERED_BY);
      expect(payment.createdAt).toBeInstanceOf(Date);
    });

    it('should create a payment with notes', () => {
      const payment = createValidPayment({ notes: 'Pago en ventanilla' });

      expect(payment.notes).toBe('Pago en ventanilla');
    });

    it('should create a payment with TRANSFER method', () => {
      const payment = createValidPayment({ paymentMethod: PaymentMethod.TRANSFER });

      expect(payment.paymentMethod.equals(PaymentMethod.TRANSFER)).toBe(true);
      expect(payment.paymentReference.value).toBe('TR-2025-00001');
    });

    it('should create a payment with BIZUM method', () => {
      const payment = createValidPayment({ paymentMethod: PaymentMethod.BIZUM });

      expect(payment.paymentMethod.equals(PaymentMethod.BIZUM)).toBe(true);
      expect(payment.paymentReference.value).toBe('BZ-2025-00001');
    });

    it('should throw error when amount is 0', () => {
      expect(() => createValidPayment({ amount: 0 })).toThrow(PaymentInvariantError);
      expect(() => createValidPayment({ amount: 0 })).toThrow(
        'El importe del pago debe ser mayor que 0',
      );
    });

    it('should throw error when payment date is in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      expect(() => createValidPayment({ paymentDate: futureDate })).toThrow(PaymentInvariantError);
      expect(() => createValidPayment({ paymentDate: futureDate })).toThrow(
        'no puede ser posterior a la fecha actual',
      );
    });

    it('should accept today as payment date', () => {
      // Usamos una fecha reciente para evitar problemas de timing
      const today = new Date();
      today.setSeconds(today.getSeconds() - 5);

      const payment = createValidPayment({ paymentDate: today });
      expect(payment.paymentDate).toEqual(today);
    });
  });

  // --- Reconstitución ---

  describe('reconstitute()', () => {
    it('should reconstitute a payment from persistence data', () => {
      const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const chargeId = 'b1ffcd00-0d1c-4ef9-ac7e-7cc0ce491b22';
      const now = new Date();

      const payment = Payment.reconstitute({
        id,
        chargeId,
        amount: 2450,
        paymentMethod: 'CASH',
        paymentDate: new Date('2025-01-15'),
        paymentReference: 'EF-2025-00042',
        receiptNumber: 'REC-2025-00042',
        notes: 'Pago en efectivo',
        registeredBy: REGISTERED_BY,
        status: 'CONFIRMED',
        createdAt: now,
      });

      expect(payment.id.toValue()).toBe(id);
      expect(payment.chargeId.toValue()).toBe(chargeId);
      expect(payment.amount.amount).toBe(2450);
      expect(payment.paymentMethod.equals(PaymentMethod.CASH)).toBe(true);
      expect(payment.paymentReference.value).toBe('EF-2025-00042');
      expect(payment.receiptNumber?.value).toBe('REC-2025-00042');
      expect(payment.notes).toBe('Pago en efectivo');
      expect(payment.registeredBy).toBe(REGISTERED_BY);
      expect(payment.status.equals(PaymentStatus.CONFIRMED)).toBe(true);
      expect(payment.createdAt).toEqual(now);
    });

    it('should reconstitute a payment without receipt number', () => {
      const payment = Payment.reconstitute({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        chargeId: 'b1ffcd00-0d1c-4ef9-ac7e-7cc0ce491b22',
        amount: 5000,
        paymentMethod: 'TRANSFER',
        paymentDate: new Date('2025-02-10'),
        paymentReference: 'TR-2025-00001',
        receiptNumber: null,
        notes: null,
        registeredBy: REGISTERED_BY,
        status: 'CONFIRMED',
        createdAt: new Date(),
      });

      expect(payment.receiptNumber).toBeNull();
      expect(payment.notes).toBeNull();
    });

    it('should reconstitute an ANNULLED payment', () => {
      const payment = Payment.reconstitute({
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        chargeId: 'b1ffcd00-0d1c-4ef9-ac7e-7cc0ce491b22',
        amount: 3000,
        paymentMethod: 'BIZUM',
        paymentDate: new Date('2025-03-01'),
        paymentReference: 'BZ-2025-00005',
        receiptNumber: null,
        notes: null,
        registeredBy: REGISTERED_BY,
        status: 'ANNULLED',
        createdAt: new Date(),
      });

      expect(payment.status.equals(PaymentStatus.ANNULLED)).toBe(true);
    });
  });

  // --- Métodos de negocio ---

  describe('setReceiptNumber()', () => {
    it('should set the receipt number on a payment', () => {
      const payment = createValidPayment();
      expect(payment.receiptNumber).toBeNull();

      const receiptNumber = ReceiptNumber.generate(2025, 42);
      payment.setReceiptNumber(receiptNumber);

      expect(payment.receiptNumber).not.toBeNull();
      expect(payment.receiptNumber?.value).toBe('REC-2025-00042');
    });

    it('should overwrite an existing receipt number', () => {
      const payment = createValidPayment();

      const receipt1 = ReceiptNumber.generate(2025, 1);
      payment.setReceiptNumber(receipt1);
      expect(payment.receiptNumber?.value).toBe('REC-2025-00001');

      const receipt2 = ReceiptNumber.generate(2025, 2);
      payment.setReceiptNumber(receipt2);
      expect(payment.receiptNumber?.value).toBe('REC-2025-00002');
    });
  });
});
