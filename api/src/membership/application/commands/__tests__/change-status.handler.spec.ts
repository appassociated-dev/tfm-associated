import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChangeStatusHandler } from '../change-status.handler';
import { ChangeStatusCommand } from '../change-status.command';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { StatusHistoryRepository } from '../../../domain/repositories/status-history.repository';
import { Member } from '../../../domain/aggregates/member';
import { MemberTypeId } from '../../../domain/value-objects/member-type-id';
import { MemberId } from '../../../domain/value-objects/member-id';
import { MemberStatus } from '../../../domain/value-objects/member-status';
import { MemberNotFoundError, OptimisticLockingError } from '../../../domain/exceptions';
import { TransitionNotAllowedError } from '../../../domain/exceptions';

/** Helper: crea un Member reconstituido en estado ACTIVE con versión 0. */
function createActiveMember(id?: string): Member {
  const memberId = id ? MemberId.fromString(id) : MemberId.create();
  return Member.reconstitute({
    id: memberId,
    memberTypeId: MemberTypeId.create(),
    currentStatus: MemberStatus.ACTIVE,
    statusHistory: [],
    version: 0,
  });
}

/** Helper: crea un Member reconstituido en estado DECEASED (inmutable). */
function createDeceasedMember(): Member {
  return Member.reconstitute({
    id: MemberId.create(),
    memberTypeId: MemberTypeId.create(),
    currentStatus: MemberStatus.DECEASED,
    statusHistory: [],
    version: 0,
  });
}

describe('ChangeStatusHandler', () => {
  let handler: ChangeStatusHandler;
  let memberRepository: MemberRepository;
  let statusHistoryRepository: StatusHistoryRepository;

  const TENANT_ID = 'tenant-uuid-1234';
  const MEMBER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const CHANGED_BY = 'user-uuid-5678';

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findByStatus: vi.fn(),
      findActiveMembers: vi.fn(),
      findMembersWithOverduePayments: vi.fn(),
    };

    statusHistoryRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findByMemberId: vi.fn(),
    };

    handler = new ChangeStatusHandler(memberRepository, statusHistoryRepository);
  });

  it('debería cambiar el estado de un socio exitosamente', async () => {
    const member = createActiveMember(MEMBER_ID);
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);

    const command = new ChangeStatusCommand(
      TENANT_ID,
      MEMBER_ID,
      'PENDING_PAYMENT',
      'Impago de cuotas durante más de 90 días',
      CHANGED_BY,
    );

    const result = await handler.execute(command);

    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.previousStatus).toBe('ACTIVE');
    expect(result.newStatus).toBe('PENDING_PAYMENT');
    expect(result.changedAt).toBeInstanceOf(Date);
    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(statusHistoryRepository.save).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar error si el socio no se encuentra', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = new ChangeStatusCommand(
      TENANT_ID,
      MEMBER_ID,
      'SUSPENDED',
      'Sanción disciplinaria',
      CHANGED_BY,
    );

    await expect(handler.execute(command)).rejects.toThrow(MemberNotFoundError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si la transición no está permitida', async () => {
    const member = createDeceasedMember();
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);

    const command = new ChangeStatusCommand(
      TENANT_ID,
      member.id.toValue(),
      'ACTIVE',
      'Intento de reactivar fallecido',
      CHANGED_BY,
    );

    await expect(handler.execute(command)).rejects.toThrow(TransitionNotAllowedError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si el motivo es demasiado corto', async () => {
    const member = createActiveMember(MEMBER_ID);
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);

    const command = new ChangeStatusCommand(
      TENANT_ID,
      MEMBER_ID,
      'SUSPENDED',
      'ab', // Menos de 3 caracteres
      CHANGED_BY,
    );

    await expect(handler.execute(command)).rejects.toThrow();
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería reintentar una vez si falla por optimistic locking', async () => {
    const member1 = createActiveMember(MEMBER_ID);
    const member2 = createActiveMember(MEMBER_ID);

    // Primera llamada: devuelve member1, save lanza OptimisticLockingError
    // Segunda llamada: devuelve member2, save exitoso
    (memberRepository.findById as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(member1)
      .mockResolvedValueOnce(member2);

    (memberRepository.save as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new OptimisticLockingError(MEMBER_ID))
      .mockResolvedValueOnce(undefined);

    const command = new ChangeStatusCommand(
      TENANT_ID,
      MEMBER_ID,
      'PENDING_PAYMENT',
      'Impago de cuotas detectado',
      CHANGED_BY,
    );

    const result = await handler.execute(command);

    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.newStatus).toBe('PENDING_PAYMENT');
    expect(memberRepository.findById).toHaveBeenCalledTimes(2);
    expect(memberRepository.save).toHaveBeenCalledTimes(2);
  });

  it('debería establecer tenantId en ambos repositorios', async () => {
    const member = createActiveMember(MEMBER_ID);
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);

    const command = new ChangeStatusCommand(
      TENANT_ID,
      MEMBER_ID,
      'SUSPENDED',
      'Sanción por comportamiento',
      CHANGED_BY,
    );

    await handler.execute(command);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(statusHistoryRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
