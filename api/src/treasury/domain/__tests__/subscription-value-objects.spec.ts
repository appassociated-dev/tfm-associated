import { describe, it, expect } from 'vitest';
import { Discount } from '../value-objects/discount';
import { SubscriptionCancelReason } from '../value-objects/subscription-cancel-reason';
import { MemberAccountId } from '../value-objects/member-account-id';
import { SubscriptionId } from '../value-objects/subscription-id';
import { Money } from '../value-objects/money';

// =============================================================================
// Discount
// =============================================================================

describe('Discount', () => {
  // --- Creación válida ---

  it('should create with both discounts at zero (0, 0)', () => {
    const result = Discount.create(0, 0);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.typeDiscount).toBe(0);
      expect(result.value.personalDiscount).toBe(0);
    }
  });

  it('should create with valid type discount (0.30, 0)', () => {
    const result = Discount.create(0.3, 0);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.typeDiscount).toBe(0.3);
      expect(result.value.personalDiscount).toBe(0);
    }
  });

  it('should create with valid personal discount (0, 0.10)', () => {
    const result = Discount.create(0, 0.1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.personalDiscount).toBe(0.1);
    }
  });

  it('should create with both valid discounts (0.30, 0.10)', () => {
    const result = Discount.create(0.3, 0.1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.typeDiscount).toBe(0.3);
      expect(result.value.personalDiscount).toBe(0.1);
    }
  });

  // --- Validación de rangos ---

  it('should reject negative typeDiscount', () => {
    const result = Discount.create(-0.01, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('DiscountInvalidError');
    }
  });

  it('should reject typeDiscount greater than 0.99 (value 1.0)', () => {
    const result = Discount.create(1.0, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('DiscountInvalidError');
    }
  });

  it('should reject negative personalDiscount', () => {
    const result = Discount.create(0, -0.05);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('DiscountInvalidError');
    }
  });

  it('should reject personalDiscount greater than 0.99', () => {
    const result = Discount.create(0, 1.0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('DiscountInvalidError');
    }
  });

  it('should reject combined discount >= 99% (0.95, 0.95)', () => {
    // Tasa efectiva = 1 - (1-0.95)*(1-0.95) = 1 - 0.05*0.05 = 1 - 0.0025 = 0.9975 >= 0.99
    const result = Discount.create(0.95, 0.95);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('DiscountInvalidError');
    }
  });

  // --- calculateEffectiveAmount ---

  it('should calculate effective amount with multiplicative formula (12000 * 0.70 * 0.90 = 7560)', () => {
    const discountResult = Discount.create(0.3, 0.1);
    const moneyResult = Money.create(12000);

    expect(discountResult.ok).toBe(true);
    expect(moneyResult.ok).toBe(true);
    if (discountResult.ok && moneyResult.ok) {
      const effective = discountResult.value.calculateEffectiveAmount(moneyResult.value);
      // Fórmula multiplicativa: 12000 * (1-0.30) * (1-0.10) = 12000 * 0.70 * 0.90 = 7560
      expect(effective.amount).toBe(7560);
    }
  });

  it('should NOT produce additive result (12000 * (1-0.30-0.10) = 7200 is WRONG)', () => {
    const discountResult = Discount.create(0.3, 0.1);
    const moneyResult = Money.create(12000);

    expect(discountResult.ok).toBe(true);
    expect(moneyResult.ok).toBe(true);
    if (discountResult.ok && moneyResult.ok) {
      const effective = discountResult.value.calculateEffectiveAmount(moneyResult.value);
      // El resultado aditivo sería 7200, pero el correcto multiplicativo es 7560
      expect(effective.amount).not.toBe(7200);
      expect(effective.amount).toBe(7560);
    }
  });

  it('should return unchanged amount with zero discount', () => {
    const discountResult = Discount.create(0, 0);
    const moneyResult = Money.create(10000);

    expect(discountResult.ok).toBe(true);
    expect(moneyResult.ok).toBe(true);
    if (discountResult.ok && moneyResult.ok) {
      const effective = discountResult.value.calculateEffectiveAmount(moneyResult.value);
      expect(effective.amount).toBe(10000);
    }
  });

  it('should round correctly with 33.33% type discount (10000 * 0.6667 = 6667)', () => {
    const discountResult = Discount.create(0.3333, 0);
    const moneyResult = Money.create(10000);

    expect(discountResult.ok).toBe(true);
    expect(moneyResult.ok).toBe(true);
    if (discountResult.ok && moneyResult.ok) {
      const effective = discountResult.value.calculateEffectiveAmount(moneyResult.value);
      // Math.round(10000 * (1 - 0.3333) * 1) = Math.round(10000 * 0.6667) = Math.round(6667) = 6667
      expect(effective.amount).toBe(6667);
    }
  });

  // --- totalEffectiveRate ---

  it('should calculate total effective rate correctly', () => {
    const result = Discount.create(0.3, 0.1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Tasa efectiva = 1 - (1-0.30)*(1-0.10) = 1 - 0.70*0.90 = 1 - 0.63 = 0.37
      const rate = result.value.totalEffectiveRate();
      expect(rate).toBeCloseTo(0.37, 10);
    }
  });
});

