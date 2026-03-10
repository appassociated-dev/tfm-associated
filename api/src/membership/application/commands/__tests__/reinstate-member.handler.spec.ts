import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReinstateMemberHandler } from '../reinstate-member.handler';
import { ReinstateMemberCommand } from '../reinstate-member.command';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { StatusHistoryRepository } from '../../../domain/repositories/status-history.repository';
import { SubscriptionQueryPort } from '../../../domain/ports/subscription-query.port';
import { MemberOutboxPublisher } from '../../ports/member-outbox.publisher';
import { Member } from '../../../domain/aggregates/member';
import { MemberId } from '../../../domain/value-objects/member-id';
import { MemberTypeId } from '../../../domain/value-objects/member-type-id';
import { MemberStatus } from '../../../domain/value-objects/member-status';
import { MemberNumber } from '../../../domain/value-objects/member-number';
import { PersonalData } from '../../../domain/value-objects/personal-data';
import { ContactData } from '../../../domain/value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../../../domain/value-objects/identity-document';
import { CustomFields } from '../../../domain/value-objects/custom-fields';
import {
  MemberNotFoundError,
  MemberCannotReinstateError,
  PaymentNotConfirmedError,
} from '../../../domain/exceptions';

// -- Helpers --

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_TYPE_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const ORIGINAL_REGISTRATION_DATE = new Date('2022-06-01');

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
    registrationDate: ORIGINAL_REGISTRATION_DATE,
    leaveDate: new Date('2026-01-15'),
  });
}

function validCommand(
  overrides: Partial<{
    tenantId: string;
    memberId: string;
    paymentConfirmed: boolean;
  }> = {},
): ReinstateMemberCommand {
  return new ReinstateMemberCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.memberId ?? MEMBER_ID,
    overrides.paymentConfirmed ?? true,
  );
}

describe('ReinstateMemberHandler', () => {
  let handler: ReinstateMemberHandler;
  let memberRepository: MemberRepository;
  let statusHistoryRepository: StatusHistoryRepository;
  let subscriptionQueryPort: SubscriptionQueryPort;
  let outboxPublisher: MemberOutboxPublisher;
  let prismaTenantService: { getClient: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue(createLeaveMember()),
      save: vi.fn().mockResolvedValue(undefined),
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

    statusHistoryRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findByMemberId: vi.fn(),
    };

    subscriptionQueryPort = {
      setTenantId: vi.fn(),
      getActiveSubscriptions: vi.fn().mockResolvedValue([]),
      getPendingCharges: vi.fn().mockResolvedValue([
        {
          chargeId: 'charge-1',
          concept: 'Cuota mensual',
          amount: 3000,
          issueDate: new Date(),
          dueDate: new Date(),
        },
        {
          chargeId: 'charge-2',
          concept: 'Cuota anual',
          amount: 2000,
          issueDate: new Date(),
          dueDate: new Date(),
        },
      ]),
      getTotalPendingDebt: vi.fn().mockResolvedValue(5000),
      closeSubscriptions: vi.fn().mockResolvedValue(0),
      markChargesAsPaid: vi.fn().mockResolvedValue(undefined),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    prismaTenantService = {
      getClient: vi.fn().mockReturnValue({
        $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
          return fn({});
        }),
      }),
    };

    handler = new ReinstateMemberHandler(
      memberRepository,
      statusHistoryRepository,
      subscriptionQueryPort,
      outboxPublisher,
      prismaTenantService as never,
    );
  });

  it('debe rehabilitar socio exitosamente con pago confirmado (happy path)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.newStatus).toBe('ACTIVE');
    expect(result.debtPaid).toBe(5000);
    expect(result.seniorityRecovered).toBe(true);
    expect(result.registrationDate).toEqual(ORIGINAL_REGISTRATION_DATE);

    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('debe marcar cargos pendientes como pagados durante la rehabilitación', async () => {
    const command = validCommand();

    await handler.execute(command);

    expect(subscriptionQueryPort.markChargesAsPaid).toHaveBeenCalledWith(
      MEMBER_ID,
      ['charge-1', 'charge-2'],
      expect.anything(),
    );
  });

  it('debe lanzar MemberNotFoundError cuando el socio no existe (404)', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberNotFoundError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debe lanzar MemberCannotReinstateError cuando el socio no puede ser rehabilitado', async () => {
    const activeMember = createLeaveMember({ status: MemberStatus.ACTIVE });
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(activeMember);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberCannotReinstateError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debe lanzar PaymentNotConfirmedError cuando el pago no está confirmado', async () => {
    const command = validCommand({ paymentConfirmed: false });

    await expect(handler.execute(command)).rejects.toThrow(PaymentNotConfirmedError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debe conservar la antigüedad (fecha de registro original)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    // keepSeniority = true por defecto en el handler
    expect(result.seniorityRecovered).toBe(true);
    expect(result.registrationDate).toEqual(ORIGINAL_REGISTRATION_DATE);
  });

  it('debe rehabilitar socio desde NONPAYMENT_LEAVE correctamente', async () => {
    const nonpaymentMember = createLeaveMember({ status: MemberStatus.NONPAYMENT_LEAVE });
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(nonpaymentMember);

    const command = validCommand();

    const result = await handler.execute(command);

    expect(result.newStatus).toBe('ACTIVE');
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
  });

  it('no debe marcar cargos como pagados si no hay cargos pendientes', async () => {
    (subscriptionQueryPort.getPendingCharges as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const command = validCommand();

    await handler.execute(command);

    expect(subscriptionQueryPort.markChargesAsPaid).not.toHaveBeenCalled();
  });

  it('debe establecer tenantId en todos los repositorios', async () => {
    const command = validCommand();

    await handler.execute(command);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(statusHistoryRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(subscriptionQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
