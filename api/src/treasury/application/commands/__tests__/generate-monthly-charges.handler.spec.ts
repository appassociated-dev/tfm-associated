import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { GenerateMonthlyChargesHandler } from '../generate-monthly-charges.handler';
import { GenerateMonthlyChargesCommand } from '../generate-monthly-charges.command';
import { MemberAccountRepository } from '../../../domain/repositories/member-account.repository';
import { FeePlanRepository } from '../../../domain/repositories/fee-plan.repository';
import { ChargeRepository } from '../../../domain/repositories/charge.repository';
import { FiscalYearQueryPort } from '../../../domain/ports/fiscal-year-query.port';
import { MemberQueryPort } from '../../../domain/ports/member-query.port';
import { TreasuryOutboxPublisher } from '../../ports/treasury-outbox.publisher';
import { ErrorReporter } from '../../../../shared/domain/ports/error-reporter.port';
import { MemberAccount } from '../../../domain/aggregates/member-account';
import { FeePlan } from '../../../domain/aggregates/fee-plan';
import { FeeSubscription } from '../../../domain/entities/fee-subscription';
import { Discount } from '../../../domain/value-objects/discount';
import { Money } from '../../../domain/value-objects/money';

const TENANT_ID = 'tenant-uuid-1234';
const MEMBER_ACCOUNT_ID_1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MEMBER_ACCOUNT_ID_2 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const MEMBER_ACCOUNT_ID_3 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const FEE_PLAN_MONTHLY_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01';
const FEE_PLAN_SEMI_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02';
const MEMBER_ID_1 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01';
const MEMBER_ID_2 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02';
const MEMBER_ID_3 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03';
const SUBSCRIPTION_ID_1 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01';
const SUBSCRIPTION_ID_2 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02';
const SUBSCRIPTION_ID_3 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03';
const FISCAL_YEAR_ID = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01';

