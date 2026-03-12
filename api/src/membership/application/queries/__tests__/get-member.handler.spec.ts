import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetMemberHandler } from '../get-member.handler';
import { GetMemberQuery } from '../get-member.query';
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
import { BankDetails } from '../../../domain/value-objects/bank-details';
import { CustomFields } from '../../../domain/value-objects/custom-fields';
import { MemberNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const MEMBER_TYPE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function createFullMember(): Member {
  const personalData = PersonalData.create({
    name: 'Juan',
    surnames: 'García López',
    birthDate: new Date('1990-05-15'),
  });
  const contactData = ContactData.create({
    email: 'juan.garcia@ejemplo.com',
    phone: '+34666123456',
    address: 'Calle Mayor 1',
    postalCode: '28001',
    city: 'Madrid',
  });
  const doc = IdentityDocument.create(DocumentType.DNI, '12345678Z');
  const memberNumber = MemberNumber.fromString('00001');
  const bank = BankDetails.create('ES9121000418450200051332');
  const customFields = CustomFields.create({});

  return Member.reconstitute({
    id: MemberId.fromString(MEMBER_ID),
    memberTypeId: MemberTypeId.fromString(MEMBER_TYPE_ID),
    currentStatus: MemberStatus.ACTIVE,
    statusHistory: [],
    version: 0,
    memberNumber: memberNumber.ok ? memberNumber.value : undefined,
    personalData: personalData.ok ? personalData.value : undefined,
    contactData: contactData.ok ? contactData.value : undefined,
    identityDocument: doc.ok ? doc.value : undefined,
    bankDetails: bank.ok ? bank.value : null,
    customFields: customFields.ok ? customFields.value : undefined,
    registrationDate: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-10T15:30:00.000Z'),
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

describe('GetMemberHandler', () => {
  let handler: GetMemberHandler;
  let memberRepository: MemberRepository;
  let memberTypeRepository: MemberTypeRepository;

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue(createFullMember()),
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

    memberTypeRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(createMemberType()),
      findByCode: vi.fn(),
      findAll: vi.fn(),
      existsByCode: vi.fn(),
      existsAsTransitionTarget: vi.fn(),
    };

    handler = new GetMemberHandler(memberRepository, memberTypeRepository);
  });

  it('debería retornar la ficha completa del socio', async () => {
    const query = new GetMemberQuery(TENANT_ID, MEMBER_ID);

    const result = await handler.execute(query);

    expect(result.id).toBe(MEMBER_ID);
    expect(result.name).toBe('Juan');
    expect(result.surnames).toBe('García López');
    expect(result.email).toBe('juan.garcia@ejemplo.com');
    expect(result.documentType).toBe('DNI');
    expect(result.documentNumber).toBe('12345678Z');
    expect(result.memberTypeName).toBe('Socio Numerario');
    expect(result.currentStatus).toBe('ACTIVE');
  });

  it('debería enmascarar el IBAN en la respuesta', async () => {
    const query = new GetMemberQuery(TENANT_ID, MEMBER_ID);

    const result = await handler.execute(query);

    expect(result.ibanMasked).toBe('ES91****************1332');
  });

  it('debería lanzar error si el socio no existe (404)', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetMemberQuery(TENANT_ID, MEMBER_ID);

    await expect(handler.execute(query)).rejects.toThrow(MemberNotFoundError);
  });

  it('debería establecer tenantId en los repositorios', async () => {
    const query = new GetMemberQuery(TENANT_ID, MEMBER_ID);

    await handler.execute(query);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });

  it('debería devolver createdAt y updatedAt desde persistencia', async () => {
    const query = new GetMemberQuery(TENANT_ID, MEMBER_ID);

    const result = await handler.execute(query);

    expect(result.createdAt.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    expect(result.updatedAt.toISOString()).toBe('2024-01-10T15:30:00.000Z');
  });
});
