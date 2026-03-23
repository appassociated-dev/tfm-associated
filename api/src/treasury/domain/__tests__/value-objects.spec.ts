import { describe, it, expect } from 'vitest';
import { FeePlanCode } from '../value-objects/fee-plan-code';
import { Money } from '../value-objects/money';
import { BillingMonths } from '../value-objects/billing-months';

// =============================================================================
// FeePlanCode
// =============================================================================

describe('FeePlanCode', () => {
  it('should create a valid code (ABC-123)', () => {
    const result = FeePlanCode.create('ABC-123');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('ABC-123');
    }
  });

  it('should normalize to uppercase', () => {
    const result = FeePlanCode.create('abc-123');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('ABC-123');
    }
  });

  it('should accept underscores and hyphens', () => {
    const result = FeePlanCode.create('FEE_PLAN-01');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('FEE_PLAN-01');
    }
  });

  it('should reject invalid characters (!@#)', () => {
    const result = FeePlanCode.create('AB!@#');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('FeePlanCodeInvalidError');
    }
  });

  it('should reject too short code (1 character)', () => {
    const result = FeePlanCode.create('A');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('FeePlanCodeInvalidError');
    }
  });

  it('should reject too long code (more than 20 characters)', () => {
    const result = FeePlanCode.create('A'.repeat(21));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('FeePlanCodeInvalidError');
    }
  });

  it('should reject empty string', () => {
    const result = FeePlanCode.create('');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('FeePlanCodeInvalidError');
    }
  });

  it('should accept exactly 2 characters (minimum)', () => {
    const result = FeePlanCode.create('AB');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('AB');
    }
  });

  it('should accept exactly 20 characters (maximum)', () => {
    const result = FeePlanCode.create('A'.repeat(20));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('A'.repeat(20));
    }
  });
});

// =============================================================================
// Money
// =============================================================================

describe('Money', () => {
  it('should create valid Money (1500 cents, EUR)', () => {
    const result = Money.create(1500, 'EUR');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount).toBe(1500);
      expect(result.value.currency).toBe('EUR');
    }
  });

  it('should accept zero amount', () => {
    const result = Money.create(0, 'EUR');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.amount).toBe(0);
    }
  });

  it('should default currency to EUR', () => {
    const result = Money.create(100);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.currency).toBe('EUR');
    }
  });

  it('should reject negative amount', () => {
    const result = Money.create(-1, 'EUR');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('MoneyInvalidError');
    }
  });

  it('should reject non-integer amount', () => {
    const result = Money.create(10.5, 'EUR');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('MoneyInvalidError');
    }
  });

  it('should reject invalid currency code', () => {
    const result = Money.create(100, 'EURO');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('MoneyInvalidError');
    }
  });

  it('should convert to units (1500 cents -> 15.00)', () => {
    const result = Money.create(1500, 'EUR');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.toUnits()).toBe(15.0);
    }
  });

  it('should add two Money of same currency', () => {
    const money1Result = Money.create(1000, 'EUR');
    const money2Result = Money.create(500, 'EUR');

    expect(money1Result.ok).toBe(true);
    expect(money2Result.ok).toBe(true);
    if (money1Result.ok && money2Result.ok) {
      const addResult = money1Result.value.add(money2Result.value);

      expect(addResult.ok).toBe(true);
      if (addResult.ok) {
        expect(addResult.value.amount).toBe(1500);
        expect(addResult.value.currency).toBe('EUR');
      }
    }
  });

  it('should reject adding Money of different currencies', () => {
    const money1Result = Money.create(1000, 'EUR');
    const money2Result = Money.create(500, 'USD');

    expect(money1Result.ok).toBe(true);
    expect(money2Result.ok).toBe(true);
    if (money1Result.ok && money2Result.ok) {
      const addResult = money1Result.value.add(money2Result.value);

      expect(addResult.ok).toBe(false);
    }
  });

  it('should subtract two Money of same currency', () => {
    const money1Result = Money.create(1000, 'EUR');
    const money2Result = Money.create(300, 'EUR');

    expect(money1Result.ok).toBe(true);
    expect(money2Result.ok).toBe(true);
    if (money1Result.ok && money2Result.ok) {
      const subResult = money1Result.value.subtract(money2Result.value);

      expect(subResult.ok).toBe(true);
      if (subResult.ok) {
        expect(subResult.value.amount).toBe(700);
      }
    }
  });

  it('should reject subtraction resulting in negative', () => {
    const money1Result = Money.create(100, 'EUR');
    const money2Result = Money.create(500, 'EUR');

    expect(money1Result.ok).toBe(true);
    expect(money2Result.ok).toBe(true);
    if (money1Result.ok && money2Result.ok) {
      const subResult = money1Result.value.subtract(money2Result.value);

      expect(subResult.ok).toBe(false);
    }
  });

  it('should multiply by integer factor', () => {
    const moneyResult = Money.create(500, 'EUR');

    expect(moneyResult.ok).toBe(true);
    if (moneyResult.ok) {
      const mulResult = moneyResult.value.multiply(3);

      expect(mulResult.ok).toBe(true);
      if (mulResult.ok) {
        expect(mulResult.value.amount).toBe(1500);
      }
    }
  });

  it('should reject multiplication by negative factor', () => {
    const moneyResult = Money.create(500, 'EUR');

    expect(moneyResult.ok).toBe(true);
    if (moneyResult.ok) {
      const mulResult = moneyResult.value.multiply(-1);

      expect(mulResult.ok).toBe(false);
    }
  });

  it('should allow multiplication by zero', () => {
    const moneyResult = Money.create(500, 'EUR');

    expect(moneyResult.ok).toBe(true);
    if (moneyResult.ok) {
      const mulResult = moneyResult.value.multiply(0);

      expect(mulResult.ok).toBe(true);
      if (mulResult.ok) {
        expect(mulResult.value.amount).toBe(0);
      }
    }
  });
});

