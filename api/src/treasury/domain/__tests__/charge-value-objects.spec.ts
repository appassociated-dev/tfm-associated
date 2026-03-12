import { describe, it, expect } from 'vitest';
import { ChargeId } from '../value-objects/charge-id';
import { ChargeStatus } from '../value-objects/charge-status';
import { ChargeDescription } from '../value-objects/charge-description';
import { Money } from '../value-objects/money';

// =============================================================================
// ChargeId
// =============================================================================

describe('ChargeId', () => {
  it('should create a new ChargeId with a valid UUID v4', () => {
    const id = ChargeId.create();

    expect(id.toValue()).toBeDefined();
    expect(id.toValue()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should create two different ChargeIds', () => {
    const id1 = ChargeId.create();
    const id2 = ChargeId.create();

    expect(id1.equals(id2)).toBe(false);
  });

  it('should create from a valid UUID string', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const id = ChargeId.fromString(uuid);

    expect(id.toValue()).toBe(uuid);
  });

  it('should throw error for invalid UUID string', () => {
    expect(() => ChargeId.fromString('not-a-uuid')).toThrow();
  });

  it('should compare equal for same UUID', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const id1 = ChargeId.fromString(uuid);
    const id2 = ChargeId.fromString(uuid);

    expect(id1.equals(id2)).toBe(true);
  });
});

// =============================================================================
// ChargeStatus
// =============================================================================

describe('ChargeStatus', () => {
  it('should have PENDING status', () => {
    expect(ChargeStatus.PENDING.value).toBe('PENDING');
  });

  it('should have PAID status', () => {
    expect(ChargeStatus.PAID.value).toBe('PAID');
  });

  it('should have PARTIALLY_PAID status', () => {
    expect(ChargeStatus.PARTIALLY_PAID.value).toBe('PARTIALLY_PAID');
  });

  it('should have RETURNED status', () => {
    expect(ChargeStatus.RETURNED.value).toBe('RETURNED');
  });

  it('should have CANCELLED status', () => {
    expect(ChargeStatus.CANCELLED.value).toBe('CANCELLED');
  });

  it('should create from valid string "PENDING"', () => {
    const status = ChargeStatus.fromString('PENDING');
    expect(status.equals(ChargeStatus.PENDING)).toBe(true);
  });

  it('should create from valid string "PAID"', () => {
    const status = ChargeStatus.fromString('PAID');
    expect(status.equals(ChargeStatus.PAID)).toBe(true);
  });

  it('should create from valid string "PARTIALLY_PAID"', () => {
    const status = ChargeStatus.fromString('PARTIALLY_PAID');
    expect(status.equals(ChargeStatus.PARTIALLY_PAID)).toBe(true);
  });

  it('should create from valid string "RETURNED"', () => {
    const status = ChargeStatus.fromString('RETURNED');
    expect(status.equals(ChargeStatus.RETURNED)).toBe(true);
  });

  it('should create from valid string "CANCELLED"', () => {
    const status = ChargeStatus.fromString('CANCELLED');
    expect(status.equals(ChargeStatus.CANCELLED)).toBe(true);
  });

  it('should throw error for invalid string', () => {
    expect(() => ChargeStatus.fromString('INVALID')).toThrow(/Estado de cargo inválido/);
  });

  it('should throw error for empty string', () => {
    expect(() => ChargeStatus.fromString('')).toThrow(/Estado de cargo inválido/);
  });

  it('should compare equal for same status', () => {
    expect(ChargeStatus.PENDING.equals(ChargeStatus.PENDING)).toBe(true);
  });

  it('should compare not equal for different statuses', () => {
    expect(ChargeStatus.PENDING.equals(ChargeStatus.PAID)).toBe(false);
  });

  it('should compare not equal with undefined', () => {
    expect(ChargeStatus.PENDING.equals(undefined)).toBe(false);
  });
});

// =============================================================================
// ChargeDescription
// =============================================================================

describe('ChargeDescription', () => {
  it('should create with valid description and no fiscal year', () => {
    const result = ChargeDescription.create('Cuota mensual enero 2025');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.description).toBe('Cuota mensual enero 2025');
      expect(result.value.fiscalYearId).toBeNull();
    }
  });

  it('should create with valid description and fiscal year ID', () => {
    const fiscalYearId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const result = ChargeDescription.create('Cuota trimestral Q1', fiscalYearId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.description).toBe('Cuota trimestral Q1');
      expect(result.value.fiscalYearId).toBe(fiscalYearId);
    }
  });

  it('should trim whitespace from description', () => {
    const result = ChargeDescription.create('  Cuota con espacios  ');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.description).toBe('Cuota con espacios');
    }
  });

  it('should reject empty description', () => {
    const result = ChargeDescription.create('');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('no puede estar vacía');
    }
  });

  it('should reject whitespace-only description', () => {
    const result = ChargeDescription.create('   ');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('no puede estar vacía');
    }
  });

  it('should reject description exceeding 255 characters', () => {
    const longDesc = 'a'.repeat(256);
    const result = ChargeDescription.create(longDesc);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('255 caracteres');
    }
  });

  it('should accept description of exactly 255 characters', () => {
    const desc = 'a'.repeat(255);
    const result = ChargeDescription.create(desc);

    expect(result.ok).toBe(true);
  });

  it('should treat null fiscalYearId as null', () => {
    const result = ChargeDescription.create('Test', null);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fiscalYearId).toBeNull();
    }
  });
});

