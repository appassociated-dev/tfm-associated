import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';

import {
  feeSubscriptionSchema,
  cancelReasonSchema,
  effectiveDateTypeSchema,
  createSubscriptionInputSchema,
  changePlanInputSchema,
  updateDiscountInputSchema,
  memberSubscriptionsResponseSchema,
} from './subscription.schemas';

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';
const VALID_UUID_3 = '770e8400-e29b-41d4-a716-446655440002';

// Fixture alineado con SubscriptionResponseDto (REQ-ZOD-001)
const validSubscription = {
  id: VALID_UUID,
  feePlanId: VALID_UUID_2,
  feePlanName: 'Cuota Anual',
  feePlanCode: 'CUOTA-ANUAL',
  typeDiscount: 0.3,
  personalDiscount: 0.1,
  personalDiscountReason: 'Socio fundador',
  effectiveAmount: 7560,
  effectiveAmountFormatted: '75.60 EUR',
  isActive: true,
  registrationDate: '2026-01-01T00:00:00.000Z',
  leaveDate: null,
  cancelReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const validCreateInput = {
  feePlanId: VALID_UUID,
  personalDiscount: 0.1,
  personalDiscountReason: 'Descuento especial',
};

const validChangePlanInput = {
  newFeePlanId: VALID_UUID_2,
  effectiveDate: '2026-06-01T00:00:00.000Z',
  effectiveDateType: 'NEXT_MONTH' as const,
  keepPendingCharges: false,
};

const validUpdateDiscountInput = {
  personalDiscount: 0.15,
  reason: 'Socio veterano con mas de 10 anos',
  approvedBy: 'Juan Perez, tesorero',
};

// === Tests ===

describe('cancelReasonSchema', () => {
  it.each(['PLAN_CHANGE', 'MEMBER_LEAVE', 'EXEMPTION', 'ONE_TIME_COMPLETED'])(
    'deberia aceptar valor valido: %s',
    (value) => {
      const result = cancelReasonSchema.parse(value);
      expect(result).toBe(value);
    },
  );

  it('deberia rechazar valor invalido', () => {
    expect(() => cancelReasonSchema.parse('INVALID')).toThrow(ZodError);
  });
});

describe('effectiveDateTypeSchema', () => {
  it.each(['IMMEDIATE', 'NEXT_MONTH', 'NEXT_FISCAL_YEAR'])(
    'deberia aceptar valor valido: %s',
    (value) => {
      const result = effectiveDateTypeSchema.parse(value);
      expect(result).toBe(value);
    },
  );

  it('deberia rechazar valor invalido', () => {
    expect(() => effectiveDateTypeSchema.parse('NEXT_WEEK')).toThrow(ZodError);
  });
});

describe('feeSubscriptionSchema', () => {
  it('deberia aceptar shape del DTO real (REQ-ZOD-001)', () => {
    // Fixture alineado con SubscriptionResponseDto
    const result = feeSubscriptionSchema.parse(validSubscription);

    expect(result.id).toBe(VALID_UUID);
    expect(result.feePlanName).toBe('Cuota Anual');
    expect(result.effectiveAmountFormatted).toBe('75.60 EUR');
    expect(result.isActive).toBe(true);
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('deberia rechazar suscripcion sin effectiveAmountFormatted', () => {
    const invalid = { ...validSubscription };
    delete (invalid as Record<string, unknown>).effectiveAmountFormatted;

    expect(() => feeSubscriptionSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar suscripcion sin isActive', () => {
    const invalid = { ...validSubscription };
    delete (invalid as Record<string, unknown>).isActive;

    expect(() => feeSubscriptionSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar suscripcion sin campos obligatorios', () => {
    const invalid = { id: VALID_UUID };

    expect(() => feeSubscriptionSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia aceptar feePlanName ausente (opcional en DTO)', () => {
    // feePlanName es @ApiPropertyOptional en DTO
    const withoutName = { ...validSubscription };
    delete (withoutName as Record<string, unknown>).feePlanName;
    const result = feeSubscriptionSchema.parse(withoutName);

    expect(result.feePlanName).toBeUndefined();
  });

  it('deberia aceptar feePlanCode ausente (opcional en DTO)', () => {
    // feePlanCode es @ApiPropertyOptional en DTO
    const withoutCode = { ...validSubscription };
    delete (withoutCode as Record<string, unknown>).feePlanCode;
    const result = feeSubscriptionSchema.parse(withoutCode);

    expect(result.feePlanCode).toBeUndefined();
  });

  it('deberia aceptar leaveDate nullable', () => {
    const withLeave = {
      ...validSubscription,
      leaveDate: '2026-12-31T23:59:59.000Z',
    };
    const result = feeSubscriptionSchema.parse(withLeave);

    expect(result.leaveDate).toBe('2026-12-31T23:59:59.000Z');
  });

  it('deberia aceptar cancelReason nullable', () => {
    const withReason = { ...validSubscription, cancelReason: 'PLAN_CHANGE' };
    const result = feeSubscriptionSchema.parse(withReason);

    expect(result.cancelReason).toBe('PLAN_CHANGE');
  });

  it('deberia rechazar typeDiscount mayor a 1', () => {
    const invalid = { ...validSubscription, typeDiscount: 1.5 };

    expect(() => feeSubscriptionSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia aceptar suscripcion con pendingChargesCount presente', () => {
    const withPending = { ...validSubscription, pendingChargesCount: 3 };
    const result = feeSubscriptionSchema.parse(withPending);

    expect(result.pendingChargesCount).toBe(3);
  });

  it('deberia aceptar suscripcion sin pendingChargesCount (backward compat)', () => {
    // validSubscription no incluye pendingChargesCount — campo opcional para compatibilidad
    const result = feeSubscriptionSchema.parse(validSubscription);

    expect(result.pendingChargesCount).toBeUndefined();
  });

  it('deberia silenciosamente ignorar campos fantasma del schema anterior (strip)', () => {
    // Zod 4 strip mode — campos no declarados se eliminan, no se rechazan
    const withPhantom = {
      ...validSubscription,
      feePlanType: 'RECURRING',
      baseAmount: 12000,
      chargesGenerated: 3,
      totalCollected: 36000,
    };
    const result = feeSubscriptionSchema.safeParse(withPhantom);

    // Parse debe tener exito (Zod 4 strip, no strict)
    expect(result.success).toBe(true);
    if (result.success) {
      // Los campos fantasma no deben aparecer en el resultado
      expect((result.data as Record<string, unknown>).feePlanType).toBeUndefined();
      expect((result.data as Record<string, unknown>).baseAmount).toBeUndefined();
      expect((result.data as Record<string, unknown>).chargesGenerated).toBeUndefined();
      expect((result.data as Record<string, unknown>).totalCollected).toBeUndefined();
    }
  });
});

describe('createSubscriptionInputSchema', () => {
  it('deberia aceptar datos validos de creacion', () => {
    const result = createSubscriptionInputSchema.parse(validCreateInput);

    expect(result.feePlanId).toBe(VALID_UUID);
    expect(result.personalDiscount).toBe(0.1);
    expect(result.personalDiscountReason).toBe('Descuento especial');
  });

  it('deberia rechazar personalDiscount mayor a 0.99', () => {
    const invalid = { ...validCreateInput, personalDiscount: 1.0 };

    expect(() => createSubscriptionInputSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia aceptar personalDiscount null', () => {
    const withNull = { ...validCreateInput, personalDiscount: null, personalDiscountReason: null };
    const result = createSubscriptionInputSchema.parse(withNull);

    expect(result.personalDiscount).toBeNull();
  });

  it('deberia rechazar feePlanId invalido (no UUID)', () => {
    const invalid = { ...validCreateInput, feePlanId: 'not-a-uuid' };

    expect(() => createSubscriptionInputSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('changePlanInputSchema', () => {
  it('deberia aceptar datos validos de cambio de plan', () => {
    const result = changePlanInputSchema.parse(validChangePlanInput);

    expect(result.newFeePlanId).toBe(VALID_UUID_2);
    expect(result.effectiveDateType).toBe('NEXT_MONTH');
    expect(result.keepPendingCharges).toBe(false);
  });

  it('deberia rechazar effectiveDateType invalido', () => {
    const invalid = { ...validChangePlanInput, effectiveDateType: 'NEXT_WEEK' };

    expect(() => changePlanInputSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('updateDiscountInputSchema', () => {
  it('deberia aceptar datos validos de actualizacion de descuento', () => {
    const result = updateDiscountInputSchema.parse(validUpdateDiscountInput);

    expect(result.personalDiscount).toBe(0.15);
    expect(result.reason).toBe('Socio veterano con mas de 10 anos');
    expect(result.approvedBy).toBe('Juan Perez, tesorero');
  });

  it('deberia rechazar reason menor a 3 caracteres', () => {
    const invalid = { ...validUpdateDiscountInput, reason: 'ab' };

    expect(() => updateDiscountInputSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar personalDiscount mayor a 0.99', () => {
    const invalid = { ...validUpdateDiscountInput, personalDiscount: 1.0 };

    expect(() => updateDiscountInputSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar approvedBy menor a 3 caracteres', () => {
    const invalid = { ...validUpdateDiscountInput, approvedBy: 'JP' };

    expect(() => updateDiscountInputSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('memberSubscriptionsResponseSchema', () => {
  it('deberia aceptar shape SubscriptionHistoryResponseDto (REQ-ZOD-002)', () => {
    // Fixture alineado con SubscriptionHistoryResponseDto
    const response = {
      memberAccountId: VALID_UUID_3,
      memberId: VALID_UUID,
      activeSubscription: validSubscription,
      history: [],
    };
    const result = memberSubscriptionsResponseSchema.parse(response);

    expect(result.memberAccountId).toBe(VALID_UUID_3);
    expect(result.memberId).toBe(VALID_UUID);
    expect(result.activeSubscription).not.toBeNull();
    expect(result.history).toHaveLength(0);
  });

  it('deberia aceptar activeSubscription null y history vacio', () => {
    const response = {
      memberAccountId: VALID_UUID_3,
      memberId: VALID_UUID,
      activeSubscription: null,
      history: [],
    };
    const result = memberSubscriptionsResponseSchema.parse(response);

    expect(result.activeSubscription).toBeNull();
    expect(result.history).toEqual([]);
  });

  it('deberia aceptar history con suscripciones cerradas', () => {
    const closedSub = {
      ...validSubscription,
      leaveDate: '2026-06-01T00:00:00.000Z',
      cancelReason: 'PLAN_CHANGE',
      isActive: false,
    };
    const response = {
      memberAccountId: VALID_UUID_3,
      memberId: VALID_UUID,
      activeSubscription: null,
      history: [closedSub],
    };
    const result = memberSubscriptionsResponseSchema.parse(response);

    expect(result.history).toHaveLength(1);
    expect(result.history[0].cancelReason).toBe('PLAN_CHANGE');
  });

  it('deberia fallar con shape antiguo (closedSubscriptions y memberName ausentes del nuevo schema)', () => {
    // El shape antiguo tenia memberName, memberTypeId, memberTypeName, closedSubscriptions
    // Ahora falta memberAccountId e history — la validacion debe fallar
    const oldShape = {
      memberId: VALID_UUID,
      memberName: 'Juan Garcia',
      memberTypeId: VALID_UUID_2,
      memberTypeName: 'Socio Numerario',
      activeSubscription: validSubscription,
      closedSubscriptions: [],
    };
    const result = memberSubscriptionsResponseSchema.safeParse(oldShape);

    // memberAccountId e history son requeridos — debe fallar
    expect(result.success).toBe(false);
  });

  it('deberia rechazar respuesta sin memberAccountId', () => {
    const invalid = {
      memberId: VALID_UUID,
      activeSubscription: null,
      history: [],
    };

    expect(() => memberSubscriptionsResponseSchema.parse(invalid)).toThrow(ZodError);
  });
});
