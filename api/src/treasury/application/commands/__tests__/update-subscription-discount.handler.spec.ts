import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateSubscriptionDiscountHandler } from '../update-subscription-discount.handler';
import { UpdateSubscriptionDiscountCommand } from '../update-subscription-discount.command';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { TreasuryOutboxPublisher } from '../../ports/treasury-outbox.publisher';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { FeeSubscription } from '../../../domain/entities/fee-subscription';
import { Discount } from '../../../domain/value-objects/discount';
import {
  MemberAccountNotFoundError,
  SubscriptionNotFoundError,
  DiscountExceedsLimitError,
} from '../../../domain/exceptions';

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

/** Crea una suscripción activa con descuento inicial. */
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

/** Variable para la suscripción activa compartida entre tests. */
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

describe('UpdateSubscriptionDiscountHandler', () => {
  let handler: UpdateSubscriptionDiscountHandler;
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

    handler = new UpdateSubscriptionDiscountHandler(
      memberAccountRepository,
      feePlanRepository,
      outboxPublisher,
    );
  });

  /** Crea un comando válido con overrides opcionales. */
  function validCommand(
    overrides: Partial<UpdateSubscriptionDiscountCommand> = {},
  ): UpdateSubscriptionDiscountCommand {
    return new UpdateSubscriptionDiscountCommand(
      overrides.tenantId ?? TENANT_ID,
      overrides.memberAccountId ?? MEMBER_ACCOUNT_ID,
      overrides.subscriptionId ?? activeSubscription.id.toValue(),
      overrides.newPersonalDiscount ?? 0.15,
      overrides.reason ?? 'Ajuste por antigüedad',
      overrides.approvedBy ?? null,
    );
  }

  it('debería actualizar descuento y recalcular effectiveAmount (happy path)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    expect(result).toBeDefined();

    // El descuento por tipo se mantiene (0.1), el personal cambia a 0.15
    expect(result.typeDiscount).toBe(0.1);
    expect(result.personalDiscount).toBe(0.15);

    // Importe efectivo recalculado:
    // 12000 * (1 - 0.1) * (1 - 0.15) = 12000 * 0.9 * 0.85 = 9180
    expect(result.effectiveAmount).toBe(9180);
    expect(result.isActive).toBe(true);

    // Verificar configuración de tenantId
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);

    // Verificar persistencia y publicación de eventos
    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledWith(TENANT_ID, expect.any(Array));
  });

  it('debería lanzar DiscountExceedsLimitError cuando el descuento combinado >= 99%', async () => {
    // typeDiscount existente = 0.1, nuevo personalDiscount = 0.99
    // combinado = 1 - (0.9 * 0.01) = 1 - 0.009 = 0.991 ≥ 0.99
    const command = validCommand({ newPersonalDiscount: 0.99 });

    await expect(handler.execute(command)).rejects.toThrow(DiscountExceedsLimitError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar SubscriptionNotFoundError cuando la suscripción no existe', async () => {
    const command = validCommand({
      subscriptionId: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    await expect(handler.execute(command)).rejects.toThrow(SubscriptionNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar MemberAccountNotFoundError cuando la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberAccountNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });
});
