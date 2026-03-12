import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetReinstatementSummaryHandler } from '../reinstatement-summary.handler';
import { GetReinstatementSummaryQuery } from '../reinstatement-summary.query';
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
import { MemberNotFoundError, MemberCannotReinstateError } from '../../../domain/exceptions';

// -- Helpers --

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_TYPE_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const LEAVE_DATE = new Date('2026-01-15');

/** Crea un Member reconstituido en estado de baja para tests. */
function createLeaveMember(overrides: Partial<{ status: MemberStatus }> = {}): Member {
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
    currentStatus: overrides.status ?? MemberStatus.VOLUNTARY_LEAVE,
    statusHistory: [],
    version: 0,
    memberNumber: memberNumber.ok ? memberNumber.value : undefined,
    personalData: personalData.ok ? personalData.value : undefined,
    contactData: contactData.ok ? contactData.value : undefined,
    identityDocument: doc.ok ? doc.value : undefined,
    customFields: customFields.ok ? customFields.value : undefined,
    registrationDate: new Date('2022-06-01'),
    leaveDate: LEAVE_DATE,
  });
}

describe('GetReinstatementSummaryHandler', () => {
  let handler: GetReinstatementSummaryHandler;
  let memberRepository: MemberRepository;
  let subscriptionQueryPort: SubscriptionQueryPort;

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue(createLeaveMember()),
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
      getActiveSubscriptions: vi.fn().mockResolvedValue([]),
      getPendingCharges: vi.fn().mockResolvedValue([]),
      getTotalPendingDebt: vi.fn().mockResolvedValue(8000),
      closeSubscriptions: vi.fn(),
      markChargesAsPaid: vi.fn(),
    };

    handler = new GetReinstatementSummaryHandler(memberRepository, subscriptionQueryPort);
  });

  it('debe devolver resumen con deuda pendiente para ex-socio', async () => {
    const query = new GetReinstatementSummaryQuery(TENANT_ID, MEMBER_ID);

    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.memberName).toBe('Juan García López');
    expect(result.leaveDate).toEqual(LEAVE_DATE);
    expect(result.leaveType).toBe('VOLUNTARY_LEAVE');
    expect(result.pendingDebt).toBe(8000);
    expect(result.penalty).toBe(0); // MVP: sin penalización
    expect(result.newRegistrationFee).toBe(0); // MVP: sin cuota de reinscripción
    expect(result.totalToPay).toBe(8000); // pendingDebt + penalty + newRegistrationFee
    expect(result.keepSeniority).toBe(true);
  });

  it('debe devolver resumen con importes cero cuando no hay deuda', async () => {
    (subscriptionQueryPort.getTotalPendingDebt as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const query = new GetReinstatementSummaryQuery(TENANT_ID, MEMBER_ID);

    const result = await handler.execute(query);

    expect(result.pendingDebt).toBe(0);
    expect(result.totalToPay).toBe(0);
    expect(result.penalty).toBe(0);
    expect(result.newRegistrationFee).toBe(0);
    expect(result.keepSeniority).toBe(true);
  });

  it('debe lanzar MemberNotFoundError cuando el socio no existe', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetReinstatementSummaryQuery(TENANT_ID, MEMBER_ID);

    await expect(handler.execute(query)).rejects.toThrow(MemberNotFoundError);
  });

  it('debe lanzar MemberCannotReinstateError cuando el socio no está en estado de baja', async () => {
    const activeMember = createLeaveMember({ status: MemberStatus.ACTIVE });
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(activeMember);

    const query = new GetReinstatementSummaryQuery(TENANT_ID, MEMBER_ID);

    await expect(handler.execute(query)).rejects.toThrow(MemberCannotReinstateError);
  });

  it('debe funcionar correctamente para socio con NONPAYMENT_LEAVE', async () => {
    const nonpaymentMember = createLeaveMember({ status: MemberStatus.NONPAYMENT_LEAVE });
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(nonpaymentMember);

    const query = new GetReinstatementSummaryQuery(TENANT_ID, MEMBER_ID);

    const result = await handler.execute(query);

    expect(result.leaveType).toBe('NONPAYMENT_LEAVE');
    expect(result.pendingDebt).toBe(8000);
  });

  it('debe establecer tenantId en los repositorios', async () => {
    const query = new GetReinstatementSummaryQuery(TENANT_ID, MEMBER_ID);

    await handler.execute(query);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(subscriptionQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
