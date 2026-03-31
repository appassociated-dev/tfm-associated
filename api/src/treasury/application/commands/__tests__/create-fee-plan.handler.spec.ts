import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateFeePlanHandler } from '../create-fee-plan.handler';
import { CreateFeePlanCommand } from '../create-fee-plan.command';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { IntegrationEventPublisher } from '../../../../shared/application/ports/integration-event.publisher';
import { FeePlanCodeAlreadyExistsError } from '../../../domain/exceptions';
import { FeePlanCodeInvalidError } from '../../../domain/value-objects/fee-plan-code';

const TENANT_ID = 'tenant-uuid-1234';

function validCommand(overrides: Partial<CreateFeePlanCommand> = {}): CreateFeePlanCommand {
  return new CreateFeePlanCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.code ?? 'CUOTA-ANUAL',
    overrides.name ?? 'Cuota Anual',
    overrides.description ?? 'Cuota anual de socio',
    overrides.type ?? 'RECURRING',
    overrides.frequency ?? 'ANNUAL',
    overrides.amount ?? 12000,
    overrides.billingMonths ?? [1],
  );
}

describe('CreateFeePlanHandler', () => {
  let handler: CreateFeePlanHandler;
  let feePlanRepository: FeePlanRepository;
  let outboxPublisher: IntegrationEventPublisher;

  beforeEach(() => {
    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByCode: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      findAllWithCount: vi.fn(),
      existsByCode: vi.fn().mockResolvedValue(false),
      hasActiveSubscriptions: vi.fn().mockResolvedValue(false),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new CreateFeePlanHandler(feePlanRepository, outboxPublisher);
  });

  it('should create a fee plan successfully (happy path)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.code).toBe('CUOTA-ANUAL');
    expect(result.name).toBe('Cuota Anual');
    expect(result.type).toBe('RECURRING');
    expect(result.frequency).toBe('ANNUAL');
    expect(result.amount).toBe(12000);
    expect(result.billingMonths).toEqual([1]);
    expect(result.active).toBe(true);

    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.existsByCode).toHaveBeenCalledTimes(1);
    expect(feePlanRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledWith(TENANT_ID, expect.any(Array));
  });

  it('should throw FeePlanCodeAlreadyExistsError when code is duplicate (409)', async () => {
    (feePlanRepository.existsByCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(FeePlanCodeAlreadyExistsError);
    expect(feePlanRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when code format is invalid', async () => {
    const command = validCommand({ code: '!' });

    await expect(handler.execute(command)).rejects.toThrow(FeePlanCodeInvalidError);
    expect(feePlanRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when RECURRING plan has no billingMonths', async () => {
    const command = validCommand({ type: 'RECURRING', billingMonths: [] });

    await expect(handler.execute(command)).rejects.toThrow();
    expect(feePlanRepository.save).not.toHaveBeenCalled();
  });

  it('should throw when ONE_TIME plan has billingMonths', async () => {
    const command = validCommand({ type: 'ONE_TIME', billingMonths: [1, 6] });

    await expect(handler.execute(command)).rejects.toThrow();
    expect(feePlanRepository.save).not.toHaveBeenCalled();
  });

  it('should create ONE_TIME plan with empty billingMonths successfully', async () => {
    const command = validCommand({ type: 'ONE_TIME', billingMonths: [] });

    const result = await handler.execute(command);

    expect(result.type).toBe('ONE_TIME');
    expect(result.billingMonths).toEqual([]);
    expect(feePlanRepository.save).toHaveBeenCalledTimes(1);
  });
});
