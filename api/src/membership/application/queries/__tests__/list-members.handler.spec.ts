import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListMembersHandler } from '../list-members.handler';
import { ListMembersQuery } from '../list-members.query';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import { Member } from '../../../domain/aggregates/member';
import { MemberType } from '../../../domain/aggregates/member-type';
import { MemberId } from '../../../domain/value-objects/member-id';
import { MemberTypeId } from '../../../domain/value-objects/member-type-id';
import { MemberStatus } from '../../../domain/value-objects/member-status';
import { MemberNumber } from '../../../domain/value-objects/member-number';
import { PersonalData } from '../../../domain/value-objects/personal-data';
import { ContactData } from '../../../domain/value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../../../domain/value-objects/identity-document';
import { CustomFields } from '../../../domain/value-objects/custom-fields';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_TYPE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Helper: crea un Member para listados. */
function createMemberForList(
  overrides: Partial<{ name: string; status: MemberStatus; email: string }> = {},
): Member {
  const personalData = PersonalData.create({
    name: overrides.name ?? 'Juan',
    surnames: 'García',
    birthDate: new Date('1990-01-01'),
  });
  const contactData = ContactData.create({
    email: overrides.email ?? 'juan@test.com',
    phone: null,
    address: null,
    postalCode: null,
    city: null,
  });
  const doc = IdentityDocument.create(DocumentType.DNI, '12345678Z');
  const memberNumber = MemberNumber.fromString('00001');
  const customFields = CustomFields.create({});

  return Member.reconstitute({
    id: MemberId.create(),
    memberTypeId: MemberTypeId.fromString(MEMBER_TYPE_ID),
    currentStatus: overrides.status ?? MemberStatus.ACTIVE,
    statusHistory: [],
    version: 0,
    memberNumber: memberNumber.ok ? memberNumber.value : undefined,
    personalData: personalData.ok ? personalData.value : undefined,
    contactData: contactData.ok ? contactData.value : undefined,
    identityDocument: doc.ok ? doc.value : undefined,
    customFields: customFields.ok ? customFields.value : undefined,
    registrationDate: new Date('2024-01-01'),
  });
}

function createMemberType(): MemberType {
  return MemberType.reconstitute({
    id: MEMBER_TYPE_ID,
    code: 'NUMERARIO',
    name: 'Socio Numerario',
    description: 'Socio de pleno derecho',
    ageRangeMin: null,
    ageRangeMax: null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    automaticTransitionTargetId: null,
    rulesConfig: {},
    collectivityType: 'COFRADIA',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ListMembersHandler', () => {
  let handler: ListMembersHandler;
  let memberRepository: MemberRepository;
  let memberTypeRepository: MemberTypeRepository;

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
      findAll: vi.fn().mockResolvedValue([]),
      existsByIdentityDocument: vi.fn(),
      existsByEmail: vi.fn(),
      getNextMemberNumber: vi.fn(),
    };

    memberTypeRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findAll: vi.fn().mockResolvedValue([createMemberType()]),
      existsByCode: vi.fn(),
      existsAsTransitionTarget: vi.fn(),
    };

    handler = new ListMembersHandler(memberRepository, memberTypeRepository);
  });

  it('debería retornar lista vacía cuando no hay socios', async () => {
    const query = new ListMembersQuery(TENANT_ID);

    const result = await handler.execute(query);

    expect(result).toEqual([]);
  });

  it('debería retornar socios mapeados a MemberListResponseDto', async () => {
    const members = [createMemberForList({ name: 'Juan' }), createMemberForList({ name: 'María' })];
    (memberRepository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue(members);

    const query = new ListMembersQuery(TENANT_ID);

    const result = await handler.execute(query);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Juan');
    expect(result[1].name).toBe('María');
    expect(result[0].memberTypeName).toBe('Socio Numerario');
  });

  it('debería pasar filtros al repositorio', async () => {
    const query = new ListMembersQuery(TENANT_ID, 'ACTIVE', MEMBER_TYPE_ID, 'García');

    await handler.execute(query);

    expect(memberRepository.findAll).toHaveBeenCalledWith({
      status: 'ACTIVE',
      memberTypeId: MEMBER_TYPE_ID,
      search: 'García',
    });
  });

  it('debería establecer tenantId en los repositorios', async () => {
    const query = new ListMembersQuery(TENANT_ID);

    await handler.execute(query);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
