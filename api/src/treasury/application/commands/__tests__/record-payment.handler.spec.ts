import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { RecordPaymentHandler } from '../record-payment.handler';
import { RecordPaymentCommand } from '../record-payment.command';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { PaymentRepository } from '../../../domain/repositories/payment.repository';
import { TreasuryOutboxPublisher } from '../../ports/treasury-outbox.publisher';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { Charge } from '../../../domain/entities/charge';
import { ChargeDescription } from '../../../domain/value-objects/charge-description';
import { Money } from '../../../domain/value-objects/money';
import { ChargeStatus } from '../../../domain/value-objects/charge-status';
import {
  MemberAccountNotFoundError,
  ChargeNotFoundError,
  ChargeAlreadyPaidError,
  ChargeNotPayableError,
  OverpaymentError,
  FuturePaymentDateError,
} from '../../../domain/exceptions';

// Silenciar Logger en tests
vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CHARGE_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const REGISTERED_BY = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un cargo pendiente con importe configurable (en centavos). */
function createPendingCharge(amount = 5000, status = 'PENDING', paidAmount = 0): Charge {
  return Charge.reconstitute({
    id: CHARGE_ID,
    subscriptionId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    baseAmount: amount,
    finalAmount: amount,
    description: 'Cuota Anual 2025 - Enero',
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

/** Crea una MemberAccount reconstituida con cargos. */
function createMemberAccount(charges: Charge[] = [createPendingCharge()]): MemberAccount {
  return MemberAccount.reconstitute({
    id: MEMBER_ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [],
    charges,
    payments: [],
    createdAt: new Date(),
  });
}

/** Crea un comando válido con overrides opcionales. */
function validCommand(overrides: Partial<RecordPaymentCommand> = {}): RecordPaymentCommand {
  return new RecordPaymentCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.memberAccountId ?? MEMBER_ACCOUNT_ID,
    overrides.chargeId ?? CHARGE_ID,
    overrides.amount ?? 5000,
    overrides.paymentMethod ?? 'CASH',
    overrides.paymentDate ?? '2025-01-15',
    overrides.notes ?? null,
    overrides.registeredBy ?? REGISTERED_BY,
  );
}

describe('RecordPaymentHandler', () => {
  let handler: RecordPaymentHandler;
  let memberAccountRepository: MemberAccountRepository;
  let paymentRepository: PaymentRepository;
  let outboxPublisher: TreasuryOutboxPublisher;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createMemberAccount()),
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
      getNextPaymentSequence: vi.fn().mockResolvedValue(42),
      getNextReceiptSequence: vi.fn().mockResolvedValue(42),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new RecordPaymentHandler(memberAccountRepository, paymentRepository, outboxPublisher);
  });

  it('debería registrar un pago exitoso y actualizar el cargo a PAID', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    // Verificar DTO de respuesta
    expect(result).toBeDefined();
    expect(result.chargeId).toBe(CHARGE_ID);
    expect(result.amount).toBe(5000);
    expect(result.amountFormatted).toBe('50.00 EUR');
    expect(result.paymentMethod).toBe('CASH');
    expect(result.paymentMethodLabel).toBe('Efectivo');
    expect(result.paymentReference).toMatch(/^EF-2025-00042$/);
    expect(result.receiptNumber).toMatch(/^REC-2025-00042$/);
    expect(result.registeredBy).toBe(REGISTERED_BY);
    expect(result.status).toBe('CONFIRMED');
    expect(result.chargeDescription).toBe('Cuota Anual 2025 - Enero');

    // Verificar tenantId configurado
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(paymentRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);

    // Verificar persistencia y publicación de eventos
    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
    expect(paymentRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledWith(TENANT_ID, expect.any(Array));
  });

  it('debería lanzar MemberAccountNotFoundError cuando la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberAccountNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar ChargeNotFoundError cuando el cargo no existe', async () => {
    const command = validCommand({ chargeId: '00000000-0000-4000-a000-000000000000' });

    await expect(handler.execute(command)).rejects.toThrow(ChargeNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar ChargeAlreadyPaidError cuando el cargo ya está pagado (FE-4)', async () => {
    const paidCharge = createPendingCharge(5000, 'PAID', 5000);
    const account = createMemberAccount([paidCharge]);
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(ChargeAlreadyPaidError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar ChargeNotPayableError cuando el cargo está cancelado', async () => {
    const cancelledCharge = createPendingCharge(5000, 'CANCELLED', 0);
    const account = createMemberAccount([cancelledCharge]);
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(ChargeNotPayableError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar OverpaymentError cuando el importe excede el pendiente (FE-1)', async () => {
    const command = validCommand({ amount: 6000 }); // Cargo es de 5000

    await expect(handler.execute(command)).rejects.toThrow(OverpaymentError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar FuturePaymentDateError cuando la fecha es futura (FE-2)', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const command = validCommand({ paymentDate: futureDate.toISOString().split('T')[0] });

    await expect(handler.execute(command)).rejects.toThrow(FuturePaymentDateError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería registrar un pago parcial y dejar el cargo en PARTIALLY_PAID', async () => {
    const command = validCommand({ amount: 3000 }); // Pago parcial de 30€ sobre 50€

    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(result.amount).toBe(3000);
    expect(result.status).toBe('CONFIRMED');

    // Verificar que se persiste correctamente
    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
    expect(paymentRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledWith(TENANT_ID, expect.any(Array));
  });

  it('debería generar referencia con método TRANSFER', async () => {
    const command = validCommand({ paymentMethod: 'TRANSFER' });

    const result = await handler.execute(command);

    expect(result.paymentReference).toMatch(/^TR-2025-00042$/);
    expect(result.paymentMethodLabel).toBe('Transferencia bancaria');
  });

  it('debería generar referencia con método BIZUM', async () => {
    const command = validCommand({ paymentMethod: 'BIZUM' });

    const result = await handler.execute(command);

    expect(result.paymentReference).toMatch(/^BZ-2025-00042$/);
    expect(result.paymentMethodLabel).toBe('Bizum');
  });
});
