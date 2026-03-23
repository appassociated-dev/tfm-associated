import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetPendingChargesHandler } from '../get-pending-charges.handler';
import { GetPendingChargesQuery } from '../get-pending-charges.query';
import { GetAccountBalanceHandler } from '../get-account-balance.handler';
import { GetAccountBalanceQuery } from '../get-account-balance.query';
import { SearchMembersForPaymentHandler } from '../search-members-for-payment.handler';
import { SearchMembersForPaymentQuery } from '../search-members-for-payment.query';
import { GetPaymentsByAccountHandler } from '../get-payments-by-account.handler';
import { GetPaymentsByAccountQuery } from '../get-payments-by-account.query';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { PaymentRepository } from '../../../domain/repositories/payment.repository';
import { MemberQueryPort } from '../../../domain/ports/member-query.port';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { Charge } from '../../../domain/entities/charge';
import { Payment } from '../../../domain/entities/payment';
import { MemberAccountNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CHARGE_ID_1 = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CHARGE_ID_2 = 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CHARGE_ID_3 = 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un cargo reconstituido. */
function createCharge(
  id: string,
  amount: number,
  status: string,
  paidAmount: number,
  dueDate: string,
): Charge {
  return Charge.reconstitute({
    id,
    subscriptionId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    baseAmount: amount,
    finalAmount: amount,
    description: `Cargo ${id.slice(-4)}`,
    fiscalYearId: null,
    billingMonth: 1,
    billingYear: 2025,
    issueDate: new Date('2025-01-01'),
    dueDate: new Date(dueDate),
    status,
    paidAmount,
    isProrated: false,
    isManual: false,
    createdAt: new Date('2025-01-01'),
  });
}

/** Genera un UUID determinístico basado en un sufijo. */
function paymentUuid(suffix: string): string {
  return `00000000-0000-4000-a000-${suffix.padStart(12, '0')}`;
}

/** Crea un pago reconstituido. */
function createPayment(chargeId: string, amount: number, date: string): Payment {
  return Payment.reconstitute({
    id: paymentUuid(chargeId.slice(-4)),
    chargeId,
    amount,
    paymentMethod: 'CASH',
    paymentDate: new Date(date),
    paymentReference: 'EF-2025-00001',
    receiptNumber: 'REC-2025-00001',
    notes: null,
    registeredBy: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    status: 'CONFIRMED',
    createdAt: new Date(date),
  });
}

describe('GetPendingChargesHandler', () => {
  let handler: GetPendingChargesHandler;
  let memberAccountRepository: MemberAccountRepository;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByMemberId: vi.fn(),
      existsByMemberId: vi.fn(),
      findAllWithActiveSubscriptions: vi.fn(),
    };
    handler = new GetPendingChargesHandler(memberAccountRepository);
  });

  it('debería retornar cargos pendientes ordenados por vencimiento ASC', async () => {
    const account = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [],
      charges: [
        createCharge(CHARGE_ID_1, 3000, 'PENDING', 0, '2025-03-31'),
        createCharge(CHARGE_ID_2, 2000, 'PARTIALLY_PAID', 500, '2025-01-31'),
        createCharge(CHARGE_ID_3, 5000, 'PAID', 5000, '2025-02-28'),
      ],
      payments: [],
      createdAt: new Date(),
    });
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const query = new GetPendingChargesQuery(TENANT_ID, MEMBER_ACCOUNT_ID);
    const result = await handler.execute(query);

    // Solo 2 cargos pendientes (PENDING y PARTIALLY_PAID), PAID excluido
    expect(result).toHaveLength(2);

    // Ordenados por dueDate ASC: enero antes que marzo
    expect(result[0].id).toBe(CHARGE_ID_2);
    expect(result[0].status).toBe('PARTIALLY_PAID');
    expect(result[0].remainingAmount).toBe(1500);

    expect(result[1].id).toBe(CHARGE_ID_1);
    expect(result[1].status).toBe('PENDING');
    expect(result[1].remainingAmount).toBe(3000);
  });

  it('debería retornar lista vacía sin cargos pendientes', async () => {
    const account = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [],
      charges: [createCharge(CHARGE_ID_1, 5000, 'PAID', 5000, '2025-01-31')],
      payments: [],
      createdAt: new Date(),
    });
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const query = new GetPendingChargesQuery(TENANT_ID, MEMBER_ACCOUNT_ID);
    const result = await handler.execute(query);

    expect(result).toHaveLength(0);
  });

  it('debería calcular isOverdue correctamente', async () => {
    const pastDate = '2020-01-31'; // Fecha pasada → overdue
    const account = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [],
      charges: [createCharge(CHARGE_ID_1, 3000, 'PENDING', 0, pastDate)],
      payments: [],
      createdAt: new Date(),
    });
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const query = new GetPendingChargesQuery(TENANT_ID, MEMBER_ACCOUNT_ID);
    const result = await handler.execute(query);

    expect(result[0].isOverdue).toBe(true);
  });

  it('debería lanzar MemberAccountNotFoundError si la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetPendingChargesQuery(TENANT_ID, MEMBER_ACCOUNT_ID);
    await expect(handler.execute(query)).rejects.toThrow(MemberAccountNotFoundError);
  });
});

