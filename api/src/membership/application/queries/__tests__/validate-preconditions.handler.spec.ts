import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidatePreconditionsHandler } from '../validate-preconditions.handler';
import { ValidatePreconditionsQuery } from '../validate-preconditions.query';
import { FiscalYearRepository } from '../../../domain/repositories/fiscal-year.repository';
import { MemberTypeRepository } from '../../../domain/repositories/member-type.repository';
import { RegistrationChargePort } from '../../../domain/ports/registration-charge.port';
import { MemberType } from '../../../domain/aggregates/member-type';
import { FiscalYear } from '../../../domain/aggregates/fiscal-year';

const TENANT_ID = 'tenant-uuid-1234';

/** Crea un FiscalYear reconstituido activo. */
function createActiveFiscalYear(): FiscalYear {
  return FiscalYear.reconstitute({
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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

/** Crea un MemberType reconstituido activo. */
function createActiveMemberType(): MemberType {
  return MemberType.reconstitute({
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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

const REGISTRATION_PLAN = {
  feePlanId: 'fee-plan-uuid',
  code: 'ALTA',
  name: 'Cuota de alta',
  amount: 5000,
};

describe('ValidatePreconditionsHandler', () => {
  let handler: ValidatePreconditionsHandler;
  let fiscalYearRepository: FiscalYearRepository;
  let memberTypeRepository: MemberTypeRepository;
  let registrationChargePort: RegistrationChargePort;

  beforeEach(() => {
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

    memberTypeRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findAll: vi.fn().mockResolvedValue([createActiveMemberType()]),
      existsByCode: vi.fn(),
      existsAsTransitionTarget: vi.fn(),
    };

    registrationChargePort = {
      setTenantId: vi.fn(),
      findRegistrationPlan: vi.fn().mockResolvedValue(REGISTRATION_PLAN),
      createRegistrationArtifacts: vi.fn(),
    };

    handler = new ValidatePreconditionsHandler(
      fiscalYearRepository,
      memberTypeRepository,
      registrationChargePort,
    );
  });

  it('should return all preconditions OK when everything is configured', async () => {
    const query = new ValidatePreconditionsQuery(TENANT_ID);

    const result = await handler.execute(query);

    expect(result.hasFiscalYear).toBe(true);
    expect(result.hasMemberTypes).toBe(true);
    expect(result.hasRegistrationPlan).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should report hasFiscalYear=false when no fiscal year is open', async () => {
    (fiscalYearRepository.findActive as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new ValidatePreconditionsQuery(TENANT_ID);
    const result = await handler.execute(query);

    expect(result.hasFiscalYear).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('ejercicio fiscal');
  });

  it('should report hasMemberTypes=false when no active member types exist', async () => {
    (memberTypeRepository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const query = new ValidatePreconditionsQuery(TENANT_ID);
    const result = await handler.execute(query);

    expect(result.hasMemberTypes).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('tipos de socio');
  });

  it('should report hasMemberTypes=false when all member types are inactive', async () => {
    const inactiveType = MemberType.reconstitute({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (memberTypeRepository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([inactiveType]);

    const query = new ValidatePreconditionsQuery(TENANT_ID);
    const result = await handler.execute(query);

    expect(result.hasMemberTypes).toBe(false);
  });

  it('should report hasRegistrationPlan=false when no registration plan exists', async () => {
    (registrationChargePort.findRegistrationPlan as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const query = new ValidatePreconditionsQuery(TENANT_ID);
    const result = await handler.execute(query);

    expect(result.hasRegistrationPlan).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('plan de cuota de alta');
  });

  it('should report multiple failures simultaneously', async () => {
    (fiscalYearRepository.findActive as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (memberTypeRepository.findAll as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (registrationChargePort.findRegistrationPlan as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const query = new ValidatePreconditionsQuery(TENANT_ID);
    const result = await handler.execute(query);

    expect(result.hasFiscalYear).toBe(false);
    expect(result.hasMemberTypes).toBe(false);
    expect(result.hasRegistrationPlan).toBe(false);
    expect(result.errors).toHaveLength(3);
  });

  it('should set tenantId on repositories', async () => {
    const query = new ValidatePreconditionsQuery(TENANT_ID);

    await handler.execute(query);

    expect(fiscalYearRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
