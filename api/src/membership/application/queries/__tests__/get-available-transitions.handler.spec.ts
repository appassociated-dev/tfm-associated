import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetAvailableTransitionsHandler } from '../get-available-transitions.handler';
import { GetAvailableTransitionsQuery } from '../get-available-transitions.query';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { Member } from '../../../domain/aggregates/member';
import { MemberTypeId } from '../../../domain/value-objects/member-type-id';
import { MemberId } from '../../../domain/value-objects/member-id';
import { MemberStatus } from '../../../domain/value-objects/member-status';
import { MemberNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Helper: crea un Member reconstituido en un estado dado. */
function createMemberWithStatus(status: MemberStatus): Member {
  return Member.reconstitute({
    id: MemberId.fromString(MEMBER_ID),
    memberTypeId: MemberTypeId.create(),
    currentStatus: status,
    statusHistory: [],
    version: 0,
  });
}

describe('GetAvailableTransitionsHandler', () => {
  let handler: GetAvailableTransitionsHandler;
  let memberRepository: MemberRepository;

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      findByStatus: vi.fn(),
      findActiveMembers: vi.fn(),
      findMembersWithOverduePayments: vi.fn(),
      findByIdentityDocument: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      existsByIdentityDocument: vi.fn(),
      existsByEmail: vi.fn(),
      getNextMemberNumber: vi.fn(),
    };

    handler = new GetAvailableTransitionsHandler(memberRepository);
  });

  it('debería retornar 3 transiciones para un socio ACTIVE', async () => {
    const member = createMemberWithStatus(MemberStatus.ACTIVE);
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);

    const query = new GetAvailableTransitionsQuery(TENANT_ID, MEMBER_ID);
    const result = await handler.execute(query);

    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.currentStatus).toBe('ACTIVE');
    expect(result.availableTransitions).toHaveLength(3);

    const statuses = result.availableTransitions.map((t) => t.status);
    expect(statuses).toContain('PENDING_PAYMENT');
    expect(statuses).toContain('SUSPENDED');
    expect(statuses).toContain('VOLUNTARY_LEAVE');

    // Verificar que cada transición tiene descripción concreta
    for (const transition of result.availableTransitions) {
      expect(typeof transition.description).toBe('string');
      expect(transition.description.length).toBeGreaterThan(5);
    }
  });

  it('debería retornar array vacío para un socio DECEASED', async () => {
    const member = createMemberWithStatus(MemberStatus.DECEASED);
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);

    const query = new GetAvailableTransitionsQuery(TENANT_ID, MEMBER_ID);
    const result = await handler.execute(query);

    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.currentStatus).toBe('DECEASED');
    expect(result.availableTransitions).toHaveLength(0);
  });

  it('debería lanzar error si el socio no se encuentra', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetAvailableTransitionsQuery(TENANT_ID, MEMBER_ID);

    await expect(handler.execute(query)).rejects.toThrow(MemberNotFoundError);
  });

  it('debería retornar 2 transiciones para un socio APPLICANT', async () => {
    const member = createMemberWithStatus(MemberStatus.APPLICANT);
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);

    const query = new GetAvailableTransitionsQuery(TENANT_ID, MEMBER_ID);
    const result = await handler.execute(query);

    expect(result.availableTransitions).toHaveLength(2);
    const statuses = result.availableTransitions.map((t) => t.status);
    expect(statuses).toContain('ACTIVE');
    expect(statuses).toContain('VOLUNTARY_LEAVE');
  });

  it('debería establecer tenantId en el repositorio', async () => {
    const member = createMemberWithStatus(MemberStatus.ACTIVE);
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(member);

    const query = new GetAvailableTransitionsQuery(TENANT_ID, MEMBER_ID);
    await handler.execute(query);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