describe('GetAccountBalanceHandler', () => {
  let handler: GetAccountBalanceHandler;
  let memberAccountRepository: MemberAccountRepository;
  let memberQueryPort: MemberQueryPort;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByMemberId: vi.fn(),
      existsByMemberId: vi.fn(),
      findAllWithActiveSubscriptions: vi.fn(),
    };
    memberQueryPort = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: MEMBER_ID,
        memberNumber: 'SOC-001',
        name: 'Juan',
        surnames: 'García López',
        memberTypeId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        currentStatus: 'ACTIVE',
        active: true,
      }),
      findActiveMembers: vi.fn(),
      searchMembers: vi.fn(),
    };
    handler = new GetAccountBalanceHandler(memberAccountRepository, memberQueryPort);
  });

  it('debería calcular el balance correctamente con deuda pendiente', async () => {
    const account = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [],
      charges: [
        createCharge(CHARGE_ID_1, 3000, 'PENDING', 0, '2025-01-31'),
        createCharge(CHARGE_ID_2, 2000, 'PARTIALLY_PAID', 500, '2025-02-28'),
        createCharge(CHARGE_ID_3, 5000, 'PAID', 5000, '2025-03-31'),
      ],
      payments: [],
      createdAt: new Date(),
    });
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const query = new GetAccountBalanceQuery(TENANT_ID, MEMBER_ACCOUNT_ID);
    const result = await handler.execute(query);

    // Balance = 3000 (pending) + 1500 (remaining of partially paid) = 4500
    expect(result.totalPending).toBe(4500);
    expect(result.totalPendingFormatted).toBe('45.00 EUR');
    expect(result.chargeCount).toBe(2);
    expect(result.memberName).toBe('Juan García López');
    expect(result.memberNumber).toBe('SOC-001');
    expect(result.oldestDueDate).toEqual(new Date('2025-01-31'));
  });

  it('debería retornar balance 0 sin cargos pendientes', async () => {
    const account = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [],
      charges: [],
      payments: [],
      createdAt: new Date(),
    });
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const query = new GetAccountBalanceQuery(TENANT_ID, MEMBER_ACCOUNT_ID);
    const result = await handler.execute(query);

    expect(result.totalPending).toBe(0);
    expect(result.chargeCount).toBe(0);
    expect(result.oldestDueDate).toBeNull();
  });
});

