import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LinkMemberTypesHandler } from '../link-member-types.handler';
import { LinkMemberTypesCommand } from '../link-member-types.command';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { MemberTypeFeePlanRepository } from '../../../domain/repositories/member-type-fee-plan.repository';
import { MemberTypeQueryPort, MemberTypeDto } from '../../../domain/ports/member-type-query.port';
import { IntegrationEventPublisher } from '../../../../shared/application/ports/integration-event.publisher';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { FeePlanNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const FEE_PLAN_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_TYPE_ID_1 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_TYPE_ID_2 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un FeePlan reconstituido para simular existente. */
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

/** Crea un MemberTypeDto simulado. */
function createMemberTypeDto(id: string): MemberTypeDto {
  return {
    id,
    code: 'NUMERARIO',
    name: 'Socio Numerario',
    active: true,
  };
}

describe('LinkMemberTypesHandler', () => {
  let handler: LinkMemberTypesHandler;
  let feePlanRepository: FeePlanRepository;
  let memberTypeFeePlanRepository: MemberTypeFeePlanRepository;
  let memberTypeQueryPort: MemberTypeQueryPort;
  let outboxPublisher: IntegrationEventPublisher;

  beforeEach(() => {
    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createExistingFeePlan()),
      findByCode: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      findAllWithCount: vi.fn(),
      existsByCode: vi.fn().mockResolvedValue(false),
      hasActiveSubscriptions: vi.fn().mockResolvedValue(false),
    };

    memberTypeFeePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      saveMany: vi.fn().mockResolvedValue(undefined),
      findByFeePlanId: vi.fn().mockResolvedValue([]),
      findByMemberTypeId: vi.fn().mockResolvedValue([]),
      findDefault: vi.fn().mockResolvedValue(null),
      deleteByFeePlanId: vi.fn().mockResolvedValue(undefined),
    };

    memberTypeQueryPort = {
      setTenantId: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue([]),
      findById: vi
        .fn()
        .mockImplementation((id: string) => Promise.resolve(createMemberTypeDto(id))),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new LinkMemberTypesHandler(
      feePlanRepository,
      memberTypeFeePlanRepository,
      memberTypeQueryPort,
      outboxPublisher,
    );
  });

  it('should link member types to a fee plan successfully (happy path)', async () => {
    const command = new LinkMemberTypesCommand(TENANT_ID, FEE_PLAN_ID, [
      { memberTypeId: MEMBER_TYPE_ID_1, isDefault: true, order: 1 },
      { memberTypeId: MEMBER_TYPE_ID_2, isDefault: false, order: 2 },
    ]);

    await handler.execute(command);

    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeFeePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);

    expect(feePlanRepository.findById).toHaveBeenCalledTimes(1);
    expect(memberTypeFeePlanRepository.deleteByFeePlanId).toHaveBeenCalledTimes(1);
    expect(memberTypeQueryPort.findById).toHaveBeenCalledTimes(2);
    expect(memberTypeFeePlanRepository.saveMany).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledWith(TENANT_ID, expect.any(Array));

    // Verificar que se publicaron 2 eventos (uno por cada link)
    const publishedEvents = (outboxPublisher.publish as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(publishedEvents).toHaveLength(2);
  });

  it('should throw FeePlanNotFoundError when plan does not exist (404)', async () => {
    (feePlanRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = new LinkMemberTypesCommand(TENANT_ID, FEE_PLAN_ID, [
      { memberTypeId: MEMBER_TYPE_ID_1, isDefault: true, order: 1 },
    ]);

    await expect(handler.execute(command)).rejects.toThrow(FeePlanNotFoundError);
    expect(memberTypeFeePlanRepository.saveMany).not.toHaveBeenCalled();
  });

  it('should throw when member type does not exist', async () => {
    (memberTypeQueryPort.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = new LinkMemberTypesCommand(TENANT_ID, FEE_PLAN_ID, [
      { memberTypeId: 'non-existent-id', isDefault: true, order: 1 },
    ]);

    await expect(handler.execute(command)).rejects.toThrow(/no encontrado/);
    expect(memberTypeFeePlanRepository.saveMany).not.toHaveBeenCalled();
  });

  it('should unset previous default when new link is marked as default', async () => {
    const existingDefault = {
      memberTypeId: MEMBER_TYPE_ID_1,
      feePlanId: 'old-plan-id',
      isDefault: true,
      setDefault: vi.fn(),
    };
    (memberTypeFeePlanRepository.findDefault as ReturnType<typeof vi.fn>).mockResolvedValue(
      existingDefault,
    );

    const command = new LinkMemberTypesCommand(TENANT_ID, FEE_PLAN_ID, [
      { memberTypeId: MEMBER_TYPE_ID_1, isDefault: true, order: 1 },
    ]);

    await handler.execute(command);

    expect(existingDefault.setDefault).toHaveBeenCalledWith(false);
    expect(memberTypeFeePlanRepository.save).toHaveBeenCalledWith(existingDefault);
  });
});
