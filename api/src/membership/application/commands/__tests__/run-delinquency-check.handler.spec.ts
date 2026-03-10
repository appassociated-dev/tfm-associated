import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RunDelinquencyCheckHandler } from '../run-delinquency-check.handler';
import { RunDelinquencyCheckCommand } from '../run-delinquency-check.command';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { StatusHistoryRepository } from '../../../domain/repositories/status-history.repository';
import { ErrorReporter } from '../../../../shared/domain/ports/error-reporter.port';
import { Member } from '../../../domain/aggregates/member';
import { MemberTypeId } from '../../../domain/value-objects/member-type-id';
import { MemberId } from '../../../domain/value-objects/member-id';
import { MemberStatus } from '../../../domain/value-objects/member-status';

/** Helper: crea un Member reconstituido en un estado dado. */
function createMemberWithStatus(status: MemberStatus): Member {
  return Member.reconstitute({
    id: MemberId.create(),
    memberTypeId: MemberTypeId.create(),
    currentStatus: status,
    statusHistory: [],
    version: 0,
  });
}

describe('RunDelinquencyCheckHandler', () => {
  let handler: RunDelinquencyCheckHandler;
  let memberRepository: MemberRepository;
  let statusHistoryRepository: StatusHistoryRepository;
  let errorReporter: ErrorReporter;

  const TENANT_ID = 'tenant-uuid-1234';

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findByStatus: vi.fn(),
      findActiveMembers: vi.fn(),
      findMembersWithOverduePayments: vi.fn().mockResolvedValue([]),
    };

    statusHistoryRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findByMemberId: vi.fn(),
    };

    errorReporter = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
    };

    handler = new RunDelinquencyCheckHandler(
      memberRepository,
      statusHistoryRepository,
      errorReporter,
    );
  });

  it('debería transicionar todos los socios morosos activos', async () => {
    const members = [
      createMemberWithStatus(MemberStatus.ACTIVE),
      createMemberWithStatus(MemberStatus.ACTIVE),
      createMemberWithStatus(MemberStatus.ACTIVE),
    ];

    (memberRepository.findMembersWithOverduePayments as ReturnType<typeof vi.fn>).mockResolvedValue(
      members,
    );

    const command = new RunDelinquencyCheckCommand(TENANT_ID, 90);
    const result = await handler.execute(command);

    expect(result.processedCount).toBe(3);
    expect(result.transitionedCount).toBe(3);
    expect(result.errors).toHaveLength(0);
    expect(memberRepository.save).toHaveBeenCalledTimes(3);
    expect(statusHistoryRepository.save).toHaveBeenCalledTimes(3);
  });

  it('debería omitir socios que ya están en PENDING_PAYMENT', async () => {
    const members = [
      createMemberWithStatus(MemberStatus.ACTIVE),
      createMemberWithStatus(MemberStatus.PENDING_PAYMENT), // Ya en PENDING_PAYMENT
      createMemberWithStatus(MemberStatus.ACTIVE),
    ];

    (memberRepository.findMembersWithOverduePayments as ReturnType<typeof vi.fn>).mockResolvedValue(
      members,
    );

    const command = new RunDelinquencyCheckCommand(TENANT_ID, 90);
    const result = await handler.execute(command);

    // Solo 2 activos procesados (el PENDING_PAYMENT se filtra)
    expect(result.processedCount).toBe(2);
    expect(result.transitionedCount).toBe(2);
    expect(result.errors).toHaveLength(0);
    expect(memberRepository.save).toHaveBeenCalledTimes(2);
  });

  it('debería continuar procesando si un socio falla y reportar el error', async () => {
    const members = [
      createMemberWithStatus(MemberStatus.ACTIVE),
      createMemberWithStatus(MemberStatus.ACTIVE),
      createMemberWithStatus(MemberStatus.ACTIVE),
    ];

    (memberRepository.findMembersWithOverduePayments as ReturnType<typeof vi.fn>).mockResolvedValue(
      members,
    );

    // El segundo save falla
    (memberRepository.save as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('DB connection lost'))
      .mockResolvedValueOnce(undefined);

    const command = new RunDelinquencyCheckCommand(TENANT_ID, 90);
    const result = await handler.execute(command);

    expect(result.processedCount).toBe(3);
    expect(result.transitionedCount).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error).toBe('DB connection lost');
    expect(errorReporter.captureException).toHaveBeenCalledTimes(1);
  });

  it('debería retornar resultado vacío si no hay socios morosos', async () => {
    (memberRepository.findMembersWithOverduePayments as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );

    const command = new RunDelinquencyCheckCommand(TENANT_ID, 90);
    const result = await handler.execute(command);

    expect(result.processedCount).toBe(0);
    expect(result.transitionedCount).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería establecer tenantId en ambos repositorios', async () => {
    const command = new RunDelinquencyCheckCommand(TENANT_ID, 60);
    await handler.execute(command);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(statusHistoryRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
