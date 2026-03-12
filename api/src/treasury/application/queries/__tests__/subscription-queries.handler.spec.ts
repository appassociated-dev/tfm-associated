import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetSubscriptionsHandler } from '../get-subscriptions.handler';
import { GetSubscriptionsQuery } from '../get-subscriptions.query';
import { GetActiveSubscriptionHandler } from '../get-active-subscription.handler';
import { GetActiveSubscriptionQuery } from '../get-active-subscription.query';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { FeeSubscription } from '../../../domain/entities/fee-subscription';
import { Discount } from '../../../domain/value-objects/discount';
import { MemberAccountNotFoundError, SubscriptionNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FEE_PLAN_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un FeePlan reconstituido activo. */
function createFeePlan(): FeePlan {
  return FeePlan.reconstitute({
    id: FEE_PLAN_ID,
    code: 'CUOTA-ANUAL',
    name: 'Cuota Anual',
    description: null,
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 12000,
    billingMonths: [1],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/** Crea una suscripción activa. */
function createActiveSubscription(): FeeSubscription {
  const discountResult = Discount.create(0.1, 0.05);
  if (!discountResult.ok) throw discountResult.error;

  return FeeSubscription.create({
    feePlanId: FEE_PLAN_ID,
    registrationDate: new Date('2025-01-01'),
    discount: discountResult.value,
    feePlanAmount: createFeePlan().amount,
    personalDiscountReason: null,
  });
}

/** Crea una suscripción cerrada. */
function createClosedSubscription(): FeeSubscription {
  return FeeSubscription.reconstitute({
    id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    feePlanId: FEE_PLAN_ID,
    registrationDate: new Date('2024-01-01'),
    leaveDate: new Date('2024-12-31'),
    typeDiscount: 0,
    personalDiscount: 0,
    personalDiscountReason: null,
    effectiveAmount: 12000,
    cancelReason: 'PLAN_CHANGE',
    createdAt: new Date(),
  });
}

/** Crea un MemberAccount con suscripciones (activa + cerrada). */
function createMemberAccountWithHistory(): MemberAccount {
  return MemberAccount.reconstitute({
    id: MEMBER_ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [createActiveSubscription(), createClosedSubscription()],
    createdAt: new Date(),
  });
}

/** Crea un MemberAccount sin suscripciones activas (solo cerradas). */
function createMemberAccountWithoutActive(): MemberAccount {
  return MemberAccount.reconstitute({
    id: MEMBER_ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [createClosedSubscription()],
    createdAt: new Date(),
  });
}

// =============================================================================
// GetSubscriptionsHandler
// =============================================================================

describe('GetSubscriptionsHandler', () => {
  let handler: GetSubscriptionsHandler;
  let memberAccountRepository: MemberAccountRepository;
  let feePlanRepository: FeePlanRepository;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(createMemberAccountWithHistory()),
      findByMemberId: vi.fn(),
      existsByMemberId: vi.fn(),
    };

    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(createFeePlan()),
      findByCode: vi.fn(),
      findAll: vi.fn(),
      existsByCode: vi.fn(),
      hasActiveSubscriptions: vi.fn(),
    };

    handler = new GetSubscriptionsHandler(memberAccountRepository, feePlanRepository);
  });

  it('debería retornar historial completo de suscripciones con datos del plan', async () => {
    const query = new GetSubscriptionsQuery(TENANT_ID, MEMBER_ACCOUNT_ID);

    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result.memberAccountId).toBe(MEMBER_ACCOUNT_ID);
    expect(result.memberId).toBe(MEMBER_ID);

    // Historial debe contener 2 suscripciones (activa + cerrada)
    expect(result.history).toHaveLength(2);

    // Debe existir suscripción activa enriquecida con info del plan
    expect(result.activeSubscription).toBeDefined();
    expect(result.activeSubscription!.feePlanName).toBe('Cuota Anual');
    expect(result.activeSubscription!.feePlanCode).toBe('CUOTA-ANUAL');
    expect(result.activeSubscription!.isActive).toBe(true);

    // Verificar configuración de tenantId en ambos repositorios
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });

  it('debería lanzar MemberAccountNotFoundError cuando la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetSubscriptionsQuery(TENANT_ID, MEMBER_ACCOUNT_ID);

    await expect(handler.execute(query)).rejects.toThrow(MemberAccountNotFoundError);
  });
});

// =============================================================================
// GetActiveSubscriptionHandler
// =============================================================================

describe('GetActiveSubscriptionHandler', () => {
  let handler: GetActiveSubscriptionHandler;
  let memberAccountRepository: MemberAccountRepository;
  let feePlanRepository: FeePlanRepository;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(createMemberAccountWithHistory()),
      findByMemberId: vi.fn(),
      existsByMemberId: vi.fn(),
    };

    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(createFeePlan()),
      findByCode: vi.fn(),
      findAll: vi.fn(),
      existsByCode: vi.fn(),
      hasActiveSubscriptions: vi.fn(),
    };

    handler = new GetActiveSubscriptionHandler(memberAccountRepository, feePlanRepository);
  });

  it('debería retornar la suscripción activa enriquecida con datos del plan', async () => {
    const query = new GetActiveSubscriptionQuery(TENANT_ID, MEMBER_ACCOUNT_ID);

    const result = await handler.execute(query);

    expect(result).toBeDefined();
    expect(result.feePlanId).toBe(FEE_PLAN_ID);
    expect(result.feePlanName).toBe('Cuota Anual');
    expect(result.feePlanCode).toBe('CUOTA-ANUAL');
    expect(result.isActive).toBe(true);
    expect(result.leaveDate).toBeNull();
    expect(result.typeDiscount).toBe(0.1);
    expect(result.personalDiscount).toBe(0.05);

    // Importe efectivo: 12000 * 0.9 * 0.95 = 10260
    expect(result.effectiveAmount).toBe(10260);

    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });

  it('debería lanzar SubscriptionNotFoundError cuando no existe suscripción activa', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      createMemberAccountWithoutActive(),
    );

    const query = new GetActiveSubscriptionQuery(TENANT_ID, MEMBER_ACCOUNT_ID);

    await expect(handler.execute(query)).rejects.toThrow(SubscriptionNotFoundError);
  });

  it('debería lanzar MemberAccountNotFoundError cuando la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const query = new GetActiveSubscriptionQuery(TENANT_ID, MEMBER_ACCOUNT_ID);

    await expect(handler.execute(query)).rejects.toThrow(MemberAccountNotFoundError);
  });
});
