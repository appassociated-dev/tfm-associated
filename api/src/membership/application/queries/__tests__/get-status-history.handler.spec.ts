import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetStatusHistoryHandler } from '../get-status-history.handler';
import { GetStatusHistoryQuery } from '../get-status-history.query';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { StatusHistoryRepository } from '../../../domain/repositories/status-history.repository';
import { Member } from '../../../domain/aggregates/member';
import { StatusHistory } from '../../../domain/entities/status-history';
import { MemberTypeId } from '../../../domain/value-objects/member-type-id';
import { MemberId } from '../../../domain/value-objects/member-id';
import { MemberStatus } from '../../../domain/value-objects/member-status';
import { StatusChangeReason } from '../../../domain/value-objects/status-change-reason';
import { MemberNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Helper: crea un Member reconstituido en estado ACTIVE. */
function createActiveMember(): Member {
  return Member.reconstitute({
    id: MemberId.fromString(MEMBER_ID),
    memberTypeId: MemberTypeId.create(),
    currentStatus: MemberStatus.ACTIVE,
    statusHistory: [],
    version: 1,
  });
}

/** Helper: crea una entrada de StatusHistory reconstituida. */
function createStatusHistoryEntry(
  previousStatus: MemberStatus,
  newStatus: MemberStatus,
): StatusHistory {
  const reason = StatusChangeReason.create('Motivo de prueba válido');
  if (!reason.ok) throw reason.error;

  return StatusHistory.reconstitute({
    id: 'history-uuid-1234',
    memberId: MemberId.fromString(MEMBER_ID),
    previousStatus,
    newStatus,
    reason: reason.value,
    changedBy: 'user-uuid-5678',
    changedAt: new Date('2025-06-15T10:00:00Z'),
  });
}

describe('GetStatusHistoryHandler', () => {
  let handler: GetStatusHistoryHandler;
  let memberRepository: MemberRepository;
  let statusHistoryRepository: StatusHistoryRepository;

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      findByStatus: vi.fn(),
      findActiveMembers: vi.fn(),
      findMembersWithOverduePayments: vi.fn(),
    };

    statusHistoryRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findByMemberId: vi.fn().mockResolvedValue([]),
    };

    handler = new GetStatusHistoryHandler(memberRepository, statusHistoryRepository);
  });

  it('debería retornar el historial de estados de un socio', async () => {
    const member = createActiveMember();
    const entry = createStatusHistoryEntry(MemberStatus.APPLICANT, MemberStatus.ACTIVE);

    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);
    (statusHistoryRepository.findByMemberId as ReturnType<typeof vi.fn>).mockResolvedValue([entry]);

    const query = new GetStatusHistoryQuery(TENANT_ID, MEMBER_ID);
    const result = await handler.execute(query);

    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.currentStatus).toBe('ACTIVE');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].previousStatus).toBe('APPLICANT');
    expect(result.entries[0].newStatus).toBe('ACTIVE');
    expect(result.entries[0].reason).toBe('Motivo de prueba válido');
    expect(result.entries[0].changedBy).toBe('user-uuid-5678');
  });

  it('debería retornar array vacío si no hay historial', async () => {
    const member = createActiveMember();
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);
    (statusHistoryRepository.findByMemberId as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const query = new GetStatusHistoryQuery(TENANT_ID, MEMBER_ID);
    const result = await handler.execute(query);

    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.currentStatus).toBe('ACTIVE');
    expect(result.entries).toHaveLength(0);
  });

  it('debería lanzar error si el socio no se encuentra', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetStatusHistoryQuery(TENANT_ID, MEMBER_ID);

    await expect(handler.execute(query)).rejects.toThrow(MemberNotFoundError);
  });

  it('debería establecer tenantId en ambos repositorios', async () => {
    const member = createActiveMember();
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);

    const query = new GetStatusHistoryQuery(TENANT_ID, MEMBER_ID);
    await handler.execute(query);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(statusHistoryRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
