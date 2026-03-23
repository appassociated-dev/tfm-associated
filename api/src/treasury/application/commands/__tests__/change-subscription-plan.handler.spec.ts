import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChangeSubscriptionPlanHandler } from '../change-subscription-plan.handler';
import { ChangeSubscriptionPlanCommand } from '../change-subscription-plan.command';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { TreasuryOutboxPublisher } from '../../ports/treasury-outbox.publisher';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { FeeSubscription } from '../../../domain/entities/fee-subscription';
import { Discount } from '../../../domain/value-objects/discount';
import {
  MemberAccountNotFoundError,
  FeePlanNotFoundError,
  SubscriptionNotFoundError,
} from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const CURRENT_FEE_PLAN_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const NEW_FEE_PLAN_ID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un descuento válido. */
function createDiscount(typeDiscount = 0.1, personalDiscount = 0.05): Discount {
  const result = Discount.create(typeDiscount, personalDiscount);
  if (!result.ok) throw result.error;
  return result.value;
}

/** Crea un FeePlan reconstituido activo. */
function createFeePlan(
  overrides: Partial<{ id: string; active: boolean; amount: number }> = {},
): FeePlan {
  return FeePlan.reconstitute({
    id: overrides.id ?? NEW_FEE_PLAN_ID,
    code: 'CUOTA-SEMESTRAL',
    name: 'Cuota Semestral',
    description: null,
    type: 'RECURRING',
    frequency: 'BIANNUAL',
    amount: overrides.amount ?? 6000,
    billingMonths: [1, 7],
    active: overrides.active ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/** Crea una suscripción activa vinculada al plan actual. */
function createActiveSubscription(): FeeSubscription {
  const currentPlan = FeePlan.reconstitute({
    id: CURRENT_FEE_PLAN_ID,
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

  return FeeSubscription.create({
    feePlanId: CURRENT_FEE_PLAN_ID,
    registrationDate: new Date('2025-01-01'),
    discount: createDiscount(0.1, 0.05),
    feePlanAmount: currentPlan.amount,
    personalDiscountReason: null,
  });
}

/** Variable para compartir el ID de la suscripción creada. */
let activeSubscription: FeeSubscription;

/** Crea un MemberAccount con una suscripción activa. */
function createMemberAccountWithSubscription(): MemberAccount {
  activeSubscription = createActiveSubscription();
  return MemberAccount.reconstitute({
    id: MEMBER_ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [activeSubscription],
    createdAt: new Date(),
  });
}

describe('ChangeSubscriptionPlanHandler', () => {
  let handler: ChangeSubscriptionPlanHandler;
  let memberAccountRepository: MemberAccountRepository;
  let feePlanRepository: FeePlanRepository;
  let outboxPublisher: TreasuryOutboxPublisher;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createMemberAccountWithSubscription()),
      findByMemberId: vi.fn().mockResolvedValue(null),
      existsByMemberId: vi.fn().mockResolvedValue(false),
      findAllWithActiveSubscriptions: vi.fn().mockResolvedValue([]),
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

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new ChangeSubscriptionPlanHandler(
      memberAccountRepository,
      feePlanRepository,
      outboxPublisher,
    );
  });

  /** Crea un comando válido con overrides opcionales. */
  function validCommand(
    overrides: Partial<ChangeSubscriptionPlanCommand> = {},
  ): ChangeSubscriptionPlanCommand {
    return new ChangeSubscriptionPlanCommand(
      overrides.tenantId ?? TENANT_ID,
      overrides.memberAccountId ?? MEMBER_ACCOUNT_ID,
      overrides.currentSubscriptionId ?? activeSubscription.id.toValue(),
      overrides.newFeePlanId ?? NEW_FEE_PLAN_ID,
      overrides.effectiveDate ?? new Date('2026-03-11'),
      overrides.maintainDiscount ?? false,
    );
  }

  it('debería cerrar suscripción actual y crear nueva con eventos publicados (happy path)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    // Verificar que se retornan ambas suscripciones
    expect(result).toBeDefined();
    expect(result.closedSubscription).toBeDefined();
    expect(result.newSubscription).toBeDefined();

    // La nueva suscripción apunta al nuevo plan
    expect(result.newSubscription.feePlanId).toBe(NEW_FEE_PLAN_ID);
    expect(result.newSubscription.isActive).toBe(true);

    // Verificar persistencia y publicación de eventos
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledWith(TENANT_ID, expect.any(Array));
  });

  it('debería lanzar SubscriptionNotFoundError cuando la suscripción no existe', async () => {
    const command = validCommand({
      currentSubscriptionId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    await expect(handler.execute(command)).rejects.toThrow(SubscriptionNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar SubscriptionNotFoundError cuando la suscripción ya está cerrada', async () => {
    // Crear cuenta con suscripción cerrada
    const closedSub = FeeSubscription.reconstitute({
      id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      feePlanId: CURRENT_FEE_PLAN_ID,
      registrationDate: new Date('2025-01-01'),
      leaveDate: new Date('2025-06-01'),
      typeDiscount: 0.1,
      personalDiscount: 0.05,
      personalDiscountReason: null,
      effectiveAmount: 10260,
      cancelReason: 'MEMBER_LEAVE',
      createdAt: new Date(),
    });

    const accountWithClosedSub = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [closedSub],
      createdAt: new Date(),
    });

    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      accountWithClosedSub,
    );

    const command = validCommand({
      currentSubscriptionId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    await expect(handler.execute(command)).rejects.toThrow(SubscriptionNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería mantener el descuento cuando maintainDiscount es true', async () => {
    const command = validCommand({ maintainDiscount: true });

    const result = await handler.execute(command);

    // La nueva suscripción debe tener el mismo descuento que la anterior
    expect(result.newSubscription.typeDiscount).toBe(0.1);
    expect(result.newSubscription.personalDiscount).toBe(0.05);

    // Importe efectivo con nuevo plan (6000) y descuento mantenido:
    // 6000 * (1 - 0.1) * (1 - 0.05) = 6000 * 0.9 * 0.95 = 5130
    expect(result.newSubscription.effectiveAmount).toBe(5130);

    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
  });

  it('debería lanzar FeePlanNotFoundError cuando el nuevo plan no existe', async () => {
    (feePlanRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(FeePlanNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar MemberAccountNotFoundError cuando la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberAccountNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });
});
