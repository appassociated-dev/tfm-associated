import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { OnMemberDataUpdatedTreasuryHandler } from '../on-member-data-updated.treasury-handler';
import { MemberDataUpdatedEvent } from '../../../../membership/domain/events/member-data-updated.event';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un MemberDataUpdatedEvent. */
function makeEvent(): MemberDataUpdatedEvent {
  return new MemberDataUpdatedEvent({
    payload: {
      memberId: MEMBER_ID,
      modifiedFields: ['email'],
      newEmail: 'nuevo@example.com',
      ibanChanged: false,
      updateDate: new Date('2026-03-01'),
    },
    aggregateId: MEMBER_ID,
    aggregateType: 'Member',
    boundedContext: 'BC-Membership',
    tenantId: TENANT_ID,
  });
}

describe('OnMemberDataUpdatedTreasuryHandler (stub diferido)', () => {
  let handler: OnMemberDataUpdatedTreasuryHandler;
  let commandBus: { execute: ReturnType<typeof vi.fn> };
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    commandBus = { execute: vi.fn() };
    handler = new OnMemberDataUpdatedTreasuryHandler(commandBus as unknown as CommandBus);

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

  it('debería registrar el mensaje de diferimiento en el logger', async () => {
    // Arrange
    const event = makeEvent();

    // Act
    await handler.handle(event);

    // Assert: el logger emite el mensaje de diferimiento
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('ENT-018'));
  });
});
