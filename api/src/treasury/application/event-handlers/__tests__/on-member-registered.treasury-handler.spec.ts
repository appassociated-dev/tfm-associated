import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandBus } from '@nestjs/cqrs';
import { OnMemberRegisteredTreasuryHandler } from '../on-member-registered.treasury-handler';
import { CreateMemberAccountCommand } from '../../commands/create-member-account.command';
import { MemberRegisteredEvent } from '../../../../membership/domain/events/member-registered.event';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un MemberRegisteredEvent con overrides opcionales. */
function makeEvent(overrides: { tenantId?: string } = {}): MemberRegisteredEvent {
  return new MemberRegisteredEvent({
    payload: {
      memberId: MEMBER_ID,
      memberNumber: 'M-001',
      name: 'Juan',
      surnames: 'García',
      email: 'juan@example.com',
      memberTypeId: 'type-uuid-001',
      registrationDate: new Date('2026-01-15'),
    },
    aggregateId: MEMBER_ID,
    aggregateType: 'Member',
    boundedContext: 'BC-Membership',
    tenantId: overrides.tenantId,
  });
}

describe('OnMemberRegisteredTreasuryHandler', () => {
  let handler: OnMemberRegisteredTreasuryHandler;
  let commandBus: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    commandBus = { execute: vi.fn().mockResolvedValue(undefined) };
    handler = new OnMemberRegisteredTreasuryHandler(commandBus as unknown as CommandBus);
  });

  it('debería despachar CreateMemberAccountCommand con tenantId y memberId correctos (happy path)', async () => {
    // Arrange
    const event = makeEvent({ tenantId: TENANT_ID });

    // Act
    await handler.handle(event);

    // Assert: se despachó el comando con los argumentos esperados
    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        memberId: MEMBER_ID,
      }),
    );
    const cmd = (commandBus.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(cmd).toBeInstanceOf(CreateMemberAccountCommand);
  });

  it('debería absorber el error si commandBus.execute lanza (aislamiento de errores)', async () => {
    // Arrange: el bus lanza un error inesperado
    commandBus.execute.mockRejectedValue(new Error('DB connection lost'));
    const event = makeEvent({ tenantId: TENANT_ID });

    // Act & Assert: handle() NO debe lanzar
    await expect(handler.handle(event)).resolves.not.toThrow();
    expect(commandBus.execute).toHaveBeenCalledOnce();
  });

  it('debería ignorar el evento y no despachar comando si falta tenantId', async () => {
    // Arrange: evento sin tenantId
    const event = makeEvent({ tenantId: undefined });

    // Act
    await handler.handle(event);

    // Assert: no se despachó ningún comando
    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
