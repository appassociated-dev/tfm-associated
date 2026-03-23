import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateSubscriptionHandler } from '../create-subscription.handler';
import { CreateSubscriptionCommand } from '../create-subscription.command';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { MemberTypeFeePlanRepository } from '../../../domain/repositories/member-type-fee-plan.repository';
import { MemberQueryPort } from '../../../domain/ports/member-query.port';
import { TreasuryOutboxPublisher } from '../../ports/treasury-outbox.publisher';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { MemberTypeFeePlan } from '../../../domain/entities/member-type-fee-plan';
import {
  FeePlanNotFoundError,
  MemberAccountNotFoundError,
  PlanNotAvailableForMemberTypeError,
  DiscountExceedsLimitError,
  ActiveSubscriptionExistsError,
} from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const FEE_PLAN_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_TYPE_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

/** Crea un comando válido con overrides opcionales. */
function validCommand(
  overrides: Partial<CreateSubscriptionCommand> = {},
): CreateSubscriptionCommand {
  return new CreateSubscriptionCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.memberAccountId ?? MEMBER_ACCOUNT_ID,
    overrides.feePlanId ?? FEE_PLAN_ID,
    overrides.typeDiscount ?? 0.1,
    overrides.personalDiscount ?? 0.05,
    overrides.personalDiscountReason ?? null,
  );
}

/** Crea un MemberAccount reconstituido sin suscripciones. */
function createMemberAccount(): MemberAccount {
  return MemberAccount.reconstitute({
    id: MEMBER_ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [],
    createdAt: new Date(),
  });
}

/** Crea un FeePlan reconstituido activo de tipo RECURRING. */
function createActiveFeePlan(overrides: Partial<{ id: string; active: boolean }> = {}): FeePlan {
  return FeePlan.reconstitute({
    id: overrides.id ?? FEE_PLAN_ID,
    code: 'CUOTA-ANUAL',
    name: 'Cuota Anual',
    description: null,
    type: 'RECURRING',
    frequency: 'ANNUAL',
    amount: 12000,
    billingMonths: [1],
    active: overrides.active ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/** Crea una asignación MemberTypeFeePlan activa. */
function createMemberTypeFeePlanLink(): MemberTypeFeePlan {
  return MemberTypeFeePlan.reconstitute({
    memberTypeId: MEMBER_TYPE_ID,
    feePlanId: FEE_PLAN_ID,
    isDefault: true,
    order: 1,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('CreateSubscriptionHandler', () => {
  let handler: CreateSubscriptionHandler;
  let memberAccountRepository: MemberAccountRepository;
  let feePlanRepository: FeePlanRepository;
  let memberTypeFeePlanRepository: MemberTypeFeePlanRepository;
  let memberQueryPort: MemberQueryPort;
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

    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(createActiveFeePlan()),
      findByCode: vi.fn(),
      findAll: vi.fn(),
      existsByCode: vi.fn(),
      hasActiveSubscriptions: vi.fn(),
    };

    memberTypeFeePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      findByFeePlanId: vi.fn(),
      findByMemberTypeId: vi.fn().mockResolvedValue([createMemberTypeFeePlanLink()]),
      findDefault: vi.fn(),
      deleteByFeePlanId: vi.fn(),
    };

    memberQueryPort = {
      setTenantId: vi.fn(),
      findById: vi.fn().mockResolvedValue({
        id: MEMBER_ID,
        memberNumber: 'SOC-001',
        name: 'Juan',
        surnames: 'García',
        memberTypeId: MEMBER_TYPE_ID,
        currentStatus: 'ACTIVE',
        active: true,
      }),
      findActiveMembers: vi.fn(),
      searchMembers: vi.fn().mockResolvedValue([]),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new CreateSubscriptionHandler(
      memberAccountRepository,
      feePlanRepository,
      memberTypeFeePlanRepository,
      memberQueryPort,
      outboxPublisher,
    );
  });

  it('debería crear suscripción con descuento multiplicativo correcto (happy path)', async () => {
    const command = validCommand();

    const result = await handler.execute(command);

    // Verificar DTO de respuesta
    expect(result).toBeDefined();
    expect(result.feePlanId).toBe(FEE_PLAN_ID);
    expect(result.typeDiscount).toBe(0.1);
    expect(result.personalDiscount).toBe(0.05);
    expect(result.isActive).toBe(true);
    expect(result.leaveDate).toBeNull();
    expect(result.cancelReason).toBeNull();

    // Verificar importe efectivo con descuento multiplicativo:
    // 12000 * (1 - 0.1) * (1 - 0.05) = 12000 * 0.9 * 0.95 = 10260
    expect(result.effectiveAmount).toBe(10260);

    // Verificar que se configuró tenantId en todos los repositorios/puertos
    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberTypeFeePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);

    // Verificar persistencia y publicación de eventos
    expect(memberAccountRepository.save).toHaveBeenCalledTimes(1);
    expect(outboxPublisher.publish).toHaveBeenCalledWith(TENANT_ID, expect.any(Array));
  });

  it('debería lanzar FeePlanNotFoundError cuando el plan no existe', async () => {
    (feePlanRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(FeePlanNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar FeePlanNotFoundError cuando el plan está inactivo', async () => {
    (feePlanRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      createActiveFeePlan({ active: false }),
    );

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(FeePlanNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar PlanNotAvailableForMemberTypeError cuando el plan no está vinculado al tipo de socio', async () => {
    // Retornar lista vacía de vínculos (plan no vinculado)
    (memberTypeFeePlanRepository.findByMemberTypeId as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(PlanNotAvailableForMemberTypeError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar DiscountExceedsLimitError cuando el descuento combinado >= 99%', async () => {
    // typeDiscount=0.95, personalDiscount=0.95 → combinado = 1-(0.05*0.05) = 0.9975 ≥ 0.99
    const command = validCommand({
      typeDiscount: 0.95,
      personalDiscount: 0.95,
    });

    await expect(handler.execute(command)).rejects.toThrow(DiscountExceedsLimitError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar ActiveSubscriptionExistsError cuando ya existe suscripción periódica activa', async () => {
    // Crear cuenta con suscripción activa existente
    const { FeeSubscription } = await import('../../../domain/entities/fee-subscription');
    const { Discount } = await import('../../../domain/value-objects/discount');

    const discountResult = Discount.create(0, 0);
    if (!discountResult.ok) throw discountResult.error;

    const existingSubscription = FeeSubscription.create({
      feePlanId: FEE_PLAN_ID,
      registrationDate: new Date(),
      discount: discountResult.value,
      feePlanAmount: createActiveFeePlan().amount,
      personalDiscountReason: null,
    });

    const accountWithSub = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [existingSubscription],
      createdAt: new Date(),
    });

    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      accountWithSub,
    );

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(ActiveSubscriptionExistsError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });

  it('debería lanzar MemberAccountNotFoundError cuando la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const command = validCommand();

    await expect(handler.execute(command)).rejects.toThrow(MemberAccountNotFoundError);
    expect(memberAccountRepository.save).not.toHaveBeenCalled();
  });
});