// =============================================================================
// Money — nuevos métodos (divide, zero, multiplyDecimal, comparaciones)
// =============================================================================

describe('Money — divide()', () => {
  it('should divide 12000 cents by 12 = 1000 cents', () => {
    const moneyResult = Money.create(12000);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    const divideResult = moneyResult.value.divide(12);
    expect(divideResult.ok).toBe(true);
    if (divideResult.ok) {
      expect(divideResult.value.amount).toBe(1000);
    }
  });

  it('should round to nearest cent (10000 / 3 = 3333)', () => {
    const moneyResult = Money.create(10000);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    const divideResult = moneyResult.value.divide(3);
    expect(divideResult.ok).toBe(true);
    if (divideResult.ok) {
      expect(divideResult.value.amount).toBe(3333);
    }
  });

  it('should round up when fraction >= 0.5 (10001 / 3 ≈ 3333.67 → 3334)', () => {
    const moneyResult = Money.create(10001);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    const divideResult = moneyResult.value.divide(3);
    expect(divideResult.ok).toBe(true);
    if (divideResult.ok) {
      expect(divideResult.value.amount).toBe(3334);
    }
  });

  it('should reject division by zero', () => {
    const moneyResult = Money.create(1000);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    const divideResult = moneyResult.value.divide(0);
    expect(divideResult.ok).toBe(false);
    if (!divideResult.ok) {
      expect(divideResult.error.message).toContain('cero');
    }
  });

  it('should reject negative divisor', () => {
    const moneyResult = Money.create(1000);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    const divideResult = moneyResult.value.divide(-2);
    expect(divideResult.ok).toBe(false);
  });

  it('should preserve currency when dividing', () => {
    const moneyResult = Money.create(12000, 'USD');
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    const divideResult = moneyResult.value.divide(4);
    expect(divideResult.ok).toBe(true);
    if (divideResult.ok) {
      expect(divideResult.value.currency).toBe('USD');
      expect(divideResult.value.amount).toBe(3000);
    }
  });
});

describe('Money — zero()', () => {
  it('should create zero EUR by default', () => {
    const money = Money.zero();

    expect(money.amount).toBe(0);
    expect(money.currency).toBe('EUR');
  });

  it('should create zero with specified currency', () => {
    const money = Money.zero('USD');

    expect(money.amount).toBe(0);
    expect(money.currency).toBe('USD');
  });
});

describe('Money — multiplyDecimal()', () => {
  it('should multiply 12000 by 0.5 = 6000', () => {
    const moneyResult = Money.create(12000);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    const result = moneyResult.value.multiplyDecimal(0.5);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount).toBe(6000);
    }
  });

  it('should handle prorata calculation: (12000 / 12) * 6 via multiplyDecimal', () => {
    const moneyResult = Money.create(12000);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    // Simular prorrateo: annualAmount * (remainingMonths / 12)
    const result = moneyResult.value.multiplyDecimal(6 / 12);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount).toBe(6000);
    }
  });

  it('should round to nearest cent for non-exact results', () => {
    const moneyResult = Money.create(10000);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    // 10000 * (1/3) = 3333.33... → 3333
    const result = moneyResult.value.multiplyDecimal(1 / 3);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount).toBe(3333);
    }
  });

  it('should reject negative factor', () => {
    const moneyResult = Money.create(1000);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    const result = moneyResult.value.multiplyDecimal(-0.5);
    expect(result.ok).toBe(false);
  });

  it('should allow factor of 0', () => {
    const moneyResult = Money.create(1000);
    expect(moneyResult.ok).toBe(true);
    if (!moneyResult.ok) return;

    const result = moneyResult.value.multiplyDecimal(0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount).toBe(0);
    }
  });
});

describe('Money — isGreaterThan() / isGreaterThanOrEqual()', () => {
  it('should return true when amount is greater', () => {
    const a = Money.create(2000);
    const b = Money.create(1000);
    if (!a.ok || !b.ok) throw new Error('setup error');

    expect(a.value.isGreaterThan(b.value)).toBe(true);
  });

  it('should return false when amount is less', () => {
    const a = Money.create(1000);
    const b = Money.create(2000);
    if (!a.ok || !b.ok) throw new Error('setup error');

    expect(a.value.isGreaterThan(b.value)).toBe(false);
  });

  it('should return false when amounts are equal (isGreaterThan)', () => {
    const a = Money.create(1000);
    const b = Money.create(1000);
    if (!a.ok || !b.ok) throw new Error('setup error');

    expect(a.value.isGreaterThan(b.value)).toBe(false);
  });

  it('should return true when amounts are equal (isGreaterThanOrEqual)', () => {
    const a = Money.create(1000);
    const b = Money.create(1000);
    if (!a.ok || !b.ok) throw new Error('setup error');

    expect(a.value.isGreaterThanOrEqual(b.value)).toBe(true);
  });

  it('should throw when comparing different currencies', () => {
    const a = Money.create(1000, 'EUR');
    const b = Money.create(1000, 'USD');
    if (!a.ok || !b.ok) throw new Error('setup error');

    expect(() => a.value.isGreaterThan(b.value)).toThrow(/distintas divisas/);
  });
});
