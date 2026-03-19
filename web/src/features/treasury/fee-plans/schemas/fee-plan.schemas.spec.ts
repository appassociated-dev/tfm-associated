import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  feePlanSchema,
  feePlanDetailSchema,
  planTypeSchema,
  frequencySchema,
  createFeePlanInputSchema,
  memberTypeFeePlanSchema,
  memberTypeOptionSchema,
} from './fee-plan.schemas';

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';

const validFeePlan = {
  id: VALID_UUID,
  code: 'CUOTA-ANUAL',
  name: 'Cuota anual de socio',
  description: 'Cuota anual obligatoria',
  type: 'RECURRING' as const,
  amount: 12000,
  frequency: 'ANNUAL' as const,
  billingMonths: [1],
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const validCreateInput = {
  code: 'CUOTA-ANUAL',
  name: 'Cuota anual de socio',
  description: null,
  type: 'RECURRING' as const,
  amount: 12000,
  frequency: 'ANNUAL' as const,
  billingMonths: [1],
};

const validMemberTypeFeePlan = {
  memberTypeId: VALID_UUID,
  memberTypeName: 'Socio Numerario',
  feePlanId: VALID_UUID_2,
  isDefault: true,
  order: 0,
  active: true,
};

const validMemberTypeOption = {
  id: VALID_UUID,
  code: 'NUMERARIO',
  name: 'Socio Numerario',
  active: true,
};

// === Tests ===

describe('planTypeSchema', () => {
  it('deberia aceptar RECURRING', () => {
    const result = planTypeSchema.parse('RECURRING');
    expect(result).toBe('RECURRING');
  });

  it('deberia aceptar ONE_TIME', () => {
    const result = planTypeSchema.parse('ONE_TIME');
    expect(result).toBe('ONE_TIME');
  });

  it('deberia rechazar valor invalido', () => {
    expect(() => planTypeSchema.parse('INVALID')).toThrow(ZodError);
  });
});

describe('frequencySchema', () => {
  it.each(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'])(
    'deberia aceptar valor valido: %s',
    (value) => {
      const result = frequencySchema.parse(value);
      expect(result).toBe(value);
    },
  );

  it('deberia rechazar valor invalido', () => {
    expect(() => frequencySchema.parse('WEEKLY')).toThrow(ZodError);
  });
});

describe('feePlanSchema', () => {
  it('deberia aceptar datos validos de plan de cuota', () => {
    const result = feePlanSchema.parse(validFeePlan);

    expect(result.id).toBe(VALID_UUID);
    expect(result.code).toBe('CUOTA-ANUAL');
    expect(result.name).toBe('Cuota anual de socio');
    expect(result.type).toBe('RECURRING');
    expect(result.amount).toBe(12000);
    expect(result.frequency).toBe('ANNUAL');
    expect(result.billingMonths).toEqual([1]);
    expect(result.active).toBe(true);
  });

  it('deberia aceptar plan con description nullable', () => {
    const withNullDesc = { ...validFeePlan, description: null };
    const result = feePlanSchema.parse(withNullDesc);

    expect(result.description).toBeNull();
  });

  it('deberia aceptar plan con frequency nullable (para ONE_TIME)', () => {
    const oneTimePlan = {
      ...validFeePlan,
      type: 'ONE_TIME',
      frequency: null,
      billingMonths: [],
    };
    const result = feePlanSchema.parse(oneTimePlan);

    expect(result.frequency).toBeNull();
    expect(result.type).toBe('ONE_TIME');
  });

  it('deberia aceptar plan con amount 1 (minimo valido en centavos)', () => {
    const minPlan = { ...validFeePlan, amount: 1 };
    const result = feePlanSchema.parse(minPlan);

    expect(result.amount).toBe(1);
  });

  it('deberia aceptar plan con amount 0 (plan gratuito o placeholder)', () => {
    const freeplan = { ...validFeePlan, amount: 0 };
    const result = feePlanSchema.parse(freeplan);

    expect(result.amount).toBe(0);
  });

  it('deberia rechazar plan con amount negativo', () => {
    const invalid = { ...validFeePlan, amount: -100 };

    expect(() => feePlanSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar plan sin campos obligatorios', () => {
    const invalid = { id: VALID_UUID };

    expect(() => feePlanSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar billingMonths con mes mayor a 12', () => {
    const invalid = { ...validFeePlan, billingMonths: [1, 13] };

    expect(() => feePlanSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar billingMonths con mes menor a 1', () => {
    const invalid = { ...validFeePlan, billingMonths: [0, 1] };

    expect(() => feePlanSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('createFeePlanInputSchema', () => {
  it('deberia aceptar datos validos de creacion', () => {
    const result = createFeePlanInputSchema.parse(validCreateInput);

    expect(result.code).toBe('CUOTA-ANUAL');
    expect(result.name).toBe('Cuota anual de socio');
    expect(result.type).toBe('RECURRING');
    expect(result.amount).toBe(12000);
  });

  it('deberia rechazar code vacio', () => {
    const invalid = { ...validCreateInput, code: '' };

    expect(() => createFeePlanInputSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar RECURRING sin frequency', () => {
    const withoutFreq = { ...validCreateInput };
    delete (withoutFreq as Record<string, unknown>).frequency;

    expect(() => createFeePlanInputSchema.parse(withoutFreq)).toThrow(ZodError);
  });

  it('deberia rechazar RECURRING sin billingMonths', () => {
    const withoutMonths = { ...validCreateInput };
    delete (withoutMonths as Record<string, unknown>).billingMonths;

    expect(() => createFeePlanInputSchema.parse(withoutMonths)).toThrow(ZodError);
  });

  it('deberia aceptar ONE_TIME sin frequency ni billingMonths', () => {
    const oneTimeInput = {
      code: 'ALTA',
      name: 'Cuota de alta',
      description: null,
      type: 'ONE_TIME' as const,
      amount: 5000,
    };

    const result = createFeePlanInputSchema.parse(oneTimeInput);
    expect(result.type).toBe('ONE_TIME');
    expect(result.frequency).toBeUndefined();
    expect(result.billingMonths).toBeUndefined();
  });
});

describe('memberTypeFeePlanSchema', () => {
  it('deberia aceptar datos validos de vinculacion', () => {
    const result = memberTypeFeePlanSchema.parse(validMemberTypeFeePlan);

    expect(result.memberTypeId).toBe(VALID_UUID);
    expect(result.memberTypeName).toBe('Socio Numerario');
    expect(result.isDefault).toBe(true);
    expect(result.order).toBe(0);
  });

  it('deberia rechazar order negativo', () => {
    const invalid = { ...validMemberTypeFeePlan, order: -1 };

    expect(() => memberTypeFeePlanSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('memberTypeOptionSchema', () => {
  it('deberia aceptar datos validos de tipo de socio', () => {
    const result = memberTypeOptionSchema.parse(validMemberTypeOption);

    expect(result.id).toBe(VALID_UUID);
    expect(result.code).toBe('NUMERARIO');
    expect(result.name).toBe('Socio Numerario');
    expect(result.active).toBe(true);
  });
});

describe('feePlanDetailSchema', () => {
  it('deberia aceptar plan con linkedMemberTypes array', () => {
    const planDetail = {
      ...validFeePlan,
      linkedMemberTypes: [validMemberTypeFeePlan],
    };
    const result = feePlanDetailSchema.parse(planDetail);

    expect(result.linkedMemberTypes).toHaveLength(1);
    expect(result.linkedMemberTypes[0].memberTypeName).toBe('Socio Numerario');
  });

  it('deberia aceptar plan con linkedMemberTypes vacio', () => {
    const planDetail = {
      ...validFeePlan,
      linkedMemberTypes: [],
    };
    const result = feePlanDetailSchema.parse(planDetail);

    expect(result.linkedMemberTypes).toEqual([]);
  });
});
