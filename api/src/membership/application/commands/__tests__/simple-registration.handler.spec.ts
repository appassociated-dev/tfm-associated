import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimpleRegistrationHandler } from '../simple-registration.handler';
import { SimpleRegistrationCommand } from '../simple-registration.command';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import { FiscalYearRepository } from '../../../domain/repositories/fiscal-year.repository';
import { RegistrationChargePort } from '../../../domain/ports/registration-charge.port';
import { MemberOutboxPublisher } from '../../ports/member-outbox.publisher';
import { MemberType } from '../../../domain/aggregates/member-type';
import { Member } from '../../../domain/aggregates/member';
import { MemberId } from '../../../domain/value-objects/member-id';
import { MemberTypeId } from '../../../domain/value-objects/member-type-id';
import { MemberStatus } from '../../../domain/value-objects/member-status';
import { MemberNumber } from '../../../domain/value-objects/member-number';
import { PersonalData } from '../../../domain/value-objects/personal-data';
import { ContactData } from '../../../domain/value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../../../domain/value-objects/identity-document';
import { CustomFields } from '../../../domain/value-objects/custom-fields';
import { FiscalYear } from '../../../domain/aggregates/fiscal-year';
import {
  DocumentAlreadyExistsError,
  MemberTypeNotFoundError,
  MemberTypeNotActiveError,
  AgeNotEligibleError,
  NoOpenFiscalYearError,
  NoRegistrationPlanError,
} from '../../../domain/exceptions';
import { ErrorReporter } from '../../../../shared/domain';

// -- Helpers --

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_TYPE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FEE_PLAN_ID = 'fee-plan-uuid-1234';