// =============================================================================
// SubscriptionCancelReason
// =============================================================================

describe('SubscriptionCancelReason', () => {
  it('should create PLAN_CHANGE from string', () => {
    const reason = SubscriptionCancelReason.fromString('PLAN_CHANGE');
    expect(reason.value).toBe('PLAN_CHANGE');
    expect(reason.equals(SubscriptionCancelReason.PLAN_CHANGE)).toBe(true);
  });

  it('should create MEMBER_LEAVE from string', () => {
    const reason = SubscriptionCancelReason.fromString('MEMBER_LEAVE');
    expect(reason.value).toBe('MEMBER_LEAVE');
    expect(reason.equals(SubscriptionCancelReason.MEMBER_LEAVE)).toBe(true);
  });

  it('should create EXEMPTION from string', () => {
    const reason = SubscriptionCancelReason.fromString('EXEMPTION');
    expect(reason.value).toBe('EXEMPTION');
    expect(reason.equals(SubscriptionCancelReason.EXEMPTION)).toBe(true);
  });

  it('should create ONE_TIME_COMPLETED from string', () => {
    const reason = SubscriptionCancelReason.fromString('ONE_TIME_COMPLETED');
    expect(reason.value).toBe('ONE_TIME_COMPLETED');
    expect(reason.equals(SubscriptionCancelReason.ONE_TIME_COMPLETED)).toBe(true);
  });

  it('should throw error for invalid value', () => {
    expect(() => SubscriptionCancelReason.fromString('INVALID_REASON')).toThrow(
      'Motivo de cancelación inválido',
    );
  });
});

// =============================================================================
// MemberAccountId
// =============================================================================

describe('MemberAccountId', () => {
  it('should create a valid UUID via create()', () => {
    const id = MemberAccountId.create();
    // Verificar que el valor es un UUID v4 válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id.toValue()).toMatch(uuidRegex);
  });

  it('should create from valid UUID string via fromString()', () => {
    const uuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const id = MemberAccountId.fromString(uuid);
    expect(id.toValue()).toBe(uuid);
  });

  it('should throw error for invalid UUID string', () => {
    expect(() => MemberAccountId.fromString('not-a-uuid')).toThrow('Identificador inválido');
  });
});

// =============================================================================
// SubscriptionId
// =============================================================================

describe('SubscriptionId', () => {
  it('should create a valid UUID via create()', () => {
    const id = SubscriptionId.create();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id.toValue()).toMatch(uuidRegex);
  });

  it('should create from valid UUID string via fromString()', () => {
    const uuid = 'b1ffcd00-1d1c-4ef8-bb6d-7cc0ce491b22';
    const id = SubscriptionId.fromString(uuid);
    expect(id.toValue()).toBe(uuid);
  });

  it('should throw error for invalid UUID string', () => {
    expect(() => SubscriptionId.fromString('invalid')).toThrow('Identificador inválido');
  });
});
