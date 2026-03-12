import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProcessVoluntaryLeaveHandler } from '../voluntary-leave.handler';
import { ProcessVoluntaryLeaveCommand } from '../voluntary-leave.command';
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
import { MemberNotFoundError, MemberCannotLeaveError } from '../../../domain/exceptions';

// -- Helpers --

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_TYPE_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un Member reconstituido activo para tests. */
function createActiveMember(overrides: Partial<{ status: MemberStatus; id: string }> = {}): Member {
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
    id: MemberId.fromString(overrides.id ?? MEMBER_ID),
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
  overrides: Partial<{
    tenantId: string;
    memberId: string;
    effectiveDateType: string;
    reason: string;
  }> = {},
): ProcessVoluntaryLeaveCommand {
  return new ProcessVoluntaryLeaveCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.memberId ?? MEMBER_ID,
    overrides.effectiveDateType ?? 'IMMEDIATE',
    overrides.reason ?? 'Motivo personal',
  );
}

describe('ProcessVoluntaryLeaveHandler', () => {
  let handler: ProcessVoluntaryLeaveHandler;
  let memberRepository: MemberRepository;
  let statusHistoryRepository: StatusHistoryRepository;
  let subscriptionQueryPort: SubscriptionQueryPort;
  let outboxPublisher: MemberOutboxPublisher;
  let prismaTenantService: { getClient: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    memberRepository = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue(createActiveMember()),
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
      getTotalPendingDebt: vi.fn().mockResolvedValue(0),
      closeSubscriptions: vi.fn().mockResolvedValue(2),
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

    handler = new ProcessVoluntaryLeaveHandler(
      memberRepository,
      statusHistoryRepository,
      subscriptionQueryPort,
      outboxPublisher,
      prismaTenantService as never,
    );
  });

  it('debe procesar baja voluntaria exitosamente (happy path)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.memberId).toBe(MEMBER_ID);
    expect(result.previousStatus).toBe('ACTIVE');
    expect(result.newStatus).toBe('VOLUNTARY_LEAVE');
    expect(result.effectiveDate).toBeInstanceOf(Date);
    expect(result.subscriptionsClosed).toBe(2);
    expect(result.pendingChargesAmount).toBe(0);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
    expect(subscriptionQueryPort.closeSubscriptions).toHaveBeenCalledWith(
      MEMBER_ID,
      'MEMBER_LEAVE',
      expect.anything(),
    );
  });

  it('debe lanzar MemberNotFoundError cuando el socio no existe (404)', async () => {
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberNotFoundError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debe lanzar MemberCannotLeaveError cuando el socio no puede causar baja', async () => {
    const memberAlreadyLeft = createActiveMember({ status: MemberStatus.VOLUNTARY_LEAVE });
    (memberRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(memberAlreadyLeft);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberCannotLeaveError);
    expect(memberRepository.save).not.toHaveBeenCalled();
  });

  it('debe procesar baja exitosamente incluso con deuda pendiente', async () => {
    (subscriptionQueryPort.getTotalPendingDebt as ReturnType<typeof vi.fn>).mockResolvedValue(
      15000,
    );

    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.pendingChargesAmount).toBe(15000);
    expect(memberRepository.save).toHaveBeenCalledTimes(1);
  });

  it('debe establecer tenantId en todos los repositorios', async () => {
    const command = validCommand();

    await handler.execute(command);

    expect(memberRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(statusHistoryRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(subscriptionQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });

  it('debe guardar entradas de historial de estado nuevas', async () => {
    const command = validCommand();

    await handler.execute(command);

    // El processLeave del aggregate crea una entrada de historial via changeStatus
    expect(statusHistoryRepository.save).toHaveBeenCalled();
  });

  it('debe publicar eventos de dominio en outbox', async () => {
    const command = validCommand();

    await handler.execute(command);

    expect(outboxPublisher.publish).toHaveBeenCalledWith(
      TENANT_ID,
      expect.arrayContaining([
        expect.objectContaining({
          eventType: expect.any(String),
        }),
      ]),
    );
  });
});
