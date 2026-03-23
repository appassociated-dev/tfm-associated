import { describe, it, expect } from 'vitest';
import { MemberAccount } from '../aggregates/member-account';
import { Charge } from '../entities/charge';
import { Payment } from '../entities/payment';
import { ChargeId } from '../value-objects/charge-id';
import { ChargeStatus } from '../value-objects/charge-status';
import { Money } from '../value-objects/money';
import { PaymentMethod } from '../value-objects/payment-method';
import { PaymentReference } from '../value-objects/payment-reference';
import { PaymentRecordedEvent } from '../events/payment-recorded.event';

/** UUIDs de ejemplo para tests. */
const TENANT_ID = '01234567-abcd-4ef8-9012-abcdefabcdef';
const MEMBER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ACCOUNT_ID = 'b1ffcd00-0d1c-4ef9-ac7e-7cc0ce491b22';
const SUBSCRIPTION_ID = 'c2aabb11-1e2d-4fa0-ad8f-8dd1df502c33';
const FISCAL_YEAR_ID = 'd3bbcc22-2f3e-4ab1-be9a-9ee2ea613d44';
const REGISTERED_BY = 'e4ccdd33-3a4f-4bc2-8f0a-0ff3fa724e55';

/** Secuencia global para generar referencias únicas en tests. */
let paymentSequence = 0;

/**
 * Crea un cargo reconstituido con valores conocidos.
 * @param overrides Valores que sobreescriben los por defecto.
 */
function createCharge(
  overrides: Partial<{
    id: string;
    finalAmount: number;
    paidAmount: number;
    status: string;
  }> = {},
): Charge {
  return Charge.reconstitute({
    id: overrides.id ?? ChargeId.create().toValue(),
    subscriptionId: SUBSCRIPTION_ID,
    baseAmount: overrides.finalAmount ?? 5000,
    finalAmount: overrides.finalAmount ?? 5000,
    description: 'Cuota mensual enero 2025',
    fiscalYearId: FISCAL_YEAR_ID,
    billingMonth: 1,
    billingYear: 2025,
    issueDate: new Date('2025-01-01'),
    dueDate: new Date('2025-01-31'),
    status: overrides.status ?? 'PENDING',
    paidAmount: overrides.paidAmount ?? 0,
    isProrated: false,
    isManual: false,
    createdAt: new Date('2025-01-01'),
  });
}

/**
 * Crea un pago válido para un cargo específico.
 */
function createPayment(chargeId: ChargeId, amount: number): Payment {
  const amountResult = Money.create(amount);
  if (!amountResult.ok) throw amountResult.error;

  paymentSequence++;
  const reference = PaymentReference.generate(PaymentMethod.CASH, 2025, paymentSequence);

  return Payment.create({
    chargeId,
    amount: amountResult.value,
    paymentMethod: PaymentMethod.CASH,
    paymentDate: new Date('2025-01-15'),
    paymentReference: reference,
    notes: null,
    registeredBy: REGISTERED_BY,
  });
}

/**
 * Crea una MemberAccount reconstituida con cargos y pagos opcionales.
 */
function createAccountWithCharges(charges: Charge[], payments: Payment[] = []): MemberAccount {
  return MemberAccount.reconstitute({
    id: ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [],
    charges,
    payments,
    createdAt: new Date('2024-01-01'),
  });
}

