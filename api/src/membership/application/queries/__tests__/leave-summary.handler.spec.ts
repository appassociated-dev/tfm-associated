import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetLeaveSummaryHandler } from '../leave-summary.handler';
import { GetLeaveSummaryQuery } from '../leave-summary.query';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { SubscriptionQueryPort } from '../../../domain/ports/subscription-query.port';
import { Member } from '../../../domain/aggregates/member';
import { MemberId } from '../../../domain/value-objects/member-id';
import { MemberTypeId } from '../../../domain/value-objects/member-type-id';
import { MemberStatus } from '../../../domain/value-objects/member-status';
import { MemberNumber } from '../../../domain/value-objects/member-number';
import { PersonalData } from '../../../domain/value-objects/personal-data';
import { ContactData } from '../../../domain/value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../../../domain/value-objects/identity-document';
import { CustomFields } from '../../../domain/value-objects/custom-fields';
import { MemberNotFoundError } from '../../../domain/exceptions';

// -- Helpers --

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_TYPE_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un Member reconstituido activo para tests. */
function createActiveMember(): Member {
  const personalData = PersonalData.create({
    name: 'Juan',
    surnames: 'García López',
    birthDate: new Date('1990-01-01'),
  });
  const contactData = ContactData.create({
    email: 'juan@test.com',
    phone: null,
    address: null,
    postalCode: null,
    city: null,
  });
  const doc = IdentityDocument.create(DocumentType.DNI, '12345678Z');
  const memberNumber = MemberNumber.fromString('00001');
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
    customFields: customFields.ok ? customFields.value : undefined,
    registrationDate: new Date('2024-01-01'),
  });
}

describe('GetLeaveSummaryHandler', () => {
  let handler: GetLeaveSummaryHandler;
  let memberRepository: MemberRepository;
  let subscriptionQueryPort: SubscriptionQueryPort;

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue(createActiveMember()),
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

    subscriptionQueryPort = {
      setTenantId: vi.fn(),
      getActiveSubscriptions: vi.fn().mockResolvedValue([
        {
          subscriptionId: 'sub-1',
          feePlanCode: 'CUOTA_MENSUAL',
          feePlanName: 'Cuota Mensual',
          amount: 3000,
          startDate: new Date('2024-01-01'),
        },
      ]),
      getPendingCharges: vi.fn().mockResolvedValue([
        {
          chargeId: 'charge-1',
          concept: 'Cuota Enero 2026',
          amount: 3000,
          issueDate: new Date('2026-01-01'),
          dueDate: new Date('2026-01-31'),
        },
        {
          chargeId: 'charge-2',
          concept: 'Cuota Febrero 2026',
          amount: 3000,
          issueDate: new Date('2026-02-01'),
          dueDate: new Date('2026-02-28'),
        },
      ]),
      getTotalPendingDebt: vi.fn().mockResolvedValue(6000),
      closeSubscriptions: vi.fn(),
      markChargesAsPaid: vi.fn(),
    };

    handler = new GetLeaveSummaryHandler(memberRepository, subscriptionQueryPort);
  });

  it('debe devolver resumen completo con suscripciones y cargos pendientes', async () => {
    const query = new GetLeaveSummaryQuery(TENANT_ID, MEMBER_ID);

    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.memberName).toBe('Juan García López');
    expect(result.memberNumber).toBe('00001');
    expect(result.memberDni).toBe('12345678Z');
    expect(result.currentStatus).toBe('ACTIVE');
    expect(result.totalPendingDebt).toBe(6000);

    // Suscripciones activas
    expect(result.activeSubscriptions).toHaveLength(1);
    expect(result.activeSubscriptions[0].feePlanCode).toBe('CUOTA_MENSUAL');

    // Cargos pendientes
    expect(result.pendingCharges).toHaveLength(2);
    expect(result.pendingCharges[0].chargeId).toBe('charge-1');

    // Opciones de fecha efectiva (al menos 3: IMMEDIATE, END_OF_FISCAL_YEAR, END_OF_NEXT_MONTH)
    expect(result.effectiveDateOptions.length).toBeGreaterThanOrEqual(3);
  });

  it('debe lanzar MemberNotFoundError cuando el socio no existe', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetLeaveSummaryQuery(TENANT_ID, MEMBER_ID);

    await expect(handler.execute(query)).rejects.toThrow(MemberNotFoundError);
  });

  it('debe devolver resumen con arrays vacíos y deuda cero cuando no hay suscripciones ni cargos', async () => {
    (subscriptionQueryPort.getActiveSubscriptions as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );
    (subscriptionQueryPort.getPendingCharges as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (subscriptionQueryPort.getTotalPendingDebt as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const query = new GetLeaveSummaryQuery(TENANT_ID, MEMBER_ID);

    const result = await handler.execute(query);

    expect(result.activeSubscriptions).toHaveLength(0);
    expect(result.pendingCharges).toHaveLength(0);
    expect(result.totalPendingDebt).toBe(0);
    expect(result.effectiveDateOptions.length).toBeGreaterThanOrEqual(3);
  });

  it('debe establecer tenantId en los repositorios', async () => {
    const query = new GetLeaveSummaryQuery(TENANT_ID, MEMBER_ID);

    await handler.execute(query);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(subscriptionQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
