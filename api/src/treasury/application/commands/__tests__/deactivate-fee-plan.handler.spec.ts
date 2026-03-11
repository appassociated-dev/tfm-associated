import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeactivateFeePlanHandler } from '../deactivate-fee-plan.handler';
import { DeactivateFeePlanCommand } from '../deactivate-fee-plan.command';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import {
  FeePlanNotFoundError,
  FeePlanHasActiveSubscriptionsError,
} from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const FEE_PLAN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un FeePlan reconstituido activo para simular existente. */
function createExistingFeePlan(): FeePlan {
  return FeePlan.reconstitute({
    id: FEE_PLAN_ID,
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
}

describe('DeactivateFeePlanHandler', () => {
  let handler: DeactivateFeePlanHandler;
  let feePlanRepository: FeePlanRepository;

  beforeEach(() => {
    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createExistingFeePlan()),
      findByCode: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      existsByCode: vi.fn().mockResolvedValue(false),
      hasActiveSubscriptions: vi.fn().mockResolvedValue(false),
    };

    handler = new DeactivateFeePlanHandler(feePlanRepository);
  });

  it('should deactivate a fee plan successfully (happy path)', async () => {
    const command = new DeactivateFeePlanCommand(TENANT_ID, FEE_PLAN_ID);

    await handler.execute(command);

    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.findById).toHaveBeenCalledTimes(1);
    expect(feePlanRepository.hasActiveSubscriptions).toHaveBeenCalledTimes(1);
    expect(feePlanRepository.save).toHaveBeenCalledTimes(1);

    // Verificar que el plan pasado a save está desactivado
    const savedPlan = (feePlanRepository.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as FeePlan;
    expect(savedPlan.active).toBe(false);
  });

  it('should throw FeePlanNotFoundError when plan does not exist (404)', async () => {
    (feePlanRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = new DeactivateFeePlanCommand(TENANT_ID, FEE_PLAN_ID);

    await expect(handler.execute(command)).rejects.toThrow(FeePlanNotFoundError);
    expect(feePlanRepository.save).not.toHaveBeenCalled();
  });

  it('should throw FeePlanHasActiveSubscriptionsError when plan has active subscriptions (422)', async () => {
    (feePlanRepository.hasActiveSubscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const command = new DeactivateFeePlanCommand(TENANT_ID, FEE_PLAN_ID);

    await expect(handler.execute(command)).rejects.toThrow(FeePlanHasActiveSubscriptionsError);
    expect(feePlanRepository.save).not.toHaveBeenCalled();
  });
});
