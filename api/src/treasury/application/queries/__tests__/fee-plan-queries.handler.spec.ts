import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetFeePlanHandler } from '../get-fee-plan.handler';
import { GetFeePlanQuery } from '../get-fee-plan.query';
import { ListFeePlansHandler } from '../list-fee-plans.handler';
import { ListFeePlansQuery } from '../list-fee-plans.query';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { MemberTypeFeePlanRepository } from '../../../domain/repositories/member-type-fee-plan.repository';
import { MemberTypeQueryPort } from '../../../domain/ports/member-type-query.port';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { FeePlanNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const FEE_PLAN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FEE_PLAN_ID_2 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un FeePlan reconstituido para simular existente. */
function createExistingFeePlan(
  overrides: Partial<{ id: string; active: boolean; code: string; name: string }> = {},
): FeePlan {
  return FeePlan.reconstitute({
    id: overrides.id ?? FEE_PLAN_ID,
    code: overrides.code ?? 'CUOTA-ANUAL',
    name: overrides.name ?? 'Cuota Anual',
    description: null,
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 12000,
    billingMonths: [1],
    active: overrides.active ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

// =============================================================================
// GetFeePlanHandler
// =============================================================================

describe('GetFeePlanHandler', () => {
  let handler: GetFeePlanHandler;
  let feePlanRepository: FeePlanRepository;
  let memberTypeFeePlanRepository: MemberTypeFeePlanRepository;
  let memberTypeQueryPort: MemberTypeQueryPort;

  beforeEach(() => {
    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(createExistingFeePlan()),
      findByCode: vi.fn(),
      findAll: vi.fn(),
      existsByCode: vi.fn(),
      hasActiveSubscriptions: vi.fn(),
    };

    memberTypeFeePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      findByFeePlanId: vi.fn().mockResolvedValue([]),
      findByMemberTypeId: vi.fn(),
      findDefault: vi.fn(),
      deleteByFeePlanId: vi.fn(),
    };

    memberTypeQueryPort = {
      setTenantId: vi.fn(),
      findAllActive: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: 'mt-1',
        code: 'NUMERARIO',
        name: 'Socio Numerario',
        active: true,
      }),
    };

    handler = new GetFeePlanHandler(
      feePlanRepository,
      memberTypeFeePlanRepository,
      memberTypeQueryPort,
    );
  });

  it('should return fee plan DTO with empty linkedMemberTypes when found', async () => {
    const query = new GetFeePlanQuery(TENANT_ID, FEE_PLAN_ID);

    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result.id).toBe(FEE_PLAN_ID);
    expect(result.code).toBe('CUOTA-ANUAL');
    expect(result.name).toBe('Cuota Anual');
    expect(result.type).toBe('RECURRING');
    expect(result.frequency).toBe('ANNUAL');
    expect(result.amount).toBe(12000);
    expect(result.amountFormatted).toBe('120.00 EUR');
    expect(result.currency).toBe('EUR');
    expect(result.billingMonths).toEqual([1]);
    expect(result.active).toBe(true);
    expect(result.linkedMemberTypes).toEqual([]);

    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeFeePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.findById).toHaveBeenCalledTimes(1);
    expect(memberTypeFeePlanRepository.findByFeePlanId).toHaveBeenCalledTimes(1);
  });

  it('should return fee plan DTO with linkedMemberTypes populated', async () => {
    const { MemberTypeFeePlan } = await import('../../../domain/entities/member-type-fee-plan');
    const assignment = MemberTypeFeePlan.create({
      memberTypeId: 'mt-1',
      feePlanId: FEE_PLAN_ID,
      isDefault: true,
      order: 1,
      active: true,
    });
    (memberTypeFeePlanRepository.findByFeePlanId as ReturnType<typeof vi.fn>).mockResolvedValue([
      assignment,
    ]);

    const query = new GetFeePlanQuery(TENANT_ID, FEE_PLAN_ID);
    const result = await handler.execute(query);

    expect(result.linkedMemberTypes).toHaveLength(1);
    expect(result.linkedMemberTypes![0].memberTypeId).toBe('mt-1');
    expect(result.linkedMemberTypes![0].memberTypeName).toBe('Socio Numerario');
    expect(result.linkedMemberTypes![0].feePlanId).toBe(FEE_PLAN_ID);
    expect(result.linkedMemberTypes![0].isDefault).toBe(true);
    expect(result.linkedMemberTypes![0].order).toBe(1);
    expect(result.linkedMemberTypes![0].active).toBe(true);
  });

  it('should throw FeePlanNotFoundError when plan does not exist (404)', async () => {
    (feePlanRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetFeePlanQuery(TENANT_ID, FEE_PLAN_ID);

    await expect(handler.execute(query)).rejects.toThrow(FeePlanNotFoundError);
  });
});

// =============================================================================
// ListFeePlansHandler
// =============================================================================

describe('ListFeePlansHandler', () => {
  let handler: ListFeePlansHandler;
  let feePlanRepository: FeePlanRepository;

  const activePlan = createExistingFeePlan({
    id: FEE_PLAN_ID,
    active: true,
    code: 'CUOTA-01',
    name: 'Plan 1',
  });
  const inactivePlan = createExistingFeePlan({
    id: FEE_PLAN_ID_2,
    active: false,
    code: 'CUOTA-02',
    name: 'Plan 2',
  });

  beforeEach(() => {
    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findAll: vi.fn().mockResolvedValue([activePlan, inactivePlan]),
      existsByCode: vi.fn(),
      hasActiveSubscriptions: vi.fn(),
    };

    handler = new ListFeePlansHandler(feePlanRepository);
  });

  it('should return all fee plans when no filter is applied', async () => {
    const query = new ListFeePlansQuery(TENANT_ID);

    const result = await handler.execute(query);

    expect(result).toHaveLength(2);
    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return only active fee plans when active=true', async () => {
    const query = new ListFeePlansQuery(TENANT_ID, true);

    const result = await handler.execute(query);

    expect(result).toHaveLength(1);
    expect(result[0].active).toBe(true);
  });

  it('should return only inactive fee plans when active=false', async () => {
    const query = new ListFeePlansQuery(TENANT_ID, false);

    const result = await handler.execute(query);

    expect(result).toHaveLength(1);
    expect(result[0].active).toBe(false);
  });

  it('should return empty array when no plans exist', async () => {
    (feePlanRepository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const query = new ListFeePlansQuery(TENANT_ID);

    const result = await handler.execute(query);

    expect(result).toHaveLength(0);
  });
});
