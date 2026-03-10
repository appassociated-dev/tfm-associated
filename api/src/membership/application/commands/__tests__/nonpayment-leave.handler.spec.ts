import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessNonpaymentLeaveHandler } from '../nonpayment-leave.handler';
import { ProcessNonpaymentLeaveCommand } from '../nonpayment-leave.command';
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
  MemberCannotLeaveError,
  NoPendingDebtError,
} from '../../../domain/exceptions';

// -- Helpers --

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_TYPE_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un Member reconstituido para tests. */
function createMember(overrides: Partial<{ status: MemberStatus }> = {}): Member {
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

function validCommand(
  overrides: Partial<{ tenantId: string; memberId: string }> = {},
): ProcessNonpaymentLeaveCommand {
  return new ProcessNonpaymentLeaveCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.memberId ?? MEMBER_ID,
  );
}

describe('ProcessNonpaymentLeaveHandler', () => {
  let handler: ProcessNonpaymentLeaveHandler;
  let memberRepository: MemberRepository;
  let statusHistoryRepository: StatusHistoryRepository;
  let subscriptionQueryPort: SubscriptionQueryPort;
  let outboxPublisher: MemberOutboxPublisher;
  let prismaTenantService: { getClient: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue(createMember({ status: MemberStatus.PENDING_PAYMENT })),
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
      getPendingCharges: vi.fn().mockResolvedValue([]),
      getTotalPendingDebt: vi.fn().mockResolvedValue(5000), // Deuda pendiente por defecto
      closeSubscriptions: vi.fn().mockResolvedValue(1),
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

    handler = new ProcessNonpaymentLeaveHandler(
      memberRepository,
      statusHistoryRepository,
      subscriptionQueryPort,
      outboxPublisher,
      prismaTenantService as never,
    );
  });

  it('debe procesar baja por impago exitosamente cuando hay deuda pendiente (happy path)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.previousStatus).toBe('PENDING_PAYMENT');
    expect(result.newStatus).toBe('NONPAYMENT_LEAVE');
    expect(result.effectiveDate).toBeInstanceOf(Date);
    expect(result.subscriptionsClosed).toBe(1);
    expect(result.pendingChargesAmount).toBe(5000);

    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('debe lanzar MemberNotFoundError cuando el socio no existe (404)', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberNotFoundError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debe lanzar MemberCannotLeaveError cuando el socio no puede causar baja', async () => {
    const memberAlreadyLeft = createMember({ status: MemberStatus.DECEASED });
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(memberAlreadyLeft);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberCannotLeaveError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debe lanzar NoPendingDebtError cuando no hay deuda pendiente', async () => {
    (subscriptionQueryPort.getTotalPendingDebt as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(NoPendingDebtError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debe cancelar suscripciones con motivo NONPAYMENT_LEAVE', async () => {
    const command = validCommand();

    await handler.execute(command);

    expect(subscriptionQueryPort.closeSubscriptions).toHaveBeenCalledWith(
      MEMBER_ID,
      'NONPAYMENT_LEAVE',
      expect.anything(),
    );
  });

  it('debe establecer tenantId en todos los repositorios', async () => {
    const command = validCommand();

    await handler.execute(command);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(statusHistoryRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(subscriptionQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