/** Crea un plan mensual (todos los meses). */
function createMonthlyPlan(): FeePlan {
  return FeePlan.reconstitute({
    id: FEE_PLAN_MONTHLY_ID,
    code: 'CUOTA-MENSUAL',
    name: 'Cuota Mensual',
    description: null,
    type: 'RECURRING',
    frequency: 'MONTHLY',
    amount: 5000, // 50€
    billingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/** Crea un plan semestral (meses 1 y 7). */
function createSemiAnnualPlan(): FeePlan {
  return FeePlan.reconstitute({
    id: FEE_PLAN_SEMI_ID,
    code: 'CUOTA-SEMESTRAL',
    name: 'Cuota Semestral',
    description: null,
    type: 'RECURRING',
    frequency: 'BIANNUAL',
    amount: 30000, // 300€
    billingMonths: [1, 7],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

/** Crea una suscripción reconstituida. */
function createSubscription(
  id: string,
  feePlanId: string,
  effectiveAmount: number,
): FeeSubscription {
  return FeeSubscription.reconstitute({
    id,
    feePlanId,
    registrationDate: new Date('2025-01-01'),
    leaveDate: null,
    typeDiscount: 0,
    personalDiscount: 0,
    personalDiscountReason: null,
    effectiveAmount,
    cancelReason: null,
    createdAt: new Date(),
  });
}

/** Crea una cuenta de socio con suscripción activa. */
function createAccountWith(
  accountId: string,
  memberId: string,
  subscriptionId: string,
  feePlanId: string,
  effectiveAmount: number,
): MemberAccount {
  return MemberAccount.reconstitute({
    id: accountId,
    memberId,
    tenantId: TENANT_ID,
    subscriptions: [createSubscription(subscriptionId, feePlanId, effectiveAmount)],
    createdAt: new Date(),
  });
}

/** Genera un UUID determinista basado en un índice. */
function generateId(prefix: string, index: number): string {
  // Formato UUID v4 válido: 8-4-4-4-12 hex chars
  const hex = index.toString(16).padStart(4, '0');
  const prefixMap: Record<string, string> = {
    member: 'c0eebc99',
    account: 'a0eebc99',
    sub: 'd0eebc99',
  };
  const p = prefixMap[prefix] ?? '00000000';
  return `${p}-${hex}-4ef8-bb6d-6bb9bd380000`;
}

/** Crea N cuentas con plan mensual para tests de batching. */
function createManyAccounts(count: number): {
  accounts: MemberAccount[];
  activeMembers: Array<{
    id: string;
    memberNumber: string;
    name: string;
    surnames: string;
    memberTypeId: string;
    currentStatus: string;
    active: boolean;
  }>;
} {
  const accounts: MemberAccount[] = [];
  const activeMembers: Array<{
    id: string;
    memberNumber: string;
    name: string;
    surnames: string;
    memberTypeId: string;
    currentStatus: string;
    active: boolean;
  }> = [];

  for (let i = 0; i < count; i++) {
    const memberId = generateId('member', i);
    const accountId = generateId('account', i);
    const subscriptionId = generateId('sub', i);

    accounts.push(
      createAccountWith(accountId, memberId, subscriptionId, FEE_PLAN_MONTHLY_ID, 5000),
    );

    activeMembers.push({
      id: memberId,
      memberNumber: `SOC-${i.toString().padStart(3, '0')}`,
      name: `Socio${i}`,
      surnames: `Apellido${i}`,
      memberTypeId: 'mt1',
      currentStatus: 'ACTIVE',
      active: true,
    });
  }

  return { accounts, activeMembers };
}

/** Crea un comando válido. */
function validCommand(
  overrides: Partial<{ tenantId: string; month: number; year: number }> = {},
): GenerateMonthlyChargesCommand {
  return new GenerateMonthlyChargesCommand(
    overrides.tenantId ?? TENANT_ID,
    overrides.month ?? 4,
    overrides.year ?? 2025,
  );
}

describe('GenerateMonthlyChargesHandler', () => {
  // Silenciar logs de NestJS durante tests
  beforeEach(() => Logger.overrideLogger([]));
  afterAll(() => Logger.overrideLogger(undefined as any));
  let handler: GenerateMonthlyChargesHandler;
  let memberAccountRepository: MemberAccountRepository;
  let feePlanRepository: FeePlanRepository;
  let chargeRepository: ChargeRepository;
  let fiscalYearQueryPort: FiscalYearQueryPort;
  let memberQueryPort: MemberQueryPort;
  let outboxPublisher: TreasuryOutboxPublisher;
  let errorReporter: ErrorReporter;

  beforeEach(() => {
    memberAccountRepository = {
      setTenantId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByMemberId: vi.fn().mockResolvedValue(null),
      existsByMemberId: vi.fn().mockResolvedValue(false),
      findAllWithActiveSubscriptions: vi.fn().mockResolvedValue([]),
    };

    feePlanRepository = {
      setTenantId: vi.fn(),
      save: vi.fn(),
      findById: vi.fn(),
      findByCode: vi.fn(),
      findAll: vi.fn().mockResolvedValue([createMonthlyPlan(), createSemiAnnualPlan()]),
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

    memberQueryPort = {
      setTenantId: vi.fn(),
      findById: vi.fn(),
      findActiveMembers: vi.fn().mockResolvedValue([
        {
          id: MEMBER_ID_1,
          memberNumber: 'SOC-001',
          name: 'Ana',
          surnames: 'García',
          memberTypeId: 'mt1',
          currentStatus: 'ACTIVE',
          active: true,
        },
        {
          id: MEMBER_ID_2,
          memberNumber: 'SOC-002',
          name: 'Pedro',
          surnames: 'López',
          memberTypeId: 'mt1',
          currentStatus: 'ACTIVE',
          active: true,
        },
        {
          id: MEMBER_ID_3,
          memberNumber: 'SOC-003',
          name: 'María',
          surnames: 'Ruiz',
          memberTypeId: 'mt1',
          currentStatus: 'ACTIVE',
          active: true,
        },
      ]),
    };

    outboxPublisher = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    errorReporter = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
    };

    handler = new GenerateMonthlyChargesHandler(
      memberAccountRepository,
      feePlanRepository,
      chargeRepository,
      fiscalYearQueryPort,
      memberQueryPort,
      outboxPublisher,
      errorReporter,
    );
  });

  it('debe generar cargos correctamente: 3 suscripciones, 2 generan cargo, 1 skip por mes no aplica', async () => {
    // Cuenta 1 y 2 con plan mensual (mes 4 aplica) → generan cargo
    // Cuenta 3 con plan semestral (mes 4 NO aplica) → skip
    const accounts = [
      createAccountWith(
        MEMBER_ACCOUNT_ID_1,
        MEMBER_ID_1,
        SUBSCRIPTION_ID_1,
        FEE_PLAN_MONTHLY_ID,
        5000,
      ),
      createAccountWith(
        MEMBER_ACCOUNT_ID_2,
        MEMBER_ID_2,
        SUBSCRIPTION_ID_2,
        FEE_PLAN_MONTHLY_ID,
        5000,
      ),
      createAccountWith(
        MEMBER_ACCOUNT_ID_3,
        MEMBER_ID_3,
        SUBSCRIPTION_ID_3,
        FEE_PLAN_SEMI_ID,
        30000,
      ),
    ];

    (
      memberAccountRepository.findAllWithActiveSubscriptions as ReturnType<typeof vi.fn>
    ).mockResolvedValue(accounts);

    const result = await handler.execute(validCommand());

    // 3 suscripciones evaluadas, 2 cargos generados
    expect(result.subscriptionsEvaluated).toBe(3);
    expect(result.chargesGenerated).toBe(2);
    expect(result.totalAmount).toBe(10000); // 2 * 5000 centavos
    expect(result.totalAmountFormatted).toBe('100.00 EUR');
    expect(result.duplicatesSkipped).toBe(0);
    expect(result.errorsCount).toBe(0);

    // Verificar que se llamó saveMany con 2 cargos
    expect(chargeRepository.saveMany).toHaveBeenCalledTimes(1);
    const savedCharges = (chargeRepository.saveMany as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(savedCharges).toHaveLength(2);

    // Verificar que se publicaron eventos (lote + evento completado)
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(2);
  });

  it('debe omitir cargos ya existentes sin error (prevención de duplicados)', async () => {
    const accounts = [
      createAccountWith(
        MEMBER_ACCOUNT_ID_1,
        MEMBER_ID_1,
        SUBSCRIPTION_ID_1,
        FEE_PLAN_MONTHLY_ID,
        5000,
      ),
      createAccountWith(
        MEMBER_ACCOUNT_ID_2,
        MEMBER_ID_2,
        SUBSCRIPTION_ID_2,
        FEE_PLAN_MONTHLY_ID,
        5000,
      ),
    ];

    (
      memberAccountRepository.findAllWithActiveSubscriptions as ReturnType<typeof vi.fn>
    ).mockResolvedValue(accounts);

    // Simular que ya existe un cargo para la suscripción 1
    (chargeRepository.findExistingKeys as ReturnType<typeof vi.fn>).mockResolvedValue([
      { subscriptionId: SUBSCRIPTION_ID_1, billingMonth: 4, billingYear: 2025 },
    ]);

    const result = await handler.execute(validCommand());

    expect(result.subscriptionsEvaluated).toBe(2);
    expect(result.chargesGenerated).toBe(1); // Solo la suscripción 2
    expect(result.duplicatesSkipped).toBe(1);
    expect(result.errorsCount).toBe(0);
  });

  it('debe omitir generación si no hay ejercicio fiscal abierto', async () => {
    (fiscalYearQueryPort.findActive as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await handler.execute(validCommand());

    expect(result.subscriptionsEvaluated).toBe(0);
    expect(result.chargesGenerated).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);

    // No se deben llamar los repositorios de cuentas/cargos
    expect(memberAccountRepository.findAllWithActiveSubscriptions).not.toHaveBeenCalled();
    expect(chargeRepository.saveMany).not.toHaveBeenCalled();
  });

  it('debe omitir socios suspendidos sin generar cargo (FA-5)', async () => {
    const accounts = [
      createAccountWith(
        MEMBER_ACCOUNT_ID_1,
        MEMBER_ID_1,
        SUBSCRIPTION_ID_1,
        FEE_PLAN_MONTHLY_ID,
        5000,
      ),
      createAccountWith(
        MEMBER_ACCOUNT_ID_2,
        MEMBER_ID_2,
        SUBSCRIPTION_ID_2,
        FEE_PLAN_MONTHLY_ID,
        5000,
      ),
    ];

    (
      memberAccountRepository.findAllWithActiveSubscriptions as ReturnType<typeof vi.fn>
    ).mockResolvedValue(accounts);

    // Solo el socio 1 está activo; el socio 2 está suspendido (no aparece en activos)
    (memberQueryPort.findActiveMembers as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: MEMBER_ID_1,
        memberNumber: 'SOC-001',
        name: 'Ana',
        surnames: 'García',
        memberTypeId: 'mt1',
        currentStatus: 'ACTIVE',
        active: true,
      },
    ]);

    const result = await handler.execute(validCommand());

    expect(result.subscriptionsEvaluated).toBe(1); // Solo se evalúa la del socio activo
    expect(result.chargesGenerated).toBe(1);
  });

  it('debe establecer tenantId en todos los repositorios y puertos', async () => {
    await handler.execute(validCommand());

    expect(memberAccountRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(feePlanRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(chargeRepository.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(fiscalYearQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
    expect(memberQueryPort.setTenantId).toHaveBeenCalledWith(TENANT_ID);
  });

  it('debe retornar resultado con duración en milisegundos', async () => {
    const result = await handler.execute(validCommand());

    expect(result.durationMs).toBeDefined();
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  // ── Tests para CRITICAL-1: Batch processing ──

  it('debe procesar suscripciones en lotes de 100', async () => {
    // Crear 250 cuentas → 3 lotes: 100 + 100 + 50
    const { accounts, activeMembers } = createManyAccounts(250);

    (
      memberAccountRepository.findAllWithActiveSubscriptions as ReturnType<typeof vi.fn>
    ).mockResolvedValue(accounts);
    (memberQueryPort.findActiveMembers as ReturnType<typeof vi.fn>).mockResolvedValue(
      activeMembers,
    );

    const result = await handler.execute(validCommand());

    expect(result.subscriptionsEvaluated).toBe(250);
    expect(result.chargesGenerated).toBe(250);

    // saveMany se llama una vez por lote (3 lotes)
    expect(chargeRepository.saveMany).toHaveBeenCalledTimes(3);

    // Verificar tamaño de cada lote guardado
    const saveCalls = (chargeRepository.saveMany as ReturnType<typeof vi.fn>).mock.calls;
    expect(saveCalls[0][0]).toHaveLength(100);
    expect(saveCalls[1][0]).toHaveLength(100);
    expect(saveCalls[2][0]).toHaveLength(50);

    // outboxPublisher: 3 lotes + 1 evento completado = 4 llamadas
    expect(outboxPublisher.publish).toHaveBeenCalledTimes(4);
  });

  // ── Tests para CRITICAL-1 + CRITICAL-2: Batch error resilience ──

  it('debe continuar procesando después de un error de lote', async () => {
    // Crear 250 cuentas → 3 lotes
    const { accounts, activeMembers } = createManyAccounts(250);

    (
      memberAccountRepository.findAllWithActiveSubscriptions as ReturnType<typeof vi.fn>
    ).mockResolvedValue(accounts);
    (memberQueryPort.findActiveMembers as ReturnType<typeof vi.fn>).mockResolvedValue(
      activeMembers,
    );

    // El segundo lote falla al persistir
    (chargeRepository.saveMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(undefined) // Lote 1: OK
      .mockRejectedValueOnce(new Error('Database connection lost')) // Lote 2: FALLO
      .mockResolvedValueOnce(undefined); // Lote 3: OK

    const result = await handler.execute(validCommand());

    // 250 evaluadas, 150 generadas (lotes 1 y 3), 100 errores (lote 2)
    expect(result.subscriptionsEvaluated).toBe(250);
    expect(result.chargesGenerated).toBe(150);
    expect(result.errorsCount).toBe(100);

    // saveMany se llamó 3 veces (una por lote)
    expect(chargeRepository.saveMany).toHaveBeenCalledTimes(3);

    // ErrorReporter debe haberse llamado para el lote fallido
    expect(errorReporter.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Database connection lost' }),
      expect.objectContaining({ tenantId: TENANT_ID, batchIndex: 1 }),
    );
  });

  // ── Test para CRITICAL-3: Umbral de errores >5% ──

  it('debe reportar error cuando la tasa supera el umbral del 5%', async () => {
    // Crear 100 cuentas → 1 lote que falla completamente = 100% error
    const { accounts, activeMembers } = createManyAccounts(100);

    (
      memberAccountRepository.findAllWithActiveSubscriptions as ReturnType<typeof vi.fn>
    ).mockResolvedValue(accounts);
    (memberQueryPort.findActiveMembers as ReturnType<typeof vi.fn>).mockResolvedValue(
      activeMembers,
    );

    // El lote falla
    (chargeRepository.saveMany as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Batch insert failed'),
    );

    const result = await handler.execute(validCommand());

    expect(result.errorsCount).toBe(100);
    expect(result.chargesGenerated).toBe(0);

    // ErrorReporter se llama 2 veces: una para el lote fallido, otra para la alerta de umbral
    expect(errorReporter.captureException).toHaveBeenCalledTimes(2);

    // Verificar la llamada de alerta de umbral
    expect(errorReporter.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('ALERTA CRÍTICA'),
      }),
      expect.objectContaining({
        tenantId: TENANT_ID,
        errorRate: 1, // 100%
        threshold: 0.05,
      }),
    );
  });

  it('no debe alertar cuando la tasa de errores está bajo el umbral del 5%', async () => {
    // Crear 3 cuentas, todas procesan correctamente = 0% error
    const accounts = [
      createAccountWith(
        MEMBER_ACCOUNT_ID_1,
        MEMBER_ID_1,
        SUBSCRIPTION_ID_1,
        FEE_PLAN_MONTHLY_ID,
        5000,
      ),
      createAccountWith(
        MEMBER_ACCOUNT_ID_2,
        MEMBER_ID_2,
        SUBSCRIPTION_ID_2,
        FEE_PLAN_MONTHLY_ID,
        5000,
      ),
    ];

    (
      memberAccountRepository.findAllWithActiveSubscriptions as ReturnType<typeof vi.fn>
    ).mockResolvedValue(accounts);

    const result = await handler.execute(validCommand());

    expect(result.errorsCount).toBe(0);
    // ErrorReporter no debe haberse llamado
    expect(errorReporter.captureException).not.toHaveBeenCalled();
  });
});
