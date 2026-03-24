import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetChargesByAccountHandler } from '../get-charges-by-account.handler';
import { GetChargesByAccountQuery } from '../get-charges-by-account.query';
import { ChargeRepository } from '../../../domain/repositories/charge.repository';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { Charge } from '../../../domain/entities/charge';
import { FeeSubscription } from '../../../domain/entities/fee-subscription';
import { MemberAccountNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01';
const FEE_PLAN_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01';
const SUBSCRIPTION_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01';

/** Crea una suscripción para la cuenta. */
function createSubscriptionForAccount(): FeeSubscription {
  return FeeSubscription.reconstitute({
    id: SUBSCRIPTION_ID,
    feePlanId: FEE_PLAN_ID,
    registrationDate: new Date('2025-01-01'),
    leaveDate: null,
    typeDiscount: 0,
    personalDiscount: 0,
    personalDiscountReason: null,
    effectiveAmount: 5000,
    cancelReason: null,
    createdAt: new Date(),
  });
}

/** Crea una cuenta de socio con una suscripción. */
function createAccount(): MemberAccount {
  const sub = createSubscriptionForAccount();
  return MemberAccount.reconstitute({
    id: MEMBER_ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [sub],
    createdAt: new Date(),
  });
}

/** Crea un cargo de dominio reconstituido. */
function createCharge(billingMonth: number, status = 'PENDING'): Charge {
  return Charge.reconstitute({
    id: `e0eebc99-9c0b-4ef8-bb6d-6bb9bd380e0${billingMonth}`,
    subscriptionId: SUBSCRIPTION_ID,
    baseAmount: 5000,
    finalAmount: 5000,
    description: `Cargo ${billingMonth.toString().padStart(2, '0')}/2025`,
    fiscalYearId: null,
    billingMonth,
    billingYear: 2025,
    issueDate: new Date(2025, billingMonth - 1, 1),
    dueDate: new Date(2025, billingMonth, 0),
    status,
    paidAmount: status === 'PAID' ? 5000 : 0,
    isProrated: false,
    isManual: false,
    createdAt: new Date(),
  });
}

/** Crea un plan reconstituido. */
function createPlan(): FeePlan {
  return FeePlan.reconstitute({
    id: FEE_PLAN_ID,
    code: 'CUOTA-MENSUAL',
    name: 'Cuota Mensual',
    description: null,
    type: 'RECURRING',
    frequency: 'MONTHLY',
    amount: 5000,
    billingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('GetChargesByAccountHandler', () => {
  let handler: GetChargesByAccountHandler;
  let chargeRepository: ChargeRepository;
  let memberAccountRepository: MemberAccountRepository;
  let feePlanRepository: FeePlanRepository;

  beforeEach(() => {
    chargeRepository = {
      setTenantId: vi.fn(),
      saveMany: vi.fn(),
      findBySubscriptionAndPeriod: vi.fn(),
      findExistingKeys: vi.fn(),
      findByMemberAccountId: vi
        .fn()
        .mockResolvedValue([createCharge(1), createCharge(2), createCharge(3, 'PAID')]),
      findPendingByMemberAccountId: vi.fn().mockResolvedValue([createCharge(1), createCharge(2)]),
    };

    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(createAccount()),
      findByMemberId: vi.fn(),
      existsByMemberId: vi.fn(),
      findAllWithActiveSubscriptions: vi.fn(),
    };

    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findAll: vi.fn().mockResolvedValue([createPlan()]),
      existsByCode: vi.fn(),
      hasActiveSubscriptions: vi.fn(),
    };

    handler = new GetChargesByAccountHandler(
      chargeRepository,
      memberAccountRepository,
      feePlanRepository,
    );
  });

  it('debe listar todos los cargos de una cuenta correctamente', async () => {
    const query = new GetChargesByAccountQuery(TENANT_ID, MEMBER_ACCOUNT_ID);

    const result = await handler.execute(query);

    expect(result).toHaveLength(3);
    expect(chargeRepository.findByMemberAccountId).toHaveBeenCalledTimes(1);

    // Verificar estructura del DTO
    const firstCharge = result[0];
    expect(firstCharge.id).toBeDefined();
    expect(firstCharge.subscriptionId).toBe(SUBSCRIPTION_ID);
    expect(firstCharge.finalAmount).toBe(5000);
    expect(firstCharge.finalAmountFormatted).toBe('50.00 EUR');
    expect(firstCharge.status).toBe('PENDING');
    expect(firstCharge.feePlanName).toBe('Cuota Mensual');
  });

  it('debe filtrar por estado PENDING cuando se indica', async () => {
    const query = new GetChargesByAccountQuery(TENANT_ID, MEMBER_ACCOUNT_ID, 'PENDING');

    const result = await handler.execute(query);

    expect(result).toHaveLength(2);
    expect(chargeRepository.findPendingByMemberAccountId).toHaveBeenCalledTimes(1);

    for (const dto of result) {
      expect(dto.status).toBe('PENDING');
    }
  });

  it('debe lanzar MemberAccountNotFoundError si la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetChargesByAccountQuery(TENANT_ID, MEMBER_ACCOUNT_ID);

    await expect(handler.execute(query)).rejects.toThrow(MemberAccountNotFoundError);
  });

  it('debe establecer tenantId en todos los repositorios', async () => {
    const query = new GetChargesByAccountQuery(TENANT_ID, MEMBER_ACCOUNT_ID);

    await handler.execute(query);

    expect(chargeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });

  it('debe retornar lista vacía si la cuenta no tiene cargos', async () => {
    (chargeRepository.findByMemberAccountId as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const query = new GetChargesByAccountQuery(TENANT_ID, MEMBER_ACCOUNT_ID);

    const result = await handler.execute(query);

    expect(result).toHaveLength(0);
  });
});
