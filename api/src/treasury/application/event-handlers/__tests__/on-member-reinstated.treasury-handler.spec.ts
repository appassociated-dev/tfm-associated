import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '@nestjs/cqrs';
import { OnMemberReinstatedTreasuryHandler } from '../on-member-reinstated.treasury-handler';
import { CreateSubscriptionCommand } from '../../commands/create-subscription.command';
import { MemberReinstatedEvent } from '../../../../membership/domain/events/member-reinstated.event';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { MemberTypeFeePlanRepository } from '../../../domain/repositories/member-type-fee-plan.repository';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { MemberTypeFeePlan } from '../../../domain/entities/member-type-fee-plan';
import { MemberQueryPort } from '../../../domain/ports/member-query.port';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ACCOUNT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const FEE_PLAN_ID = 'fp000000-0000-0000-0000-000000000001';
const MEMBER_TYPE_ID = 'mt000000-0000-0000-0000-000000000001';

/** Crea un MemberReinstatedEvent con overrides opcionales. */
function makeEvent(overrides: { tenantId?: string } = {}): MemberReinstatedEvent {
  return new MemberReinstatedEvent({
    payload: {
      memberId: MEMBER_ID,
      memberNumber: 'M-001',
      previousLeaveType: 'VOLUNTARY_LEAVE',
      reinstatementDate: new Date('2026-06-01'),
      debtPaid: false,
      seniorityRecovered: true,
    },
    aggregateId: MEMBER_ID,
    aggregateType: 'Member',
    boundedContext: 'BC-Membership',
    tenantId: overrides.tenantId,
  });
}

/** Stub de MemberAccount sin suscripciones activas (estado normal para rehabilitación). */
function makeMemberAccountStub(hasActiveSubscription = false): MemberAccount {
  return {
    id: { toValue: () => ACCOUNT_ID },
    subscriptions: hasActiveSubscription ? [{ isActive: () => true }] : [],
  } as unknown as MemberAccount;
}

/** Stub de MemberTypeFeePlan con plan por defecto. */
function makeMemberTypeFeePlanStub(): MemberTypeFeePlan {
  return {
    feePlanId: FEE_PLAN_ID,
    isDefault: true,
  } as unknown as MemberTypeFeePlan;
}

describe('OnMemberReinstatedTreasuryHandler', () => {
  let handler: OnMemberReinstatedTreasuryHandler;
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let memberAccountRepository: MemberAccountRepository;
  let memberTypeFeePlanRepository: MemberTypeFeePlanRepository;
  let memberQueryPort: MemberQueryPort;

  beforeEach(() => {
    commandBus = { execute: vi.fn().mockResolvedValue(undefined) };

    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByMemberId: vi.fn().mockResolvedValue(makeMemberAccountStub(false)),
      existsByMemberId: vi.fn(),
      findAllWithActiveSubscriptions: vi.fn(),
    } as unknown as MemberAccountRepository;

    memberTypeFeePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      findByFeePlanId: vi.fn(),
      findByMemberTypeId: vi.fn(),
      findDefault: vi.fn().mockResolvedValue(makeMemberTypeFeePlanStub()),
      deleteByFeePlanId: vi.fn(),
    } as unknown as MemberTypeFeePlanRepository;

    memberQueryPort = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue({ id: MEMBER_ID, memberTypeId: MEMBER_TYPE_ID }),
      findActiveMembers: vi.fn(),
      searchMembers: vi.fn(),
    } as unknown as MemberQueryPort;

    handler = new OnMemberReinstatedTreasuryHandler(
      commandBus as unknown as CommandBus,
      memberAccountRepository,
      memberTypeFeePlanRepository,
      memberQueryPort,
    );
  });

  it('debería despachar CreateSubscriptionCommand con los datos correctos (happy path)', async () => {
    // Arrange
    const event = makeEvent({ tenantId: TENANT_ID });

    // Act
    await handler.handle(event);

    // Assert
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberAccountRepository.findByMemberId).toHaveBeenCalledWith(MEMBER_ID);
    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        memberAccountId: ACCOUNT_ID,
        feePlanId: FEE_PLAN_ID,
      }),
    );
    const cmd = (commandBus.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(cmd).toBeInstanceOf(CreateSubscriptionCommand);
  });

  it('debería no despachar CreateSubscriptionCommand si ya existe suscripción activa (idempotencia)', async () => {
    // Arrange: la cuenta ya tiene suscripción activa
    (memberAccountRepository.findByMemberId as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeMemberAccountStub(true),
    );
    const event = makeEvent({ tenantId: TENANT_ID });

    // Act
    await handler.handle(event);

    // Assert: no se despachó ningún comando
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('debería absorber el error si commandBus.execute lanza (aislamiento de errores)', async () => {
    // Arrange
    commandBus.execute.mockRejectedValue(new Error('Fee plan not found'));
    const event = makeEvent({ tenantId: TENANT_ID });

    // Act & Assert: handle() NO debe lanzar
    await expect(handler.handle(event)).resolves.not.toThrow();
  });

  it('debería ignorar el evento si falta tenantId', async () => {
    // Arrange
    const event = makeEvent({ tenantId: undefined });

    // Act
    await handler.handle(event);

    // Assert: no se realizó ninguna operación
    expect(memberAccountRepository.setTenantId).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