/** Crea un MemberType reconstituido activo con rango de edad. */
function createActiveMemberType(
  overrides: Partial<{
    id: string;
    ageMin: number | null;
    ageMax: number | null;
    active: boolean;
  }> = {},
): MemberType {
  return MemberType.reconstitute({
    id: overrides.id ?? MEMBER_TYPE_ID,
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

/** Crea un Member reconstituido para simular existente. */
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

/** Crea un FiscalYear reconstituido activo. */
function createActiveFiscalYear(): FiscalYear {
  return FiscalYear.reconstitute({
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Ejercicio 2026',
    type: 'NATURAL_YEAR',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    status: 'OPEN',
    previousFiscalYearId: null,
    membersAtStart: 0,
    membersAtEnd: null,
    reportId: null,
    closedAt: null,
    createdAt: new Date(),
  });
}

/** Plan de alta de ejemplo. */
const REGISTRATION_PLAN = {
  feePlanId: FEE_PLAN_ID,
  code: 'ALTA',
  name: 'Cuota de alta',
  amount: 5000,
};

/** Resultado de creación de artefactos de tesorería. */
const CHARGE_RESULT = {
  memberAccountId: 'account-uuid',
  feeSubscriptionId: 'subscription-uuid',
  chargeId: 'charge-uuid',
};

type SimpleRegistrationOverrides = Partial<{
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
  memberTypeId: string;
}>;

function validCommand(overrides: SimpleRegistrationOverrides = {}): SimpleRegistrationCommand {
  return new SimpleRegistrationCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.name ?? 'Juan',
    overrides.surnames ?? 'García López',
    overrides.birthDate ?? '1990-05-15',
    overrides.documentType ?? 'DNI',
    overrides.documentNumber ?? '12345678Z',
    overrides.email ?? 'juan.garcia@ejemplo.com',
    overrides.phone ?? null,
    overrides.address ?? null,
    overrides.postalCode ?? null,
    overrides.city ?? null,
    overrides.memberTypeId ?? MEMBER_TYPE_ID,
  );
}

describe('SimpleRegistrationHandler', () => {
  let handler: SimpleRegistrationHandler;
  let memberRepository: MemberRepository;
  let memberTypeRepository: MemberTypeRepository;
  let fiscalYearRepository: FiscalYearRepository;
  let registrationChargePort: RegistrationChargePort;
  let outboxPublisher: MemberOutboxPublisher;
  let errorReporter: ErrorReporter;
  let prismaTenantService: { getClient: ReturnType<typeof vi.fn> };

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

    fiscalYearRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findActive: vi.fn().mockResolvedValue(createActiveFiscalYear()),
      findAll: vi.fn(),
      findByName: vi.fn(),
      existsOpenFiscalYear: vi.fn(),
      findOverlapping: vi.fn(),
    };

    registrationChargePort = {
      setTenantId: vi.fn(),
      findRegistrationPlan: vi.fn().mockResolvedValue(REGISTRATION_PLAN),
      createRegistrationArtifacts: vi.fn().mockResolvedValue(CHARGE_RESULT),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    errorReporter = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
    };

    // Mock PrismaTenantService: getClient devuelve un objeto con $transaction
    prismaTenantService = {
      getClient: vi.fn().mockResolvedValue({
        $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({});
        }),
      }),
    };

    handler = new SimpleRegistrationHandler(
      memberRepository,
      memberTypeRepository,
      fiscalYearRepository,
      registrationChargePort,
      outboxPublisher,
      errorReporter,
      prismaTenantService as never,
    );
  });

  it('should create a member successfully when all preconditions are met (happy path)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.memberId).toBeDefined();
    expect(result.memberNumber).toBe('00001');
    expect(result.status).toBe('ACTIVE');
    expect(result.memberTypeName).toBe('Socio Numerario');
    expect(result.registrationCharge).toBeDefined();
    expect(result.registrationCharge?.chargeId).toBe('charge-uuid');
    expect(result.registrationCharge?.amount).toBe(5000);
    expect(result.registrationCharge?.status).toBe('PENDING');
    expect(result.emailWarning).toBeUndefined();

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(fiscalYearRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(registrationChargePort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('should throw DocumentAlreadyExistsError when DNI already exists (409)', async () => {
    const existingMember = createExistingMember({ docNumber: '12345678Z' });
    (memberRepository.findByIdentityDocument as ReturnType<typeof vi.fn>).mockResolvedValue(
      existingMember,
    );

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(DocumentAlreadyExistsError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NoOpenFiscalYearError when no fiscal year is open', async () => {
    (fiscalYearRepository.findActive as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(NoOpenFiscalYearError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('should throw NoRegistrationPlanError when no registration plan exists', async () => {
    (registrationChargePort.findRegistrationPlan as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(NoRegistrationPlanError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('should throw AgeNotEligibleError when age is incompatible with member type (422)', async () => {
    const restrictedType = createActiveMemberType({ ageMin: 18, ageMax: 65 });
    (memberTypeRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(restrictedType);

    // Socio menor de 18
    const command = validCommand({ birthDate: '2020-01-01' });

    await expect(handler.execute(command)).rejects.toThrow(AgeNotEligibleError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('should throw MemberTypeNotFoundError when member type does not exist', async () => {
    (memberTypeRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberTypeNotFoundError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('should throw MemberTypeNotActiveError when member type is not active', async () => {
    const inactiveType = createActiveMemberType({ active: false });
    (memberTypeRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(inactiveType);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberTypeNotActiveError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('should succeed with emailWarning when email already exists (non-blocking)', async () => {
    (memberRepository.existsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.emailWarning).toBeDefined();
    expect(result.emailWarning).toContain('juan.garcia@ejemplo.com');
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should assign sequential member number', async () => {
    (memberRepository.getNextMemberNumber as ReturnType<typeof vi.fn>).mockResolvedValue(42);

    const result = await handler.execute(validCommand());

    expect(result.memberNumber).toBe('00042');
  });

  it('should create registration charge artifacts via RegistrationChargePort', async () => {
    const command = validCommand();

    await handler.execute(command);

    expect(registrationChargePort.createRegistrationArtifacts).toHaveBeenCalledTimes(1);
    expect(registrationChargePort.createRegistrationArtifacts).toHaveBeenCalledWith(
      expect.objectContaining({
        feePlanId: FEE_PLAN_ID,
        effectiveAmount: 5000,
        concept: expect.stringContaining('Alta de socio'),
      }),
      expect.anything(), // tx
    );
  });

  it('should report unexpected errors via ErrorReporter', async () => {
    const unexpectedError = new Error('DB connection lost');
    (memberRepository.getNextMemberNumber as ReturnType<typeof vi.fn>).mockRejectedValue(
      unexpectedError,
    );

    await expect(handler.execute(validCommand())).rejects.toThrow('DB connection lost');
    expect(errorReporter.captureException).toHaveBeenCalledWith(
      unexpectedError,
      expect.objectContaining({ command: 'SimpleRegistrationCommand' }),
    );
  });

  it('should not report business errors via ErrorReporter', async () => {
    (fiscalYearRepository.findActive as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(handler.execute(validCommand())).rejects.toThrow(NoOpenFiscalYearError);
    expect(errorReporter.captureException).not.toHaveBeenCalled();
  });
});
