import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '@nestjs/cqrs';
import { OnMemberTypeChangedTreasuryHandler } from '../on-member-type-changed.treasury-handler';
import { UpdateSubscriptionDiscountCommand } from '../../commands/update-subscription-discount.command';
import { MemberTypeChangedEvent } from '../../../../membership/domain/events/member-type-changed.event';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { MemberTypeFeePlanRepository } from '../../../domain/repositories/member-type-fee-plan.repository';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { MemberTypeFeePlan } from '../../../domain/entities/member-type-fee-plan';
import { FeeSubscription } from '../../../domain/entities/fee-subscription';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ACCOUNT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const SUB_ID = 's1000000-0000-0000-0000-000000000001';
const FEE_PLAN_ID = 'fp000000-0000-0000-0000-000000000001';
const NEW_TYPE_ID = 'mt-junior-0000-0000-0000-000000000002';

/** Crea un MemberTypeChangedEvent con overrides opcionales. */
function makeEvent(overrides: { tenantId?: string } = {}): MemberTypeChangedEvent {
  return new MemberTypeChangedEvent({
    payload: {
      memberId: MEMBER_ID,
      previousTypeId: 'mt-adult-0000-0000-0000-000000000001',
      previousTypeName: 'Adulto',
      newTypeId: NEW_TYPE_ID,
      newTypeName: 'Junior',
      reason: 'Cambio de categoría por edad',
      fiscalYearId: 'fy-2026',
    },
    aggregateId: MEMBER_ID,
    aggregateType: 'Member',
    boundedContext: 'BC-Membership',
    tenantId: overrides.tenantId,
  });
}

/** Crea un stub de MemberAccount con una suscripción activa. */
function makeMemberAccountStub(): MemberAccount {
  const subscription = {
    id: { toValue: () => SUB_ID },
    isActive: () => true,
    feePlanId: { toValue: () => FEE_PLAN_ID },
    discount: { typeDiscount: 0 },
  } as unknown as FeeSubscription;

  return {
    id: { toValue: () => ACCOUNT_ID },
    subscriptions: [subscription],
  } as unknown as MemberAccount;
}

/** Crea un stub de MemberTypeFeePlan con descuento de tipo. */
function makeMemberTypeFeePlanStub(): MemberTypeFeePlan {
  return {
    feePlanId: FEE_PLAN_ID,
    isDefault: true,
  } as unknown as MemberTypeFeePlan;
}

describe('OnMemberTypeChangedTreasuryHandler', () => {
  let handler: OnMemberTypeChangedTreasuryHandler;
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let memberAccountRepository: MemberAccountRepository;
  let memberTypeFeePlanRepository: MemberTypeFeePlanRepository;

  beforeEach(() => {
    commandBus = { execute: vi.fn().mockResolvedValue(undefined) };

    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByMemberId: vi.fn().mockResolvedValue(makeMemberAccountStub()),
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

    handler = new OnMemberTypeChangedTreasuryHandler(
      commandBus as unknown as CommandBus,
      memberAccountRepository,
      memberTypeFeePlanRepository,
    );
  });

  it('debería despachar UpdateSubscriptionDiscountCommand con los datos correctos (happy path)', async () => {
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
        subscriptionId: SUB_ID,
      }),
    );
    const cmd = (commandBus.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(cmd).toBeInstanceOf(UpdateSubscriptionDiscountCommand);
  });

  it('debería ser idempotente (mismo evento dos veces produce el mismo resultado)', async () => {
    // Arrange
    const event = makeEvent({ tenantId: TENANT_ID });

    // Act: manejar el mismo evento dos veces
    await handler.handle(event);
    await handler.handle(event);

    // Assert: se despachó el comando dos veces sin error (operación sobrescribe con mismo valor)
    expect(commandBus.execute).toHaveBeenCalledTimes(2);
  });

  it('debería absorber el error si commandBus.execute lanza (aislamiento de errores)', async () => {
    // Arrange
    commandBus.execute.mockRejectedValue(new Error('Discount update failed'));
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
