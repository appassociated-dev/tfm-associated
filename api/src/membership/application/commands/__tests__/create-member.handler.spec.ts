import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateMemberHandler } from '../create-member.handler';
import { CreateMemberCommand } from '../create-member.command';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import { MemberType } from '../../../domain/aggregates/member-type';
import { Member } from '../../../domain/aggregates/member';
import { MemberTypeId } from '../../../domain/value-objects/member-type-id';
import { MemberId } from '../../../domain/value-objects/member-id';
import { MemberStatus } from '../../../domain/value-objects/member-status';
import { MemberNumber } from '../../../domain/value-objects/member-number';
import { PersonalData } from '../../../domain/value-objects/personal-data';
import { ContactData } from '../../../domain/value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../../../domain/value-objects/identity-document';
import { CustomFields } from '../../../domain/value-objects/custom-fields';
import {
  DocumentAlreadyExistsError,
  EmailAlreadyExistsError,
  MemberTypeNotFoundError,
  MemberTypeNotActiveError,
  AgeNotEligibleError,
} from '../../../domain/exceptions';
import { ErrorReporter } from '../../../../shared/domain';
import { IntegrationEventPublisher } from '../../../../shared/application/ports/integration-event.publisher';

/** Helper: crea un MemberType reconstituido activo con rango de edad. */
function createActiveMemberType(
  overrides: Partial<{
    id: string;
    ageMin: number | null;
    ageMax: number | null;
    active: boolean;
  }> = {},
): MemberType {
  return MemberType.reconstitute({
    id: overrides.id ?? 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    code: 'NUMERARIO',
    name: 'Socio Numerario',
    description: 'Socio de pleno derecho',
    ageRangeMin: overrides.ageMin ?? null,
    ageRangeMax: overrides.ageMax ?? null,
    votingRight: true,
    eligibleForOffice: true,
    minimumSeniorityForVoting: 0,
    minimumSeniorityForOffice: 0,
    automaticTransitionTargetId: null,
    rulesConfig: {},
    collectivityType: 'COFRADIA',
    active: overrides.active ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/** Helper: crea un Member reconstituido con ficha completa para simular existente. */
function createExistingMember(
  overrides: Partial<{ email: string; docNumber: string }> = {},
): Member {
  const personalData = PersonalData.create({
    name: 'Existing',
    surnames: 'Member',
    birthDate: new Date('1990-01-01'),
  });
  const contactData = ContactData.create({
    email: overrides.email ?? 'existing@test.com',
    phone: null,
    address: null,
    postalCode: null,
    city: null,
  });
  const doc = IdentityDocument.create(DocumentType.DNI, overrides.docNumber ?? '12345678Z');
  const memberNumber = MemberNumber.fromString('00001');
  const customFields = CustomFields.create({});

  return Member.reconstitute({
    id: MemberId.create(),
    memberTypeId: MemberTypeId.fromString('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
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

/** Datos base para un comando válido de creación. */
const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_TYPE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

type CreateMemberCommandOverrides = {
  tenantId: string;
  name: string;
  surnames: string;
  birthDate: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  iban: string | null;
  memberTypeId: string;
  customFields: Record<string, unknown>;
  initialStatus: string;
};

function validCommand(overrides: Partial<CreateMemberCommandOverrides> = {}): CreateMemberCommand {
  return new CreateMemberCommand(
    (overrides.tenantId as string) ?? TENANT_ID,
    (overrides.name as string) ?? 'Juan',
    (overrides.surnames as string) ?? 'García López',
    (overrides.birthDate as string) ?? '1990-05-15',
    (overrides.documentType as string) ?? 'DNI',
    (overrides.documentNumber as string) ?? '12345678Z',
    (overrides.email as string) ?? 'juan.garcia@ejemplo.com',
    (overrides.phone as string | null) ?? null,
    (overrides.address as string | null) ?? null,
    (overrides.postalCode as string | null) ?? null,
    (overrides.city as string | null) ?? null,
    (overrides.iban as string | null) ?? null,
    (overrides.memberTypeId as string) ?? MEMBER_TYPE_ID,
    (overrides.customFields as Record<string, unknown>) ?? {},
    (overrides.initialStatus as string) ?? 'ACTIVE',
  );
}

describe('CreateMemberHandler', () => {
  let handler: CreateMemberHandler;
  let memberRepository: MemberRepository;
  let memberTypeRepository: MemberTypeRepository;
  let errorReporter: ErrorReporter;
  let outboxPublisher: IntegrationEventPublisher;

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
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
      findById: vi.fn().mockResolvedValue(createActiveMemberType()),
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

    handler = new CreateMemberHandler(
      memberRepository,
      memberTypeRepository,
      errorReporter,
      outboxPublisher,
    );
  });

  it('debería crear un socio exitosamente con datos completos', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.name).toBe('Juan');
    expect(result.surnames).toBe('García López');
    expect(result.email).toBe('juan.garcia@ejemplo.com');
    expect(result.memberNumber).toBe('00001');
    expect(result.currentStatus).toBe('ACTIVE');
    expect(result.memberTypeName).toBe('Socio Numerario');
    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('debería asignar número de socio secuencial', async () => {
    (memberRepository.getNextMemberNumber as ReturnType<typeof vi.fn>).mockResolvedValue(42);

    const result = await handler.execute(validCommand());

    expect(result.memberNumber).toBe('00042');
  });

  it('debería crear socio con estado APPLICANT cuando se indica', async () => {
    const command = validCommand({ initialStatus: 'APPLICANT' });

    const result = await handler.execute(command);

    expect(result.currentStatus).toBe('APPLICANT');
  });

  it('debería crear socio con IBAN válido y devolver IBAN enmascarado', async () => {
    const command = validCommand({ iban: 'ES9121000418450200051332' });

    const result = await handler.execute(command);

    expect(result.ibanMasked).toBe('ES91****************1332');
  });

  it('debería lanzar error si el DNI ya existe (FE-1, 409)', async () => {
    const existingMember = createExistingMember({ docNumber: '12345678Z' });
    (memberRepository.findByIdentityDocument as ReturnType<typeof vi.fn>).mockResolvedValue(
      existingMember,
    );

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(DocumentAlreadyExistsError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería incluir datos del socio existente en el error de DNI duplicado', async () => {
    const existingMember = createExistingMember({ docNumber: '12345678Z' });
    (memberRepository.findByIdentityDocument as ReturnType<typeof vi.fn>).mockResolvedValue(
      existingMember,
    );

    const command = validCommand();

    try {
      await handler.execute(command);
      expect.unreachable('Debería haber lanzado error');
    } catch (error) {
      expect(error).toBeInstanceOf(DocumentAlreadyExistsError);
      expect((error as DocumentAlreadyExistsError).existingMemberName).toContain('Existing');
      expect((error as DocumentAlreadyExistsError).existingMemberNumber).toBe('00001');
    }
  });

  it('debería lanzar error si el email ya existe (FE-2, 409)', async () => {
    (memberRepository.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(EmailAlreadyExistsError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si el tipo de socio no existe (404)', async () => {
    (memberTypeRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberTypeNotFoundError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si el tipo de socio no está activo (422)', async () => {
    const inactiveType = createActiveMemberType({ active: false });
    (memberTypeRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(inactiveType);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberTypeNotActiveError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si la edad no es compatible con el tipo (422)', async () => {
    // Tipo de socio con rango 18-65
    const restrictedType = createActiveMemberType({ ageMin: 18, ageMax: 65 });
    (memberTypeRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(restrictedType);

    // Socio menor de 18
    const command = validCommand({ birthDate: '2020-01-01' });

    await expect(handler.execute(command)).rejects.toThrow(AgeNotEligibleError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería emitir advertencia para menor sin representante legal (FE-4)', async () => {
    // Tipo sin restricción de edad
    const noAgeRestriction = createActiveMemberType({ ageMin: null, ageMax: null });
    (memberTypeRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(noAgeRestriction);

    // Menor de edad (15 años)
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 15);
    const command = validCommand({
      birthDate: birthDate.toISOString().split('T')[0],
      customFields: {},
    });

    await handler.execute(command);

    // No bloquea la creación, pero reporta advertencia
    expect(errorReporter.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('Menor de edad registrado sin representante legal'),
      'warning',
      expect.any(Object),
    );
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
  });

  it('no debería emitir advertencia si menor tiene representante legal', async () => {
    const noAgeRestriction = createActiveMemberType({ ageMin: null, ageMax: null });
    (memberTypeRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(noAgeRestriction);

    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 15);
    const command = validCommand({
      birthDate: birthDate.toISOString().split('T')[0],
      customFields: { legalRepresentative: 'Pedro García' },
    });

    await handler.execute(command);

    expect(errorReporter.captureMessage).not.toHaveBeenCalled();
  });

  it('debería lanzar error si el DNI tiene formato inválido', async () => {
    const command = validCommand({ documentNumber: 'INVALID' });

    await expect(handler.execute(command)).rejects.toThrow();
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar error si el IBAN es inválido', async () => {
    const command = validCommand({ iban: 'ES0000000000000000000000' });

    await expect(handler.execute(command)).rejects.toThrow();
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debería establecer tenantId en ambos repositorios', async () => {
    const command = validCommand();

    await handler.execute(command);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });

  it('debería reportar errores inesperados vía ErrorReporter', async () => {
    const unexpectedError = new Error('DB connection lost');
    (memberRepository.getNextMemberNumber as ReturnType<typeof vi.fn>).mockRejectedValue(
      unexpectedError,
    );

    await expect(handler.execute(validCommand())).rejects.toThrow('DB connection lost');
    expect(errorReporter.captureException).toHaveBeenCalledWith(
      unexpectedError,
      expect.objectContaining({ command: 'CreateMemberCommand' }),
    );
  });

  it('no debería reportar errores de negocio esperados vía ErrorReporter', async () => {
    (memberRepository.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    await expect(handler.execute(validCommand())).rejects.toThrow(EmailAlreadyExistsError);
    expect(errorReporter.captureException).not.toHaveBeenCalled();
  });
});
