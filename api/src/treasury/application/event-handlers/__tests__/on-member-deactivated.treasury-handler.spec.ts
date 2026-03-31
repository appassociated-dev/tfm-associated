import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '@nestjs/cqrs';
import { OnMemberDeactivatedTreasuryHandler } from '../on-member-deactivated.treasury-handler';
import { CloseSubscriptionCommand } from '../../commands/close-subscription.command';
import { MemberDeactivatedEvent } from '../../../../membership/domain/events/member-deactivated.event';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { FeeSubscription } from '../../../domain/entities/fee-subscription';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ACCOUNT_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const SUB_ID_1 = 's1000000-0000-0000-0000-000000000001';
const SUB_ID_2 = 's2000000-0000-0000-0000-000000000002';

/** Crea un MemberDeactivatedEvent con overrides opcionales. */
function makeEvent(overrides: { tenantId?: string } = {}): MemberDeactivatedEvent {
  return new MemberDeactivatedEvent({
    payload: {
      memberId: MEMBER_ID,
      memberNumber: 'M-001',
      leaveType: 'VOLUNTARY_LEAVE',
      effectiveDate: new Date('2026-06-30'),
      reason: 'Solicitud voluntaria',
      pendingDebt: 0,
    },
    aggregateId: MEMBER_ID,
    aggregateType: 'Member',
    boundedContext: 'BC-Membership',
    tenantId: overrides.tenantId,
  });
}

/** Crea un stub de MemberAccount con suscripciones activas. */
function makeMemberAccountStub(subscriptionIds: string[]): MemberAccount {
  const subscriptions = subscriptionIds.map((subId) => {
    const sub = {
      id: { toValue: () => subId },
      isActive: () => true,
    };
    return sub as unknown as FeeSubscription;
  });

  return {
    id: { toValue: () => ACCOUNT_ID },
    subscriptions,
  } as unknown as MemberAccount;
}

describe('OnMemberDeactivatedTreasuryHandler', () => {
  let handler: OnMemberDeactivatedTreasuryHandler;
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let memberAccountRepository: MemberAccountRepository;

  beforeEach(() => {
    commandBus = { execute: vi.fn().mockResolvedValue(undefined) };
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByMemberId: vi.fn().mockResolvedValue(makeMemberAccountStub([SUB_ID_1, SUB_ID_2])),
      existsByMemberId: vi.fn(),
      findAllWithActiveSubscriptions: vi.fn(),
    } as unknown as MemberAccountRepository;

    handler = new OnMemberDeactivatedTreasuryHandler(
      commandBus as unknown as CommandBus,
      memberAccountRepository,
    );
  });

  it('debería despachar CloseSubscriptionCommand por cada suscripción activa (happy path)', async () => {
    // Arrange
    const event = makeEvent({ tenantId: TENANT_ID });

    // Act
    await handler.handle(event);

    // Assert: setTenantId llamado con el tenant correcto
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);

    // Assert: findByMemberId llamado con el memberId del evento
    expect(memberAccountRepository.findByMemberId).toHaveBeenCalledWith(MEMBER_ID);

    // Assert: se despachó un CloseSubscriptionCommand por cada suscripción
    expect(commandBus.execute).toHaveBeenCalledTimes(2);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        memberAccountId: ACCOUNT_ID,
        subscriptionId: SUB_ID_1,
        cancelReason: 'MEMBER_LEAVE',
      }),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        memberAccountId: ACCOUNT_ID,
        subscriptionId: SUB_ID_2,
        cancelReason: 'MEMBER_LEAVE',
      }),
    );
    const cmd = (commandBus.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(cmd).toBeInstanceOf(CloseSubscriptionCommand);
  });

  it('debería intentar cerrar TODAS las suscripciones aunque una falle (aislamiento por suscripción, WARNING-1)', async () => {
    // Arrange: la primera llamada falla, la segunda tiene éxito
    commandBus.execute
      .mockRejectedValueOnce(new Error('Subscription close failed'))
      .mockResolvedValueOnce(undefined);
    const event = makeEvent({ tenantId: TENANT_ID });

    // Act & Assert: handle() NO debe lanzar
    await expect(handler.handle(event)).resolves.not.toThrow();

    // Assert: AMBAS suscripciones fueron intentadas — el fallo de la primera no bloqueó la segunda
    expect(commandBus.execute).toHaveBeenCalledTimes(2);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: SUB_ID_1 }),
    );
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionId: SUB_ID_2 }),
    );
  });

  it('debería ignorar el evento y no despachar comando si falta tenantId', async () => {
    // Arrange: evento sin tenantId
    const event = makeEvent({ tenantId: undefined });

    // Act
    await handler.handle(event);

    // Assert: no se realizó ninguna operación
    expect(memberAccountRepository.setTenantId).not.toHaveBeenCalled();
    expect(memberAccountRepository.findByMemberId).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
