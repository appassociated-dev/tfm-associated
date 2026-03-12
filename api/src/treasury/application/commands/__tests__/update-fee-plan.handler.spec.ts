import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateFeePlanHandler } from '../update-fee-plan.handler';
import { UpdateFeePlanCommand } from '../update-fee-plan.command';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { TreasuryOutboxPublisher } from '../../ports/treasury-outbox.publisher';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { FeePlanNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const FEE_PLAN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un FeePlan reconstituido para simular existente. */
function createExistingFeePlan(overrides: Partial<{ id: string; active: boolean }> = {}): FeePlan {
  return FeePlan.reconstitute({
    id: overrides.id ?? FEE_PLAN_ID,
    code: 'CUOTA-ANUAL',
    name: 'Cuota Anual',
    description: 'Cuota anual de socio',
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 12000,
    billingMonths: [1],
    active: overrides.active ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function validCommand(overrides: Partial<UpdateFeePlanCommand> = {}): UpdateFeePlanCommand {
  return new UpdateFeePlanCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.feePlanId ?? FEE_PLAN_ID,
    overrides.name ?? 'Cuota Anual Actualizada',
    overrides.description ?? 'Nueva descripción',
    overrides.type ?? 'RECURRING',
    overrides.frequency ?? 'QUARTERLY',
    overrides.amount ?? 3000,
    overrides.billingMonths ?? [1, 4, 7, 10],
  );
}

describe('UpdateFeePlanHandler', () => {
  let handler: UpdateFeePlanHandler;
  let feePlanRepository: FeePlanRepository;
  let outboxPublisher: TreasuryOutboxPublisher;

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

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new UpdateFeePlanHandler(feePlanRepository, outboxPublisher);
  });

  it('should update a fee plan successfully (happy path)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.name).toBe('Cuota Anual Actualizada');
    expect(result.frequency).toBe('QUARTERLY');
    expect(result.amount).toBe(3000);
    expect(result.billingMonths).toEqual([1, 4, 7, 10]);

    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.findById).toHaveBeenCalledTimes(1);
    expect(feePlanRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('should throw FeePlanNotFoundError when plan does not exist (404)', async () => {
    (feePlanRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(FeePlanNotFoundError);
    expect(feePlanRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when update violates RECURRING invariant (empty billingMonths)', async () => {
    const command = validCommand({ type: 'RECURRING', billingMonths: [] });

    await expect(handler.execute(command)).rejects.toThrow();
    expect(feePlanRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when update violates ONE_TIME invariant (has billingMonths)', async () => {
    const command = validCommand({ type: 'ONE_TIME', billingMonths: [1] });

    await expect(handler.execute(command)).rejects.toThrow();
    expect(feePlanRepository.save).not.toHaveBeenCalled();
  });

  it('should preserve immutable code after update', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    // El código original no cambia
    expect(result.code).toBe('CUOTA-ANUAL');
  });
});
