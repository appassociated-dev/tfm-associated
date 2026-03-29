import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateMemberHandler } from '../update-member.handler';
import { UpdateMemberCommand } from '../update-member.command';
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
import {
  MemberNotFoundError,
  EmailAlreadyExistsError,
  OptimisticLockingError,
} from '../../../domain/exceptions';
import { ErrorReporter } from '../../../../shared/domain';
import { IntegrationEventPublisher } from '../../../../shared/application/ports/integration-event.publisher';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const MEMBER_TYPE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Helper: crea un Member reconstituido con ficha completa. */
function createFullMember(overrides: Partial<{ id: string; email: string }> = {}): Member {
  const personalData = PersonalData.create({
    name: 'Juan',
    surnames: 'García López',
    birthDate: new Date('1990-05-15'),
  });
  const contactData = ContactData.create({
    email: overrides.email ?? 'juan.garcia@ejemplo.com',
    phone: '+34666123456',
    address: 'Calle Mayor 1',
    postalCode: '28001',
    city: 'Madrid',
  });
  const doc = IdentityDocument.create(DocumentType.DNI, '12345678Z');
  const memberNumber = MemberNumber.fromString('00001');
  const bank = BankDetails.create('ES9121000418450200051332');
  const customFields = CustomFields.create({ profession: 'Engineer' });

  return Member.reconstitute({
    id: MemberId.fromString(overrides.id ?? MEMBER_ID),
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
  });
}

/** Helper: crea un MemberType reconstituido. */
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

describe('UpdateMemberHandler', () => {
  let handler: UpdateMemberHandler;
  let memberRepository: MemberRepository;
  let memberTypeRepository: MemberTypeRepository;
  let errorReporter: ErrorReporter;
  let outboxPublisher: IntegrationEventPublisher;

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue(createFullMember()),
      save: vi.fn().mockResolvedValue(undefined),
      findByStatus: vi.fn(),
      findActiveMembers: vi.fn(),
      findMembersWithOverduePayments: vi.fn(),
      findByIdentityDocument: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      findAll: vi.fn().mockResolvedValue([]),
      existsByIdentityDocument: vi.fn().mockResolvedValue(false),
      existsByEmail: vi.fn().mockResolvedValue(false),
      getNextMemberNumber: vi.fn().mockResolvedValue(1),
    };

    memberTypeRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createMemberType()),
      findByCode: vi.fn(),
      findAll: vi.fn().mockResolvedValue([]),
      existsByCode: vi.fn(),
      existsAsTransitionTarget: vi.fn(),
    };

    errorReporter = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new UpdateMemberHandler(
      memberRepository,
      memberTypeRepository,
      errorReporter,
      outboxPublisher,
    );
  });

  it('debería actualizar datos personales exitosamente', async () => {
    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      'Juan Carlos', // nombre actualizado
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    const result = await handler.execute(command);

    expect(result.name).toBe('Juan Carlos');
    expect(result.surnames).toBe('García López'); // no cambió
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('debería actualizar email exitosamente si es único', async () => {
    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      undefined,
      undefined,
      'nuevo.email@ejemplo.com',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    const result = await handler.execute(command);

    expect(result.email).toBe('nuevo.email@ejemplo.com');
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar error si el socio no existe (404)', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      'Nombre',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    await expect(handler.execute(command)).rejects.toThrow(MemberNotFoundError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si el nuevo email ya existe (409)', async () => {
    (memberRepository.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      undefined,
      undefined,
      'duplicado@ejemplo.com',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    await expect(handler.execute(command)).rejects.toThrow(EmailAlreadyExistsError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('no debería validar unicidad de email si no cambió', async () => {
    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      undefined,
      undefined,
      'juan.garcia@ejemplo.com', // mismo email actual
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    await handler.execute(command);

    expect(memberRepository.existsByEmail).not.toHaveBeenCalled();
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
  });

  it('debería actualizar IBAN válido', async () => {
    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'GB29NWBK60161331926819', // IBAN válido UK
      undefined,
    );

    const result = await handler.execute(command);

    expect(result.ibanMasked).toBeDefined();
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar error si el IBAN es inválido', async () => {
    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'INVALID_IBAN',
      undefined,
    );

    await expect(handler.execute(command)).rejects.toThrow();
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería actualizar campos personalizados', async () => {
    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { profession: 'Architect', skills: ['design'] },
    );

    const result = await handler.execute(command);

    expect(result.customFields).toEqual({ profession: 'Architect', skills: ['design'] });
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
  });

  it('debería propagar error de optimistic locking', async () => {
    (memberRepository.save as ReturnType<typeof vi.fn>).mockRejectedValue(
      new OptimisticLockingError(MEMBER_ID),
    );

    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      'Nombre actualizado',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    await expect(handler.execute(command)).rejects.toThrow(OptimisticLockingError);
  });

  it('debería establecer tenantId en los repositorios', async () => {
    const command = new UpdateMemberCommand(
      TENANT_ID,
      MEMBER_ID,
      'Test',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    await handler.execute(command);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