describe('MemberAccount — Payments', () => {
  // --- recordPayment ---

  describe('recordPayment()', () => {
    it('should record a complete payment and transition charge to PAID', () => {
      const charge = createCharge({ finalAmount: 5000 });
      const account = createAccountWithCharges([charge]);
      const payment = createPayment(charge.id, 5000);

      const result = account.recordPayment(charge.id, payment);

      expect(result.ok).toBe(true);
      expect(charge.status.equals(ChargeStatus.PAID)).toBe(true);
      expect(charge.paidAmount.amount).toBe(5000);
      expect(account.payments).toHaveLength(1);

      // Verificar evento emitido
      const events = account.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(PaymentRecordedEvent);
      const event = events[0] as PaymentRecordedEvent;
      expect(event.payload.chargeNewStatus).toBe('PAID');
      expect(event.payload.amount).toBe(5000);
    });

    it('should record a partial payment and transition charge to PARTIALLY_PAID', () => {
      const charge = createCharge({ finalAmount: 5000 });
      const account = createAccountWithCharges([charge]);
      const payment = createPayment(charge.id, 2000);

      const result = account.recordPayment(charge.id, payment);

      expect(result.ok).toBe(true);
      expect(charge.status.equals(ChargeStatus.PARTIALLY_PAID)).toBe(true);
      expect(charge.paidAmount.amount).toBe(2000);
      expect(charge.remainingAmount().amount).toBe(3000);
    });

    it('should complete charge with a second partial payment', () => {
      // Cargo con un pago parcial previo de 2000
      const charge = createCharge({
        finalAmount: 5000,
        paidAmount: 2000,
        status: 'PARTIALLY_PAID',
      });
      const account = createAccountWithCharges([charge]);
      const payment = createPayment(charge.id, 3000);

      const result = account.recordPayment(charge.id, payment);

      expect(result.ok).toBe(true);
      expect(charge.status.equals(ChargeStatus.PAID)).toBe(true);
      expect(charge.paidAmount.amount).toBe(5000);
      expect(charge.remainingAmount().amount).toBe(0);
    });

    it('should return error when overpaying (amount > remainingAmount)', () => {
      const charge = createCharge({ finalAmount: 5000 });
      const account = createAccountWithCharges([charge]);
      const payment = createPayment(charge.id, 6000);

      const result = account.recordPayment(charge.id, payment);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toMatch(/supera/i);
        expect(result.error.message).toMatch(/FE-1/);
      }
      // El cargo no debe haberse modificado
      expect(charge.status.equals(ChargeStatus.PENDING)).toBe(true);
      expect(charge.paidAmount.amount).toBe(0);
    });

    it('should return error when charge is already PAID', () => {
      const charge = createCharge({ finalAmount: 5000, paidAmount: 5000, status: 'PAID' });
      const account = createAccountWithCharges([charge]);
      const payment = createPayment(charge.id, 1000);

      const result = account.recordPayment(charge.id, payment);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toMatch(/pagado/i);
        expect(result.error.message).toMatch(/FE-4/);
      }
    });

    it('should return error when charge is CANCELLED', () => {
      const charge = createCharge({ finalAmount: 5000, status: 'CANCELLED' });
      const account = createAccountWithCharges([charge]);
      const payment = createPayment(charge.id, 5000);

      const result = account.recordPayment(charge.id, payment);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toMatch(/cancelado/i);
      }
    });

    it('should succeed when charge is RETURNED (regularizacion US-054 escenario B)', () => {
      // Cargo devuelto: fue pagado (5000) y luego devuelto. paidAmount se mantiene en 5000 pero
      // para la regularización necesitamos que el paidAmount refleje el importe restante.
      // Cuando se marca como RETURNED, se espera poder pagar de nuevo desde 0.
      // En este caso usamos un cargo RETURNED con paidAmount=0 (el banco devolvió todo).
      const charge = createCharge({ finalAmount: 5000, paidAmount: 0, status: 'RETURNED' });
      const account = createAccountWithCharges([charge]);
      const payment = createPayment(charge.id, 5000);

      const result = account.recordPayment(charge.id, payment);

      expect(result.ok).toBe(true);
      expect(charge.status.equals(ChargeStatus.PAID)).toBe(true);
      expect(charge.paidAmount.amount).toBe(5000);

      // Verificar evento
      const events = account.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect((events[0] as PaymentRecordedEvent).payload.chargeNewStatus).toBe('PAID');
    });

    it('should return error when charge does not exist', () => {
      const charge = createCharge();
      const account = createAccountWithCharges([charge]);
      const nonExistentChargeId = ChargeId.create();
      const payment = createPayment(nonExistentChargeId, 5000);

      const result = account.recordPayment(nonExistentChargeId, payment);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toMatch(/No se encontr/i);
      }
    });
  });

  // --- recordMultiChargePayment ---

  describe('recordMultiChargePayment()', () => {
    it('should pay 3 charges creating 3 payments with the same reference', () => {
      const charge1 = createCharge({ finalAmount: 2000 });
      const charge2 = createCharge({ finalAmount: 3000 });
      const charge3 = createCharge({ finalAmount: 1500 });
      const account = createAccountWithCharges([charge1, charge2, charge3]);

      const amount1 = Money.create(2000);
      const amount2 = Money.create(3000);
      const amount3 = Money.create(1500);
      if (!amount1.ok || !amount2.ok || !amount3.ok) throw new Error('Error creando Money');

      const sharedReference = PaymentReference.generate(PaymentMethod.TRANSFER, 2025, 99);

      const result = account.recordMultiChargePayment(
        [
          { chargeId: charge1.id, amount: amount1.value },
          { chargeId: charge2.id, amount: amount2.value },
          { chargeId: charge3.id, amount: amount3.value },
        ],
        {
          method: PaymentMethod.TRANSFER,
          date: new Date('2025-01-20'),
          reference: sharedReference,
          notes: 'Pago agrupado',
          registeredBy: REGISTERED_BY,
        },
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // 3 pagos creados
      expect(result.value).toHaveLength(3);

      // Todos los pagos comparten la misma referencia
      for (const payment of result.value) {
        expect(payment.paymentReference.value).toBe(sharedReference.value);
        expect(payment.paymentMethod.equals(PaymentMethod.TRANSFER)).toBe(true);
      }

      // Los 3 cargos están PAID
      expect(charge1.status.equals(ChargeStatus.PAID)).toBe(true);
      expect(charge2.status.equals(ChargeStatus.PAID)).toBe(true);
      expect(charge3.status.equals(ChargeStatus.PAID)).toBe(true);

      // 3 eventos emitidos
      const events = account.pullDomainEvents();
      expect(events).toHaveLength(3);
      expect(events.every((e) => e instanceof PaymentRecordedEvent)).toBe(true);
    });

    it('should fail if one charge is already paid (all or nothing)', () => {
      const charge1 = createCharge({ finalAmount: 2000 });
      const charge2 = createCharge({ finalAmount: 3000, paidAmount: 3000, status: 'PAID' });
      const charge3 = createCharge({ finalAmount: 1500 });
      const account = createAccountWithCharges([charge1, charge2, charge3]);

      const amount1 = Money.create(2000);
      const amount3 = Money.create(1500);
      if (!amount1.ok || !amount3.ok) throw new Error('Error creando Money');

      const reference = PaymentReference.generate(PaymentMethod.CASH, 2025, 100);

      const result = account.recordMultiChargePayment(
        [
          { chargeId: charge1.id, amount: amount1.value },
          {
            chargeId: charge2.id,
            amount: Money.create(3000).ok
              ? (Money.create(3000) as { ok: true; value: Money }).value
              : Money.zero(),
          },
          { chargeId: charge3.id, amount: amount3.value },
        ],
        {
          method: PaymentMethod.CASH,
          date: new Date('2025-01-20'),
          reference,
          notes: null,
          registeredBy: REGISTERED_BY,
        },
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toMatch(/pagado/i);
      }

      // Ningún cargo debe haberse modificado (atomicidad)
      expect(charge1.status.equals(ChargeStatus.PENDING)).toBe(true);
      expect(charge3.status.equals(ChargeStatus.PENDING)).toBe(true);
      expect(account.payments).toHaveLength(0);
    });
  });

  // --- getBalance ---

  describe('getBalance()', () => {
    it('should return sum of remaining for PENDING charges only (exclude PAID)', () => {
      const charge1 = createCharge({ finalAmount: 3000 }); // PENDING
      const charge2 = createCharge({ finalAmount: 2000 }); // PENDING
      const charge3 = createCharge({ finalAmount: 5000, paidAmount: 5000, status: 'PAID' }); // PAID
      const account = createAccountWithCharges([charge1, charge2, charge3]);

      const balance = account.getBalance();

      expect(balance.amount).toBe(5000); // 3000 + 2000
    });

    it('should calculate correct balance with partial payment', () => {
      const charge1 = createCharge({
        finalAmount: 5000,
        paidAmount: 2000,
        status: 'PARTIALLY_PAID',
      });
      const charge2 = createCharge({ finalAmount: 3000 }); // PENDING
      const account = createAccountWithCharges([charge1, charge2]);

      const balance = account.getBalance();

      // Remaining: (5000-2000) + 3000 = 6000
      expect(balance.amount).toBe(6000);
    });

    it('should return 0 when all charges are PAID', () => {
      const charge1 = createCharge({ finalAmount: 5000, paidAmount: 5000, status: 'PAID' });
      const account = createAccountWithCharges([charge1]);

      const balance = account.getBalance();

      expect(balance.amount).toBe(0);
    });

    it('should return 0 when there are no charges', () => {
      const account = createAccountWithCharges([]);

      const balance = account.getBalance();

      expect(balance.amount).toBe(0);
    });
  });

  // --- getPendingCharges ---

  describe('getPendingCharges()', () => {
    it('should return only PENDING and PARTIALLY_PAID charges', () => {
      const charge1 = createCharge({ finalAmount: 3000 }); // PENDING
      const charge2 = createCharge({
        finalAmount: 2000,
        paidAmount: 1000,
        status: 'PARTIALLY_PAID',
      });
      const charge3 = createCharge({ finalAmount: 5000, paidAmount: 5000, status: 'PAID' }); // PAID
      const charge4 = createCharge({ finalAmount: 1000, status: 'CANCELLED' }); // CANCELLED
      const charge5 = createCharge({ finalAmount: 4000, paidAmount: 0, status: 'RETURNED' }); // RETURNED
      const account = createAccountWithCharges([charge1, charge2, charge3, charge4, charge5]);

      const pending = account.getPendingCharges();

      expect(pending).toHaveLength(2);
      expect(pending.some((c) => c.id.equals(charge1.id))).toBe(true);
      expect(pending.some((c) => c.id.equals(charge2.id))).toBe(true);
    });

    it('should return empty array when no pending charges', () => {
      const charge1 = createCharge({ finalAmount: 5000, paidAmount: 5000, status: 'PAID' });
      const account = createAccountWithCharges([charge1]);

      const pending = account.getPendingCharges();

      expect(pending).toHaveLength(0);
    });
  });

  // --- getPaymentHistory ---

  describe('getPaymentHistory()', () => {
    it('should return payments sorted by paymentDate DESC', () => {
      const charge = createCharge({ finalAmount: 10000 });

      // Crear pagos con distintas fechas manualmente via reconstitute
      const payment1 = Payment.reconstitute({
        id: 'f5ddee44-4a5b-4cd3-8e1f-1aa4ab835f66',
        chargeId: charge.id.toValue(),
        amount: 3000,
        paymentMethod: 'CASH',
        paymentDate: new Date('2025-01-10'),
        paymentReference: 'EF-2025-00001',
        receiptNumber: null,
        notes: null,
        registeredBy: REGISTERED_BY,
        status: 'CONFIRMED',
        createdAt: new Date('2025-01-10'),
      });

      const payment2 = Payment.reconstitute({
        id: 'a6eeff55-5b6c-4de4-9f2a-2bb5bc946a77',
        chargeId: charge.id.toValue(),
        amount: 2000,
        paymentMethod: 'CASH',
        paymentDate: new Date('2025-01-20'),
        paymentReference: 'EF-2025-00002',
        receiptNumber: null,
        notes: null,
        registeredBy: REGISTERED_BY,
        status: 'CONFIRMED',
        createdAt: new Date('2025-01-20'),
      });

      const account = createAccountWithCharges([charge], [payment1, payment2]);

      const history = account.getPaymentHistory();

      expect(history).toHaveLength(2);
      // payment2 (Jan 20) debería estar primero (DESC)
      expect(history[0].id.toValue()).toBe(payment2.id.toValue());
      expect(history[1].id.toValue()).toBe(payment1.id.toValue());
    });
  });

  // --- findChargeById ---

  describe('findChargeById()', () => {
    it('should find existing charge', () => {
      const charge = createCharge();
      const account = createAccountWithCharges([charge]);

      const found = account.findChargeById(charge.id);

      expect(found).toBeDefined();
      expect(found!.id.equals(charge.id)).toBe(true);
    });

    it('should return undefined for non-existent charge', () => {
      const charge = createCharge();
      const account = createAccountWithCharges([charge]);

      const found = account.findChargeById(ChargeId.create());

      expect(found).toBeUndefined();
    });
  });

  // --- Backward compatibility ---

  describe('backward compatibility', () => {
    it('should reconstitute without charges and payments (empty defaults)', () => {
      const account = MemberAccount.reconstitute({
        id: ACCOUNT_ID,
        memberId: MEMBER_ID,
        tenantId: TENANT_ID,
        subscriptions: [],
        createdAt: new Date('2024-01-01'),
      });

      expect(account.charges).toHaveLength(0);
      expect(account.payments).toHaveLength(0);
      expect(account.getBalance().amount).toBe(0);
      expect(account.getPendingCharges()).toHaveLength(0);
      expect(account.getPaymentHistory()).toHaveLength(0);
    });
  });
});