// =============================================================================
// BillingMonths
// =============================================================================

describe('BillingMonths', () => {
  it('should create valid billing months ([1, 3, 6, 12])', () => {
    const result = BillingMonths.create([1, 3, 6, 12]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect([...result.value.months]).toEqual([1, 3, 6, 12]);
    }
  });

  it('should sort months automatically', () => {
    const result = BillingMonths.create([12, 1, 6, 3]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect([...result.value.months]).toEqual([1, 3, 6, 12]);
    }
  });

  it('should reject duplicate months', () => {
    const result = BillingMonths.create([1, 1, 3]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('BillingMonthsInvalidError');
    }
  });

  it('should reject month 0 (out of range)', () => {
    const result = BillingMonths.create([0, 1, 2]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('BillingMonthsInvalidError');
    }
  });

  it('should reject month 13 (out of range)', () => {
    const result = BillingMonths.create([1, 13]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('BillingMonthsInvalidError');
    }
  });

  it('should check includesMonth correctly', () => {
    const result = BillingMonths.create([1, 6, 12]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.includesMonth(1)).toBe(true);
      expect(result.value.includesMonth(6)).toBe(true);
      expect(result.value.includesMonth(3)).toBe(false);
    }
  });

  it('should create empty BillingMonths via static empty()', () => {
    const billing = BillingMonths.empty();

    expect(billing.isEmpty()).toBe(true);
    expect([...billing.months]).toEqual([]);
  });

  it('should report isEmpty correctly', () => {
    const emptyResult = BillingMonths.create([]);

    expect(emptyResult.ok).toBe(true);
    if (emptyResult.ok) {
      expect(emptyResult.value.isEmpty()).toBe(true);
    }

    const nonEmptyResult = BillingMonths.create([1]);

    expect(nonEmptyResult.ok).toBe(true);
    if (nonEmptyResult.ok) {
      expect(nonEmptyResult.value.isEmpty()).toBe(false);
    }
  });
});
