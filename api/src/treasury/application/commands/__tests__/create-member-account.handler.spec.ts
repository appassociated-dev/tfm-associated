import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateMemberAccountHandler } from '../create-member-account.handler';
import { CreateMemberAccountCommand } from '../create-member-account.command';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { IntegrationEventPublisher } from '../../../../shared/application/ports/integration-event.publisher';
import { MemberAccount } from '../../../domain/aggregates/member-account';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un comando válido con overrides opcionales. */
function validCommand(
  overrides: Partial<{ tenantId: string; memberId: string }> = {},
): CreateMemberAccountCommand {
  return new CreateMemberAccountCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.memberId ?? MEMBER_ID,
  );
}

describe('CreateMemberAccountHandler', () => {
  let handler: CreateMemberAccountHandler;
  let memberAccountRepository: MemberAccountRepository;
  let outboxPublisher: IntegrationEventPublisher;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByMemberId: vi.fn().mockResolvedValue(null),
      existsByMemberId: vi.fn().mockResolvedValue(false),
      findAllWithActiveSubscriptions: vi.fn().mockResolvedValue([]),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new CreateMemberAccountHandler(memberAccountRepository, outboxPublisher);
  });

  it('debería crear y persistir una MemberAccount cuando el socio no tiene cuenta (happy path)', async () => {
    // Arrange: el socio aún no tiene cuenta
    (memberAccountRepository.existsByMemberId as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const command = validCommand();

    // Act
    await handler.execute(command);

    // Assert: setTenantId llamado antes de cualquier operación de repo
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);

    // Assert: se comprobó idempotencia
    expect(memberAccountRepository.existsByMemberId).toHaveBeenCalledWith(MEMBER_ID);

    // Assert: se persistió la cuenta
    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
    const savedAccount = (memberAccountRepository.save as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as MemberAccount;
    expect(savedAccount).toBeInstanceOf(MemberAccount);
    expect(savedAccount.memberId).toBe(MEMBER_ID);
    expect(savedAccount.tenantId).toBe(TENANT_ID);
  });

  it('debería retornar sin guardar cuando ya existe una cuenta para el socio (idempotencia)', async () => {
    // Arrange: el socio ya tiene cuenta
    (memberAccountRepository.existsByMemberId as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const command = validCommand();

    // Act
    await handler.execute(command);

    // Assert: no se persistió nada
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
    expect(outboxPublisher.publish).not.toHaveBeenCalled();
  });

  it('debería lanzar un error cuando el memberId está vacío (validación de dominio)', async () => {
    // Arrange: comando con memberId vacío
    const command = validCommand({ memberId: '' });

    // Act & Assert: MemberAccount.create rechaza memberId vacío
    await expect(handler.execute(command)).rejects.toThrow(
      'El identificador del socio (memberId) no puede estar vacío.',
    );

    // Assert: no se persistió nada
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });
});
