import { describe, it, expect } from 'vitest';
import { PaymentId } from '../value-objects/payment-id';
import { PaymentMethod } from '../value-objects/payment-method';
import { PaymentReference } from '../value-objects/payment-reference';
import { PaymentStatus } from '../value-objects/payment-status';
import { ReceiptNumber } from '../value-objects/receipt-number';

// =============================================================================
// PaymentId
// =============================================================================

describe('PaymentId', () => {
  it('should create a new PaymentId with a valid UUID v4', () => {
    const id = PaymentId.create();

    expect(id.toValue()).toBeDefined();
    expect(id.toValue()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should create two different PaymentIds', () => {
    const id1 = PaymentId.create();
    const id2 = PaymentId.create();

    expect(id1.equals(id2)).toBe(false);
  });

  it('should create from a valid UUID string', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const id = PaymentId.fromString(uuid);

    expect(id.toValue()).toBe(uuid);
  });

  it('should throw error for invalid UUID string', () => {
    expect(() => PaymentId.fromString('not-a-uuid')).toThrow();
  });

  it('should compare equal for same UUID', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const id1 = PaymentId.fromString(uuid);
    const id2 = PaymentId.fromString(uuid);

    expect(id1.equals(id2)).toBe(true);
  });
});

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
    it('should return EF for CASH', () => {
      expect(PaymentMethod.toPrefix(PaymentMethod.CASH)).toBe('EF');
    });

    it('should return TR for TRANSFER', () => {
      expect(PaymentMethod.toPrefix(PaymentMethod.TRANSFER)).toBe('TR');
    });

    it('should return BZ for BIZUM', () => {
      expect(PaymentMethod.toPrefix(PaymentMethod.BIZUM)).toBe('BZ');
    });

    it('should return SEPA for SEPA_DIRECT_DEBIT', () => {
      expect(PaymentMethod.toPrefix(PaymentMethod.SEPA_DIRECT_DEBIT)).toBe('SEPA');
    });

    it('should return TPV for CARD_TPV', () => {
      expect(PaymentMethod.toPrefix(PaymentMethod.CARD_TPV)).toBe('TPV');
    });
  });

  describe('toLabel()', () => {
    it('should return Efectivo for CASH', () => {
      expect(PaymentMethod.toLabel(PaymentMethod.CASH)).toBe('Efectivo');
    });

    it('should return Transferencia bancaria for TRANSFER', () => {
      expect(PaymentMethod.toLabel(PaymentMethod.TRANSFER)).toBe('Transferencia bancaria');
    });

    it('should return Bizum for BIZUM', () => {
      expect(PaymentMethod.toLabel(PaymentMethod.BIZUM)).toBe('Bizum');
    });

    it('should return Domiciliación SEPA for SEPA_DIRECT_DEBIT', () => {
      expect(PaymentMethod.toLabel(PaymentMethod.SEPA_DIRECT_DEBIT)).toBe('Domiciliación SEPA');
    });

    it('should return Tarjeta (TPV) for CARD_TPV', () => {
      expect(PaymentMethod.toLabel(PaymentMethod.CARD_TPV)).toBe('Tarjeta (TPV)');
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
  it('should have CONFIRMED and ANNULLED values', () => {
    expect(PaymentStatus.CONFIRMED.value).toBe('CONFIRMED');
    expect(PaymentStatus.ANNULLED.value).toBe('ANNULLED');
  });

  it('should create from valid string CONFIRMED', () => {
    const status = PaymentStatus.fromString('CONFIRMED');
    expect(status.equals(PaymentStatus.CONFIRMED)).toBe(true);
  });

  it('should create from valid string ANNULLED', () => {
    const status = PaymentStatus.fromString('ANNULLED');
    expect(status.equals(PaymentStatus.ANNULLED)).toBe(true);
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
