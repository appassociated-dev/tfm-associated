import { describe, it, expect } from 'vitest';
import { FeePlan, CreateFeePlanProps } from '../aggregates/fee-plan';
import { FeePlanCreatedEvent } from '../events/fee-plan-created.event';
import { FeePlanModifiedEvent } from '../events/fee-plan-modified.event';

const TENANT_ID = 'tenant-uuid-1234';

/** Propiedades válidas para crear un plan recurrente. */
function validRecurringProps(overrides: Partial<CreateFeePlanProps> = {}): CreateFeePlanProps {
  return {
    code: 'CUOTA-ANUAL',
    name: 'Cuota Anual',
    description: 'Cuota anual de socio',
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 12000,
    billingMonths: [1],
    tenantId: TENANT_ID,
    ...overrides,
  };
}

/** Propiedades válidas para crear un plan de pago único. */
function validOneTimeProps(overrides: Partial<CreateFeePlanProps> = {}): CreateFeePlanProps {
  return {
    code: 'ALTA',
    name: 'Cuota de Alta',
    description: 'Cuota de inscripción',
    type: 'ONE_TIME',
    frequency: 'ANNUAL',
    amount: 5000,
    billingMonths: [],
    tenantId: TENANT_ID,
    ...overrides,
  };
}

describe('FeePlan Aggregate', () => {
  // --- Creación ---

  it('should create a RECURRING plan with valid data and emit FeePlanCreatedEvent', () => {
    const result = FeePlan.create(validRecurringProps());

    expect(result.ok).toBe(true);
    if (result.ok) {
      const plan = result.value;
      expect(plan.code.value).toBe('CUOTA-ANUAL');
      expect(plan.name).toBe('Cuota Anual');
      expect(plan.type.value).toBe('RECURRING');
      expect(plan.frequency.value).toBe('ANNUAL');
      expect(plan.amount.amount).toBe(12000);
      expect([...plan.billingMonths.months]).toEqual([1]);
      expect(plan.active).toBe(true);

      // Verificar evento emitido
      const events = plan.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(FeePlanCreatedEvent);
    }
  });

  it('should create a ONE_TIME plan with empty billingMonths', () => {
    const result = FeePlan.create(validOneTimeProps());

    expect(result.ok).toBe(true);
    if (result.ok) {
      const plan = result.value;
      expect(plan.type.value).toBe('ONE_TIME');
      expect(plan.billingMonths.isEmpty()).toBe(true);
      expect(plan.isOneTime()).toBe(true);
      expect(plan.isRecurring()).toBe(false);
    }
  });

  it('should fail when RECURRING plan has empty billingMonths', () => {
    const result = FeePlan.create(validRecurringProps({ billingMonths: [] }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('recurrente');
    }
  });

  it('should fail when ONE_TIME plan has billingMonths', () => {
    const result = FeePlan.create(validOneTimeProps({ billingMonths: [1, 6] }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('ONE_TIME');
    }
  });

  it('should fail with empty name', () => {
    const result = FeePlan.create(validRecurringProps({ name: '' }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('nombre');
    }
  });

  it('should fail with invalid code', () => {
    const result = FeePlan.create(validRecurringProps({ code: '!' }));

    expect(result.ok).toBe(false);
  });

  it('should fail with invalid type', () => {
    const result = FeePlan.create(validRecurringProps({ type: 'INVALID' }));

    expect(result.ok).toBe(false);
  });

  it('should fail with invalid frequency', () => {
    const result = FeePlan.create(validRecurringProps({ frequency: 'WEEKLY' }));

    expect(result.ok).toBe(false);
  });

  it('should fail with negative amount', () => {
    const result = FeePlan.create(validRecurringProps({ amount: -100 }));

    expect(result.ok).toBe(false);
  });

  // --- Actualización ---

  it('should update plan successfully and emit FeePlanModifiedEvent', () => {
    const createResult = FeePlan.create(validRecurringProps());
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const plan = createResult.value;
    // Consumir eventos de creación
    plan.pullDomainEvents();

    const updateResult = plan.update({
      name: 'Cuota Anual Actualizada',
      description: 'Nueva descripción',
      type: 'RECURRING',
      frequency: 'QUARTERLY',
      amount: 3000,
      billingMonths: [1, 4, 7, 10],
    });

    expect(updateResult.ok).toBe(true);
    expect(plan.name).toBe('Cuota Anual Actualizada');
    expect(plan.frequency.value).toBe('QUARTERLY');
    expect(plan.amount.amount).toBe(3000);

    const events = plan.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(FeePlanModifiedEvent);
  });

  it('should fail update with invalid data (RECURRING without billingMonths)', () => {
    const createResult = FeePlan.create(validRecurringProps());
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const plan = createResult.value;
    const updateResult = plan.update({
      name: 'Cuota',
      description: null,
      type: 'RECURRING',
      frequency: 'ANNUAL',
      amount: 1000,
      billingMonths: [],
    });

    expect(updateResult.ok).toBe(false);
  });

  // --- Desactivación ---

  it('should deactivate plan', () => {
    const createResult = FeePlan.create(validRecurringProps());
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const plan = createResult.value;
    expect(plan.active).toBe(true);

    plan.deactivate();

    expect(plan.active).toBe(false);
  });

  // --- shouldGenerateChargeForMonth ---

  it('should return true for included billing month on active recurring plan', () => {
    const createResult = FeePlan.create(validRecurringProps({ billingMonths: [1, 6, 12] }));
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const plan = createResult.value;
    expect(plan.shouldGenerateChargeForMonth(1)).toBe(true);
    expect(plan.shouldGenerateChargeForMonth(6)).toBe(true);
    expect(plan.shouldGenerateChargeForMonth(12)).toBe(true);
  });

  it('should return false for non-included billing month', () => {
    const createResult = FeePlan.create(validRecurringProps({ billingMonths: [1, 6] }));
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const plan = createResult.value;
    expect(plan.shouldGenerateChargeForMonth(3)).toBe(false);
  });

  it('should return false for ONE_TIME plan regardless of month', () => {
    const createResult = FeePlan.create(validOneTimeProps());
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const plan = createResult.value;
    expect(plan.shouldGenerateChargeForMonth(1)).toBe(false);
  });

  it('should return false for inactive recurring plan', () => {
    const createResult = FeePlan.create(validRecurringProps({ billingMonths: [1] }));
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const plan = createResult.value;
    plan.deactivate();
    expect(plan.shouldGenerateChargeForMonth(1)).toBe(false);
  });

  // --- Reconstitución ---

  it('should reconstitute from persistence data', () => {
    const plan = FeePlan.reconstitute({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      code: 'CUOTA-ANUAL',
      name: 'Cuota Anual',
      description: null,
      type: 'RECURRING',
      frequency: 'ANNUAL',
      amount: 12000,
      billingMonths: [1],
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(plan.code.value).toBe('CUOTA-ANUAL');
    expect(plan.name).toBe('Cuota Anual');
    expect(plan.active).toBe(true);
    // Reconstitución no debe emitir eventos
    expect(plan.pullDomainEvents()).toHaveLength(0);
  });
});
