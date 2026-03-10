import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CheckDniHandler } from '../check-dni.handler';
import { CheckDniQuery } from '../check-dni.query';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { Member } from '../../../domain/aggregates/member';
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

/** Crea un Member reconstituido para simular existente. */
function createExistingMember(
  overrides: Partial<{
    name: string;
    surnames: string;
    docNumber: string;
    memberNumber: string;
  }> = {},
): Member {
  const personalData = PersonalData.create({
    name: overrides.name ?? 'Juan',
    surnames: overrides.surnames ?? 'García López',
    birthDate: new Date('1990-01-01'),
  });
  const contactData = ContactData.create({
    email: 'juan@test.com',
    phone: null,
    address: null,
    postalCode: null,
    city: null,
  });
  const doc = IdentityDocument.create(DocumentType.DNI, overrides.docNumber ?? '12345678Z');
  const memberNumber = MemberNumber.fromString(overrides.memberNumber ?? '00042');
  const customFields = CustomFields.create({});

  return Member.reconstitute({
    id: MemberId.create(),
    memberTypeId: MemberTypeId.fromString(MEMBER_TYPE_ID),
    currentStatus: MemberStatus.ACTIVE,
    statusHistory: [],
    version: 0,
    memberNumber: memberNumber.ok ? memberNumber.value : undefined,
    personalData: personalData.ok ? personalData.value : undefined,
    contactData: contactData.ok ? contactData.value : undefined,
    identityDocument: doc.ok ? doc.value : undefined,
    customFields: customFields.ok ? customFields.value : undefined,
    registrationDate: new Date(),
  });
}

describe('CheckDniHandler', () => {
  let handler: CheckDniHandler;
  let memberRepository: MemberRepository;

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      findByStatus: vi.fn(),
      findActiveMembers: vi.fn(),
      findMembersWithOverduePayments: vi.fn(),
      findByIdentityDocument: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      existsByIdentityDocument: vi.fn(),
      existsByEmail: vi.fn(),
      getNextMemberNumber: vi.fn(),
    };

    handler = new CheckDniHandler(memberRepository);
  });

  it('should return exists=true with member data when DNI exists', async () => {
    const existingMember = createExistingMember({
      name: 'Juan',
      surnames: 'García López',
      memberNumber: '00042',
    });
    (memberRepository.findByIdentityDocument as ReturnType<typeof vi.fn>).mockResolvedValue(
      existingMember,
    );

    const query = new CheckDniQuery(TENANT_ID, 'DNI', '12345678Z');
    const result = await handler.execute(query);

    expect(result.exists).toBe(true);
    expect(result.memberName).toBe('Juan García López');
    expect(result.memberNumber).toBe('00042');
    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });

  it('should return exists=false when DNI does not exist', async () => {
    (memberRepository.findByIdentityDocument as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new CheckDniQuery(TENANT_ID, 'DNI', '87654321X');
    const result = await handler.execute(query);

    expect(result.exists).toBe(false);
    expect(result.memberName).toBeUndefined();
    expect(result.memberNumber).toBeUndefined();
  });

  it('should throw validation error for invalid DNI format', async () => {
    const query = new CheckDniQuery(TENANT_ID, 'DNI', 'INVALID');

    await expect(handler.execute(query)).rejects.toThrow();
    expect(memberRepository.findByIdentityDocument).not.toHaveBeenCalled();
  });

  it('should set tenantId on the repository', async () => {
    const query = new CheckDniQuery(TENANT_ID, 'DNI', '12345678Z');

    await handler.execute(query);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
