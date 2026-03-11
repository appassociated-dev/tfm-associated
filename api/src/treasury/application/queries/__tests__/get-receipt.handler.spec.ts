import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetReceiptHandler } from '../get-receipt.handler';
import { GetReceiptQuery } from '../get-receipt.query';
import { PaymentRepository } from '../../../domain/repositories/payment.repository';
import { MemberQueryPort } from '../../../domain/ports/member-query.port';
import { ChargeRepository } from '../../../domain/repositories/charge.repository';
import { ReceiptGeneratorPort } from '../../../infrastructure/services/receipt-generator';
import { Payment } from '../../../domain/entities/payment';
import { PaymentNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const PAYMENT_ID = '00000000-0000-4000-a000-000000000001';
const CHARGE_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

function createPayment(): Payment {
  return Payment.reconstitute({
    id: PAYMENT_ID,
    chargeId: CHARGE_ID,
    amount: 2450,
    paymentMethod: 'CASH',
    paymentDate: new Date('2025-02-04'),
    paymentReference: 'EF-2025-00042',
    receiptNumber: 'REC-2025-00042',
    notes: 'Pago en reunion',
    registeredBy: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    status: 'CONFIRMED',
    createdAt: new Date('2025-02-04T10:35:00Z'),
  });
}

describe('GetReceiptHandler', () => {
  let handler: GetReceiptHandler;
  let paymentRepository: PaymentRepository;
  let memberQueryPort: MemberQueryPort;
  let chargeRepository: ChargeRepository;
  let receiptGenerator: ReceiptGeneratorPort;

  beforeEach(() => {
    paymentRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      findByChargeId: vi.fn(),
      findByMemberAccountId: vi.fn(),
      getNextPaymentSequence: vi.fn(),
      getNextReceiptSequence: vi.fn(),
      findById: vi.fn().mockResolvedValue(createPayment()),
      getReceiptDocument: vi.fn().mockResolvedValue(Buffer.from('stored-pdf')),
      updateReceipt: vi.fn().mockResolvedValue(undefined),
    } as unknown as PaymentRepository;

    memberQueryPort = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: 'member-1',
        memberNumber: 'SOC-001',
        name: 'Juan',
        surnames: 'Garcia Lopez',
        memberTypeId: 'type-1',
        currentStatus: 'ACTIVE',
        active: true,
      }),
      findActiveMembers: vi.fn(),
      searchMembers: vi.fn(),
    };

    chargeRepository = {
      setTenantId: vi.fn(),
      saveMany: vi.fn(),
      findBySubscriptionAndPeriod: vi.fn(),
      findExistingKeys: vi.fn(),
      findByMemberAccountId: vi.fn(),
      findPendingByMemberAccountId: vi.fn(),
      prisma: {
        charge: {
          findUnique: vi.fn().mockResolvedValue({
            description: 'Cuota Q1 2025',
            memberAccountId: 'account-1',
          }),
        },
        memberAccount: {
          findUnique: vi.fn().mockResolvedValue({ memberId: 'member-1' }),
        },
      },
    } as unknown as ChargeRepository;

    receiptGenerator = {
      generateReceipt: vi.fn().mockResolvedValue(Buffer.from('generated-pdf')),
    };

    handler = new GetReceiptHandler(
      paymentRepository,
      memberQueryPort,
      chargeRepository,
      receiptGenerator,
    );
  });

  it('debería devolver el PDF almacenado sin regenerarlo', async () => {
    const result = await handler.execute(new GetReceiptQuery(TENANT_ID, PAYMENT_ID));

    expect(result).toEqual(Buffer.from('stored-pdf'));
    expect(paymentRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(chargeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(receiptGenerator.generateReceipt).not.toHaveBeenCalled();
  });

  it('debería regenerar y almacenar el recibo cuando no existe en BD', async () => {
    (paymentRepository.getReceiptDocument as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await handler.execute(new GetReceiptQuery(TENANT_ID, PAYMENT_ID));

    expect(result).toEqual(Buffer.from('generated-pdf'));
    expect(receiptGenerator.generateReceipt).toHaveBeenCalledOnce();
    expect(paymentRepository.updateReceipt as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      PAYMENT_ID,
      'REC-2025-00042',
      Buffer.from('generated-pdf'),
    );
  });

  it('debería lanzar PaymentNotFoundError si el pago no existe', async () => {
    (paymentRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(handler.execute(new GetReceiptQuery(TENANT_ID, PAYMENT_ID))).rejects.toThrow(
      PaymentNotFoundError,
    );
  });
});
