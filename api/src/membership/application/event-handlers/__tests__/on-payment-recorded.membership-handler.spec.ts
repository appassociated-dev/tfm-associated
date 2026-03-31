import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '@nestjs/cqrs';
import { OnPaymentRecordedMembershipHandler } from '../on-payment-recorded.membership-handler';
import { ChangeStatusCommand } from '../../commands/change-status.command';
import { PaymentRecordedEvent } from '../../../../treasury/domain/events/payment-recorded.event';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { Member } from '../../../domain/aggregates/member';
import { MemberStatus } from '../../../domain/value-objects/member-status';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CHARGE_ID = 'charge-uuid-5678';
const PAYMENT_ID = 'payment-uuid-9012';
const MEMBER_ACCOUNT_ID = 'account-uuid-3456';

/** Crea un PaymentRecordedEvent con overrides opcionales. */
function makeEvent(
  overrides: { tenantId?: string; chargeNewStatus?: string } = {},
): PaymentRecordedEvent {
  return new PaymentRecordedEvent({
    payload: {
      paymentId: PAYMENT_ID,
      chargeId: CHARGE_ID,
      memberAccountId: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      amount: 50,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date('2026-03-01'),
      paymentReference: 'REF-001',
      chargeNewStatus: overrides.chargeNewStatus ?? 'PAID',
    },
    aggregateId: MEMBER_ACCOUNT_ID,
    aggregateType: 'MemberAccount',
    boundedContext: 'BC-Treasury',
    tenantId: overrides.tenantId,
  });
}

/** Crea un stub de Member con el estado dado. */
function makeMemberStub(status: string): Partial<Member> {
  return {
    getCurrentStatus: () => MemberStatus.fromString(status),
  };
}

describe('OnPaymentRecordedMembershipHandler', () => {
  let handler: OnPaymentRecordedMembershipHandler;
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let memberRepo: { setTenantId: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    commandBus = { execute: vi.fn().mockResolvedValue(undefined) };
    memberRepo = {
      setTenantId: vi.fn(),
      findById: vi.fn(),
    };
    handler = new OnPaymentRecordedMembershipHandler(
      commandBus as unknown as CommandBus,
      memberRepo as unknown as MemberRepository,
    );
  });

  it('happy path: debería despachar ChangeStatusCommand cuando chargeNewStatus=PAID y socio en PENDING_PAYMENT', async () => {
    // Arrange
    memberRepo.findById.mockResolvedValue(makeMemberStub('PENDING_PAYMENT'));
    const event = makeEvent({ tenantId: TENANT_ID, chargeNewStatus: 'PAID' });

    // Act
    await handler.handle(event);

    // Assert: se estableció tenantId en el repositorio
    expect(memberRepo.setTenantId).toHaveBeenCalledWith(TENANT_ID);

    // Assert: se consultó el socio
    expect(memberRepo.findById).toHaveBeenCalledOnce();

    // Assert: se despachó el comando con los argumentos correctos
    expect(commandBus.execute).toHaveBeenCalledOnce();
    const cmd = commandBus.execute.mock.calls[0][0];
    expect(cmd).toBeInstanceOf(ChangeStatusCommand);
    expect(cmd.tenantId).toBe(TENANT_ID);
    expect(cmd.memberId).toBe(MEMBER_ID);
    expect(cmd.newStatus).toBe('ACTIVE');
  });

  it('debería ignorar el evento si chargeNewStatus !== PAID y no despachar comando', async () => {
    // Arrange: cargo en estado distinto de PAID
    const event = makeEvent({ tenantId: TENANT_ID, chargeNewStatus: 'PENDING' });

    // Act
    await handler.handle(event);

    // Assert: no se consultó el repositorio ni se despachó ningún comando
    expect(memberRepo.findById).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('debería ignorar el evento si el socio ya está ACTIVE y no despachar comando', async () => {
    // Arrange: socio ya activo
    memberRepo.findById.mockResolvedValue(makeMemberStub('ACTIVE'));
    const event = makeEvent({ tenantId: TENANT_ID, chargeNewStatus: 'PAID' });

    // Act
    await handler.handle(event);

    // Assert: se consultó el repositorio pero no se despachó comando
    expect(memberRepo.findById).toHaveBeenCalledOnce();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('aislamiento de errores: debería resolver sin lanzar si commandBus.execute falla', async () => {
    // Arrange: repositorio devuelve socio en PENDING_PAYMENT, pero commandBus falla
    memberRepo.findById.mockResolvedValue(makeMemberStub('PENDING_PAYMENT'));
    commandBus.execute.mockRejectedValue(new Error('DB connection lost'));
    const event = makeEvent({ tenantId: TENANT_ID, chargeNewStatus: 'PAID' });

    // Act & Assert: handle() NO debe lanzar (RNF-067)
    await expect(handler.handle(event)).resolves.not.toThrow();
    expect(commandBus.execute).toHaveBeenCalledOnce();
  });

  it('debería ignorar el evento si falta tenantId y no consultar el repositorio', async () => {
    // Arrange: evento sin tenantId
    const event = makeEvent({ tenantId: undefined, chargeNewStatus: 'PAID' });

    // Act
    await handler.handle(event);

    // Assert: ni repositorio ni command bus fueron invocados
    expect(memberRepo.setTenantId).not.toHaveBeenCalled();
    expect(memberRepo.findById).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
