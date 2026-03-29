import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { RecordMultiChargePaymentHandler } from '../record-multi-charge-payment.handler';
import { RecordMultiChargePaymentCommand } from '../record-multi-charge-payment.command';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { PaymentRepository } from '../../../domain/repositories/payment.repository';
import { IntegrationEventPublisher } from '../../../../shared/application/ports/integration-event.publisher';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { Charge } from '../../../domain/entities/charge';
import {
  MemberAccountNotFoundError,
  ChargeNotFoundError,
  ChargeAlreadyPaidError,
  ChargeNotPayableError,
  FuturePaymentDateError,
} from '../../../domain/exceptions';

// Silenciar Logger en tests
vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CHARGE_ID_1 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CHARGE_ID_2 = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CHARGE_ID_3 = 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const REGISTERED_BY = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un cargo reconstituido. */
function createCharge(id: string, amount = 3000, status = 'PENDING', paidAmount = 0): Charge {
  return Charge.reconstitute({
    id,
    subscriptionId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    baseAmount: amount,
    finalAmount: amount,
    description: `Cuota ${id.slice(-4)}`,
    fiscalYearId: null,
    billingMonth: 1,
    billingYear: 2025,
    issueDate: new Date('2025-01-01'),
    dueDate: new Date('2025-01-31'),
    status,
    paidAmount,
    isProrated: false,
    isManual: false,
    createdAt: new Date('2025-01-01'),
  });
}

/** Crea una MemberAccount con 3 cargos pendientes. */
function createMemberAccountWith3Charges(): MemberAccount {
  return MemberAccount.reconstitute({
    id: MEMBER_ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [],
    charges: [
      createCharge(CHARGE_ID_1, 3000),
      createCharge(CHARGE_ID_2, 2000),
      createCharge(CHARGE_ID_3, 5000),
    ],
    payments: [],
    createdAt: new Date(),
  });
}

/** Crea un comando válido con overrides opcionales. */
function validCommand(
  overrides: Partial<RecordMultiChargePaymentCommand> = {},
): RecordMultiChargePaymentCommand {
  return new RecordMultiChargePaymentCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.memberAccountId ?? MEMBER_ACCOUNT_ID,
    overrides.chargeIds ?? [CHARGE_ID_1, CHARGE_ID_2, CHARGE_ID_3],
    overrides.paymentMethod ?? 'CASH',
    overrides.paymentDate ?? '2025-01-15',
    overrides.notes ?? null,
    overrides.registeredBy ?? REGISTERED_BY,
  );
}

describe('RecordMultiChargePaymentHandler', () => {
  let handler: RecordMultiChargePaymentHandler;
  let memberAccountRepository: MemberAccountRepository;
  let paymentRepository: PaymentRepository;
  let outboxPublisher: IntegrationEventPublisher;
  let receiptSeq: number;

  beforeEach(() => {
    receiptSeq = 0;

    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createMemberAccountWith3Charges()),
      findByMemberId: vi.fn().mockResolvedValue(null),
      existsByMemberId: vi.fn().mockResolvedValue(false),
      findAllWithActiveSubscriptions: vi.fn().mockResolvedValue([]),
    };

    paymentRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      saveMany: vi.fn().mockResolvedValue(undefined),
      findByChargeId: vi.fn().mockResolvedValue([]),
      findByMemberAccountId: vi.fn().mockResolvedValue([]),
      getNextPaymentSequence: vi.fn().mockResolvedValue(10),
      getNextReceiptSequence: vi.fn().mockImplementation(() => Promise.resolve(++receiptSeq)),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new RecordMultiChargePaymentHandler(
      memberAccountRepository,
      paymentRepository,
      outboxPublisher,
    );
  });

  it('debería registrar pagos para múltiples cargos con misma referencia', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    // Verificar que se crearon 3 pagos
    expect(result).toHaveLength(3);

    // Verificar que todos comparten la misma referencia de pago
    const references = result.map((r) => r.paymentReference);
    expect(new Set(references).size).toBe(1);
    expect(references[0]).toMatch(/^EF-2025-00010$/);

    // Verificar importes: cada pago cubre el restante del cargo
    expect(result[0].amount).toBe(3000);
    expect(result[1].amount).toBe(2000);
    expect(result[2].amount).toBe(5000);

    // Verificar que cada pago tiene recibo único
    const receipts = result.map((r) => r.receiptNumber);
    expect(new Set(receipts).size).toBe(3);

    // Verificar persistencia
    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
    expect(paymentRepository.saveMany).not.toHaveBeenCalled();
    expect(outboxPublisher.publish).toHaveBeenCalledWith(
      TENANT_ID,
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'PaymentRecorded' }),
        expect.objectContaining({ eventType: 'ReceiptGenerated' }),
      ]),
    );
  });

  it('debería lanzar MemberAccountNotFoundError cuando la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(handler.execute(validCommand())).rejects.toThrow(MemberAccountNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar ChargeAlreadyPaidError si un cargo ya está pagado', async () => {
    const account = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [],
      charges: [
        createCharge(CHARGE_ID_1, 3000),
        createCharge(CHARGE_ID_2, 2000, 'PAID', 2000), // Ya pagado
        createCharge(CHARGE_ID_3, 5000),
      ],
      payments: [],
      createdAt: new Date(),
    });
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await expect(handler.execute(validCommand())).rejects.toThrow(ChargeAlreadyPaidError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar ChargeNotFoundError si un cargo no existe', async () => {
    const command = validCommand({
      chargeIds: [CHARGE_ID_1, '00000000-0000-4000-a000-000000000000'],
    });

    await expect(handler.execute(command)).rejects.toThrow(ChargeNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar FuturePaymentDateError cuando la fecha es futura (FE-2)', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const command = validCommand({ paymentDate: futureDate.toISOString().split('T')[0] });

    await expect(handler.execute(command)).rejects.toThrow(FuturePaymentDateError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar ChargeNotPayableError si un cargo está cancelado', async () => {
    const account = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [],
      charges: [
        createCharge(CHARGE_ID_1, 3000),
        createCharge(CHARGE_ID_2, 2000, 'CANCELLED', 0),
        createCharge(CHARGE_ID_3, 5000),
      ],
      payments: [],
      createdAt: new Date(),
    });
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    await expect(handler.execute(validCommand())).rejects.toThrow(ChargeNotPayableError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });
});
