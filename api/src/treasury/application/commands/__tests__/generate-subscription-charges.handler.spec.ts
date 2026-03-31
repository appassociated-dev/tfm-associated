import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { GenerateSubscriptionChargesHandler } from '../generate-subscription-charges.handler';
import { GenerateSubscriptionChargesCommand } from '../generate-subscription-charges.command';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { ChargeRepository } from '../../../domain/repositories/charge.repository';
import { FiscalYearQueryPort } from '../../../domain/ports/fiscal-year-query.port';
import { IntegrationEventPublisher } from '../../../../shared/application/ports/integration-event.publisher';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { FeeSubscription } from '../../../domain/entities/fee-subscription';
import { MemberAccountNotFoundError, SubscriptionNotFoundError } from '../../../domain/exceptions';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01';
const SUBSCRIPTION_ID = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01';
const FEE_PLAN_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01';
const FISCAL_YEAR_ID = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01';

/** Crea un plan mensual. */
function createMonthlyPlan(): FeePlan {
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

/** Crea una suscripción con alta en julio. */
function createJulySubscription(): FeeSubscription {
  return FeeSubscription.reconstitute({
    id: SUBSCRIPTION_ID,
    feePlanId: FEE_PLAN_ID,
    registrationDate: new Date('2025-07-15'),
    leaveDate: null,
    typeDiscount: 0,
    personalDiscount: 0,
    personalDiscountReason: null,
    effectiveAmount: 5000,
    cancelReason: null,
    createdAt: new Date(),
  });
}

/** Crea una cuenta con la suscripción de julio. */
function createAccountWithJulySubscription(): MemberAccount {
  return MemberAccount.reconstitute({
    id: MEMBER_ACCOUNT_ID,
    memberId: MEMBER_ID,
    tenantId: TENANT_ID,
    subscriptions: [createJulySubscription()],
    createdAt: new Date(),
  });
}

/** Crea un comando válido. */
function validCommand(
  overrides: Partial<{ tenantId: string; memberAccountId: string; subscriptionId: string }> = {},
): GenerateSubscriptionChargesCommand {
  return new GenerateSubscriptionChargesCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.memberAccountId ?? MEMBER_ACCOUNT_ID,
    overrides.subscriptionId ?? SUBSCRIPTION_ID,
  );
}

describe('GenerateSubscriptionChargesHandler', () => {
  // Silenciar logs de NestJS durante tests
  beforeEach(() => Logger.overrideLogger([]));
  afterAll(() => Logger.overrideLogger(false));
  let handler: GenerateSubscriptionChargesHandler;
  let memberAccountRepository: MemberAccountRepository;
  let feePlanRepository: FeePlanRepository;
  let chargeRepository: ChargeRepository;
  let fiscalYearQueryPort: FiscalYearQueryPort;
  let outboxPublisher: IntegrationEventPublisher;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(createAccountWithJulySubscription()),
      findByMemberId: vi.fn().mockResolvedValue(null),
      existsByMemberId: vi.fn().mockResolvedValue(false),
      findAllWithActiveSubscriptions: vi.fn().mockResolvedValue([]),
    };

    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(createMonthlyPlan()),
      findByCode: vi.fn(),
      findAll: vi.fn(),
      findAllWithCount: vi.fn(),
      existsByCode: vi.fn(),
      hasActiveSubscriptions: vi.fn(),
    };

    chargeRepository = {
      setTenantId: vi.fn(),
      saveMany: vi.fn().mockResolvedValue(undefined),
      findBySubscriptionAndPeriod: vi.fn().mockResolvedValue(null),
      findExistingKeys: vi.fn().mockResolvedValue([]),
      findByMemberAccountId: vi.fn().mockResolvedValue([]),
      findPendingByMemberAccountId: vi.fn().mockResolvedValue([]),
    };

    fiscalYearQueryPort = {
      setTenantId: vi.fn(),
      findActive: vi.fn().mockResolvedValue({
        id: FISCAL_YEAR_ID,
        name: 'Ejercicio 2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        status: 'OPEN',
      }),
      findById: vi.fn(),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    handler = new GenerateSubscriptionChargesHandler(
      memberAccountRepository,
      feePlanRepository,
      chargeRepository,
      fiscalYearQueryPort,
      outboxPublisher,
    );
  });

  it('debe generar cargos prorrateados para alta en julio con plan mensual (6 cargos, jul-dic)', async () => {
    const result = await handler.execute(validCommand());

    // Alta en julio con plan mensual → 6 cargos (meses 7-12)
    expect(result).toHaveLength(6);

    // Verificar que se guardaron 6 cargos
    expect(chargeRepository.saveMany).toHaveBeenCalledTimes(1);
    const savedCharges = (chargeRepository.saveMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedCharges).toHaveLength(6);

    // Verificar que los cargos son para los meses correctos (7 a 12)
    const months = result.map((dto) => dto.billingMonth);
    expect(months).toEqual([7, 8, 9, 10, 11, 12]);

    // Verificar que están marcados como prorrateados
    for (const dto of result) {
      expect(dto.isProrated).toBe(true);
      expect(dto.isManual).toBe(false);
      expect(dto.finalAmount).toBe(5000);
      expect(dto.feePlanName).toBe('Cuota Mensual');
    }

    // Verificar publicación de eventos
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(1);
  });

  it('no debe duplicar cargos ya existentes', async () => {
    // Simular que ya existen cargos para meses 7, 8, 9
    (chargeRepository.findBySubscriptionAndPeriod as ReturnType<typeof vi.fn>).mockImplementation(
      (_subId: unknown, month: number, _year: number) => {
        if (month <= 9) {
          // Devolver un cargo existente mock (solo necesita no ser null)
          return Promise.resolve({ id: { toValue: () => 'existing' } });
        }
        return Promise.resolve(null);
      },
    );

    const result = await handler.execute(validCommand());

    // Solo debe generar cargos para meses 10, 11, 12 (los 3 restantes)
    expect(result).toHaveLength(3);
    const months = result.map((dto) => dto.billingMonth);
    expect(months).toEqual([10, 11, 12]);
  });

  it('debe lanzar MemberAccountNotFoundError si la cuenta no existe', async () => {
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(handler.execute(validCommand())).rejects.toThrow(MemberAccountNotFoundError);
  });

  it('debe lanzar SubscriptionNotFoundError si la suscripción no existe', async () => {
    // Cuenta sin la suscripción buscada
    const accountWithoutSub = MemberAccount.reconstitute({
      id: MEMBER_ACCOUNT_ID,
      memberId: MEMBER_ID,
      tenantId: TENANT_ID,
      subscriptions: [],
      createdAt: new Date(),
    });
    (memberAccountRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      accountWithoutSub,
    );

    await expect(handler.execute(validCommand())).rejects.toThrow(SubscriptionNotFoundError);
  });

  it('debe retornar lista vacía si no hay ejercicio fiscal abierto', async () => {
    (fiscalYearQueryPort.findActive as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await handler.execute(validCommand());

    expect(result).toEqual([]);
    expect(chargeRepository.saveMany).not.toHaveBeenCalled();
  });

  it('debe establecer tenantId en todos los repositorios y puertos', async () => {
    await handler.execute(validCommand());

    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(chargeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(fiscalYearQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });
});
