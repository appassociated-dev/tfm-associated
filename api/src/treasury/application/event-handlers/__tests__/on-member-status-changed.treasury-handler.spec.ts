import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OnMemberStatusChangedTreasuryHandler } from '../on-member-status-changed.treasury-handler';
import { MemberStatusChangedEvent } from '../../../../membership/domain/events/member-status-changed.event';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un MemberStatusChangedEvent. */
function makeEvent(): MemberStatusChangedEvent {
  return new MemberStatusChangedEvent({
    payload: {
      memberId: MEMBER_ID,
      previousStatus: 'ACTIVE',
      newStatus: 'PENDING_PAYMENT',
      reason: 'Cuota impagada',
      changedBy: 'SYSTEM',
      changedAt: new Date('2026-03-01'),
    },
    aggregateId: MEMBER_ID,
    aggregateType: 'Member',
    boundedContext: 'BC-Membership',
    tenantId: TENANT_ID,
  });
}

describe('OnMemberStatusChangedTreasuryHandler (stub diferido)', () => {
  let handler: OnMemberStatusChangedTreasuryHandler;
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    commandBus = { execute: vi.fn() };
    handler = new OnMemberStatusChangedTreasuryHandler(commandBus as unknown as CommandBus);

    // Espiar el logger para verificar el mensaje de diferimiento
    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  it('debería resolver sin despachar ningún comando (stub no-op)', async () => {
    // Arrange
    const event = makeEvent();

    // Act
    await handler.handle(event);

    // Assert: no se despachó ningún comando
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('debería registrar el motivo de diferimiento en el logger', async () => {
    // Arrange
    const event = makeEvent();

    // Act
    await handler.handle(event);

    // Assert: el logger emite el mensaje de diferimiento
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('chargeGenerationSuspended'));
  });
});