describe('SearchMembersForPaymentHandler', () => {
  let handler: SearchMembersForPaymentHandler;
  let memberQueryPort: MemberQueryPort;
  let memberAccountRepository: MemberAccountRepository;

  beforeEach(() => {
    memberQueryPort = {
      setTenantId: vi.fn(),
      findById: vi.fn(),
      findActiveMembers: vi.fn(),
      searchMembers: vi.fn().mockResolvedValue([
        {
          id: MEMBER_ID,
          memberNumber: 'SOC-001',
          name: 'Juan',
          surnames: 'García López',
          memberTypeId: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          currentStatus: 'ACTIVE',
          active: true,
        },
      ]),
    };

    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByMemberId: vi.fn().mockResolvedValue(
        MemberAccount.reconstitute({
          id: MEMBER_ACCOUNT_ID,
          memberId: MEMBER_ID,
          tenantId: TENANT_ID,
          subscriptions: [],
          charges: [
            createCharge(CHARGE_ID_1, 3000, 'PENDING', 0, '2025-01-31'),
            createCharge(CHARGE_ID_2, 2000, 'PENDING', 0, '2025-02-28'),
          ],
          payments: [],
          createdAt: new Date(),
        }),
      ),
      existsByMemberId: vi.fn(),
      findAllWithActiveSubscriptions: vi.fn(),
    };

    handler = new SearchMembersForPaymentHandler(memberQueryPort, memberAccountRepository);
  });

  it('debería buscar socios por nombre y retornar resultados con balance', async () => {
    const query = new SearchMembersForPaymentQuery(TENANT_ID, 'garcía');
    const result = await handler.execute(query);

    expect(result).toHaveLength(1);
    expect(result[0].memberId).toBe(MEMBER_ID);
    expect(result[0].memberAccountId).toBe(MEMBER_ACCOUNT_ID);
    expect(result[0].memberNumber).toBe('SOC-001');
    expect(result[0].name).toBe('Juan');
    expect(result[0].surnames).toBe('García López');
    expect(result[0].pendingBalance).toBe(5000);
    expect(result[0].pendingCharges).toBe(2);

    expect(memberQueryPort.searchMembers).toHaveBeenCalledWith('garcía');
  });

  it('debería retornar balance 0 si el socio no tiene cuenta', async () => {
    (memberAccountRepository.findByMemberId as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new SearchMembersForPaymentQuery(TENANT_ID, 'SOC-001');
    const result = await handler.execute(query);

    expect(result).toHaveLength(1);
    expect(result[0].memberAccountId).toBeNull();
    expect(result[0].pendingBalance).toBe(0);
    expect(result[0].pendingCharges).toBe(0);
  });

  it('debería retornar lista vacía si no hay coincidencias', async () => {
    (memberQueryPort.searchMembers as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const query = new SearchMembersForPaymentQuery(TENANT_ID, 'inexistente');
    const result = await handler.execute(query);

    expect(result).toHaveLength(0);
  });
});

describe('GetPaymentsByAccountHandler', () => {
  let handler: GetPaymentsByAccountHandler;
  let memberAccountRepository: MemberAccountRepository;
  let paymentRepository: PaymentRepository;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByMemberId: vi.fn(),
      existsByMemberId: vi.fn(),
      findAllWithActiveSubscriptions: vi.fn(),
    };
    paymentRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      findByChargeId: vi.fn(),
      findByMemberAccountId: vi.fn().mockResolvedValue([]),
      getNextPaymentSequence: vi.fn(),
      getNextReceiptSequence: vi.fn(),
    };
    handler = new GetPaymentsByAccountHandler(memberAccountRepository, paymentRepository);
  });

  it('debería retornar pagos ordenados por fecha descendente', async () => {
    const account = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [],
      charges: [createCharge(CHARGE_ID_1, 5000, 'PAID', 5000, '2025-01-31')],
      payments: [],
      createdAt: new Date(),
    });
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(account);

    const payment1 = createPayment(CHARGE_ID_1, 2000, '2025-01-10');
    const payment2 = createPayment(CHARGE_ID_1, 3000, '2025-01-20');
    (paymentRepository.findByMemberAccountId as ReturnType<typeof vi.fn>).mockResolvedValue([
      payment1,
      payment2,
    ]);

    const query = new GetPaymentsByAccountQuery(TENANT_ID, MEMBER_ACCOUNT_ID);
    const result = await handler.execute(query);

    expect(result).toHaveLength(2);
    // Más reciente primero
    expect(result[0].amount).toBe(3000);
    expect(result[1].amount).toBe(2000);
  });

  it('debería lanzar MemberAccountNotFoundError si la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetPaymentsByAccountQuery(TENANT_ID, MEMBER_ACCOUNT_ID);
    await expect(handler.execute(query)).rejects.toThrow(MemberAccountNotFoundError);
  });
});
