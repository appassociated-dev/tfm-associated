import { describe, it, expect } from 'vitest';
import { PaymentMethod } from '../value-objects/payment-method';
import { PaymentReference } from '../value-objects/payment-reference';
import { PaymentStatus } from '../value-objects/payment-status';
import { ReceiptNumber } from '../value-objects/receipt-number';

// =============================================================================
// PaymentMethod
// =============================================================================

describe('PaymentMethod', () => {
  it('should have all valid enum values', () => {
    expect(PaymentMethod.CASH.value).toBe('CASH');
    expect(PaymentMethod.TRANSFER.value).toBe('TRANSFER');
    expect(PaymentMethod.BIZUM.value).toBe('BIZUM');
    expect(PaymentMethod.SEPA_DIRECT_DEBIT.value).toBe('SEPA_DIRECT_DEBIT');
    expect(PaymentMethod.CARD_TPV.value).toBe('CARD_TPV');
  });

  it('should create from valid string', () => {
    const method = PaymentMethod.fromString('CASH');
    expect(method.equals(PaymentMethod.CASH)).toBe(true);
  });

  it('should throw error for invalid string', () => {
    expect(() => PaymentMethod.fromString('INVALID')).toThrow('Método de pago inválido');
  });

  describe('toPrefix()', () => {
    it.each([
      [PaymentMethod.CASH, 'EF'],
      [PaymentMethod.TRANSFER, 'TR'],
      [PaymentMethod.BIZUM, 'BZ'],
      [PaymentMethod.SEPA_DIRECT_DEBIT, 'SEPA'],
      [PaymentMethod.CARD_TPV, 'TPV'],
    ])('should return correct prefix for %s', (method, expectedPrefix) => {
      expect(PaymentMethod.toPrefix(method)).toBe(expectedPrefix);
    });
  });

  describe('toLabel()', () => {
    it.each([
      [PaymentMethod.CASH, 'Efectivo'],
      [PaymentMethod.TRANSFER, 'Transferencia bancaria'],
      [PaymentMethod.BIZUM, 'Bizum'],
      [PaymentMethod.SEPA_DIRECT_DEBIT, 'Domiciliación SEPA'],
      [PaymentMethod.CARD_TPV, 'Tarjeta (TPV)'],
    ])('should return correct label for %s', (method, expectedLabel) => {
      expect(PaymentMethod.toLabel(method)).toBe(expectedLabel);
    });
  });

  it('should compare equal for same method', () => {
    const m1 = PaymentMethod.fromString('BIZUM');
    expect(m1.equals(PaymentMethod.BIZUM)).toBe(true);
  });

  it('should compare not equal for different methods', () => {
    expect(PaymentMethod.CASH.equals(PaymentMethod.TRANSFER)).toBe(false);
  });
});

// =============================================================================
// PaymentReference
// =============================================================================

describe('PaymentReference', () => {
  it('should generate reference with correct format for CASH', () => {
    const ref = PaymentReference.generate(PaymentMethod.CASH, 2025, 42);
    expect(ref.value).toBe('EF-2025-00042');
  });

  it('should generate reference with correct format for TRANSFER', () => {
    const ref = PaymentReference.generate(PaymentMethod.TRANSFER, 2025, 1);
    expect(ref.value).toBe('TR-2025-00001');
  });

  it('should generate reference with correct format for BIZUM', () => {
    const ref = PaymentReference.generate(PaymentMethod.BIZUM, 2025, 123);
    expect(ref.value).toBe('BZ-2025-00123');
  });

  it('should generate reference with correct format for SEPA_DIRECT_DEBIT', () => {
    const ref = PaymentReference.generate(PaymentMethod.SEPA_DIRECT_DEBIT, 2025, 7);
    expect(ref.value).toBe('SEPA-2025-00007');
  });

  it('should generate reference with correct format for CARD_TPV', () => {
    const ref = PaymentReference.generate(PaymentMethod.CARD_TPV, 2025, 99999);
    expect(ref.value).toBe('TPV-2025-99999');
  });

  it('should pad sequence to 5 digits', () => {
    const ref = PaymentReference.generate(PaymentMethod.CASH, 2025, 1);
    expect(ref.value).toBe('EF-2025-00001');
  });

  it('should create from valid string', () => {
    const ref = PaymentReference.fromString('EF-2025-00042');
    expect(ref.value).toBe('EF-2025-00042');
  });

  it('should throw error for empty string', () => {
    expect(() => PaymentReference.fromString('')).toThrow('no puede estar vacía');
  });

  it('should throw error for whitespace-only string', () => {
    expect(() => PaymentReference.fromString('   ')).toThrow('no puede estar vacía');
  });

  it('should compare equal for same value', () => {
    const ref1 = PaymentReference.generate(PaymentMethod.CASH, 2025, 42);
    const ref2 = PaymentReference.fromString('EF-2025-00042');
    expect(ref1.equals(ref2)).toBe(true);
  });
});

// =============================================================================
// PaymentStatus
// =============================================================================

describe('PaymentStatus', () => {
  it.each([
    ['CONFIRMED', PaymentStatus.CONFIRMED],
    ['ANNULLED', PaymentStatus.ANNULLED],
  ])('should have %s value', (expected, status) => {
    expect(status.value).toBe(expected);
  });

  it.each([
    ['CONFIRMED', PaymentStatus.CONFIRMED],
    ['ANNULLED', PaymentStatus.ANNULLED],
  ])('should create from valid string "%s"', (value, singleton) => {
    const status = PaymentStatus.fromString(value);
    expect(status.equals(singleton)).toBe(true);
  });

  it('should throw error for invalid string', () => {
    expect(() => PaymentStatus.fromString('INVALID')).toThrow('Estado de pago inválido');
  });

  it('should compare equal for same status', () => {
    expect(PaymentStatus.CONFIRMED.equals(PaymentStatus.CONFIRMED)).toBe(true);
  });

  it('should compare not equal for different statuses', () => {
    expect(PaymentStatus.CONFIRMED.equals(PaymentStatus.ANNULLED)).toBe(false);
  });
});

// =============================================================================
// ReceiptNumber
// =============================================================================

describe('ReceiptNumber', () => {
  it('should generate receipt number with correct format', () => {
    const receipt = ReceiptNumber.generate(2025, 42);
    expect(receipt.value).toBe('REC-2025-00042');
  });

  it('should pad sequence to 5 digits', () => {
    const receipt = ReceiptNumber.generate(2025, 1);
    expect(receipt.value).toBe('REC-2025-00001');
  });

  it('should handle large sequence numbers', () => {
    const receipt = ReceiptNumber.generate(2025, 99999);
    expect(receipt.value).toBe('REC-2025-99999');
  });

  it('should create from valid string', () => {
    const receipt = ReceiptNumber.fromString('REC-2025-00042');
    expect(receipt.value).toBe('REC-2025-00042');
  });

  it('should throw error for empty string', () => {
    expect(() => ReceiptNumber.fromString('')).toThrow('no puede estar vacío');
  });

  it('should throw error for whitespace-only string', () => {
    expect(() => ReceiptNumber.fromString('   ')).toThrow('no puede estar vacío');
  });

  it('should compare equal for same value', () => {
    const r1 = ReceiptNumber.generate(2025, 42);
    const r2 = ReceiptNumber.fromString('REC-2025-00042');
    expect(r1.equals(r2)).toBe(true);
  });
});
