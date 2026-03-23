import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GenerateMonthlyChargesCommand } from './generate-monthly-charges.command';
import { GenerationResultDto } from '../dtos/generation-result.dto';
import {
  MEMBER_ACCOUNT_REPOSITORY,
  MemberAccountRepository,
} from '../../domain/repositories/member-account.repository';
import {
  FEE_PLAN_REPOSITORY,
  FeePlanRepository,
} from '../../domain/repositories/fee-plan.repository';
import { CHARGE_REPOSITORY, ChargeRepository } from '../../domain/repositories/charge.repository';
import {
  FISCAL_YEAR_QUERY_PORT,
  FiscalYearQueryPort,
} from '../../domain/ports/fiscal-year-query.port';
import { MEMBER_QUERY_PORT, MemberQueryPort } from '../../domain/ports/member-query.port';
import {
  TREASURY_OUTBOX_PUBLISHER,
  TreasuryOutboxPublisher,
} from '../ports/treasury-outbox.publisher';
import { ChargeGenerator, ActiveSubscriptionData } from '../../domain/services/charge-generator';
import { Charge } from '../../domain/entities/charge';
import { ChargeDescription } from '../../domain/value-objects/charge-description';
import { ChargeGeneratedEvent } from '../../domain/events/charge-generated.event';
import { MonthlyGenerationCompletedEvent } from '../../domain/events/monthly-generation-completed.event';
import { ERROR_REPORTER, ErrorReporter } from '../../../shared/domain/ports/error-reporter.port';

/** Tamaño del lote para procesamiento por batches. */
const BATCH_SIZE = 100;

/** Umbral de error (5%) para alerta crítica. */
const ERROR_THRESHOLD = 0.05;

/**
 * Handler del comando de generación masiva de cargos mensuales.
 *
 * Flujo:
 * 1. Verifica ejercicio fiscal abierto.
 * 2. Obtiene suscripciones activas con planes.
 * 3. Filtra socios suspendidos o pendientes de pago (FA-5).
 * 4. Procesa suscripciones en lotes de 100.
 * 5. Genera cargos con prevención de duplicados.
 * 6. Persiste y publica eventos por lote.
 * 7. Evalúa umbral de errores >5% y alerta si se supera.
 */
@CommandHandler(GenerateMonthlyChargesCommand)
export class GenerateMonthlyChargesHandler implements ICommandHandler<GenerateMonthlyChargesCommand> {
  private readonly logger = new Logger(GenerateMonthlyChargesHandler.name);

  constructor(
    @Inject(MEMBER_ACCOUNT_REPOSITORY)
    private readonly memberAccountRepository: MemberAccountRepository,
    @Inject(FEE_PLAN_REPOSITORY)
    private readonly feePlanRepository: FeePlanRepository,
    @Inject(CHARGE_REPOSITORY)
    private readonly chargeRepository: ChargeRepository,
    @Inject(FISCAL_YEAR_QUERY_PORT)
    private readonly fiscalYearQueryPort: FiscalYearQueryPort,
    @Inject(MEMBER_QUERY_PORT)
    private readonly memberQueryPort: MemberQueryPort,
    @Inject(TREASURY_OUTBOX_PUBLISHER)
    private readonly outboxPublisher: TreasuryOutboxPublisher,
    @Inject(ERROR_REPORTER)
    private readonly errorReporter: ErrorReporter,
  ) {}

  async execute(command: GenerateMonthlyChargesCommand): Promise<GenerationResultDto> {
    const startTime = Date.now();
    const { tenantId, month, year } = command;

    // Validar que tenantId está presente (el cron itera tenants y siempre envía un ID concreto)
    if (!tenantId) {
      throw new Error('tenantId es obligatorio. El cron debe iterar los tenants activos.');
    }

    // 1. Establecer tenantId en todos los repositorios/puertos (ADR-002)
    this.memberAccountRepository.setTenantId(tenantId);
    this.feePlanRepository.setTenantId(tenantId);
    this.chargeRepository.setTenantId(tenantId);
    this.fiscalYearQueryPort.setTenantId(tenantId);
    this.memberQueryPort.setTenantId(tenantId);

    // 2. Verificar que existe ejercicio fiscal abierto
    const fiscalYear = await this.fiscalYearQueryPort.findActive();
    if (!fiscalYear) {
      this.logger.warn(
        `No hay ejercicio fiscal abierto para tenant ${tenantId}. Generación omitida.`,
      );
      return GenerationResultDto.create({
        tenantId,
        month,
        year,
        subscriptionsEvaluated: 0,
        chargesGenerated: 0,
        totalAmount: 0,
        duplicatesSkipped: 0,
        errorsCount: 0,
        errors: [],
        durationMs: Date.now() - startTime,
      });
    }

    // 3. Obtener todas las cuentas con suscripciones activas
    const accounts = await this.memberAccountRepository.findAllWithActiveSubscriptions();

    // 4. Obtener planes para mapear suscripciones a datos de generación
    const feePlans = await this.feePlanRepository.findAll();
    const planMap = new Map(feePlans.map((p) => [p.id.toValue(), p]));

    // 5. Filtrar socios suspendidos o pendientes de pago (FA-5)
    const activeMembers = await this.memberQueryPort.findActiveMembers();
    const activeMemberIds = new Set(activeMembers.map((m) => m.id));

    // 6. Construir ActiveSubscriptionData para el generador
    const subscriptionDataList: ActiveSubscriptionData[] = [];

    for (const account of accounts) {
      // Filtrar socios no activos (FA-5)
      if (!activeMemberIds.has(account.memberId)) {
        continue;
      }

      const activeSubscription = account.getActivePeriodicSubscription();
      if (!activeSubscription) continue;

      const plan = planMap.get(activeSubscription.feePlanId.toValue());
      if (!plan || !plan.active) continue;

      subscriptionDataList.push({
        subscriptionId: activeSubscription.id.toValue(),
        memberAccountId: account.id.toValue(),
        memberId: account.memberId,
        effectiveAmount: activeSubscription.effectiveAmount,
        registrationDate: activeSubscription.registrationDate,
        plan: {
          billingMonths: [...plan.billingMonths.months],
          amount: plan.amount,
          type: plan.type.value,
        },
      });
    }

    // 7. Obtener cargos existentes para prevenir duplicados
    const subscriptionIds = subscriptionDataList.map((s) => s.subscriptionId);
    const existingCharges =
      subscriptionIds.length > 0
        ? await this.chargeRepository.findExistingKeys(subscriptionIds, month, year)
        : [];

    // 8. Procesar suscripciones en lotes de 100 (batch processing)
    const batches = this.splitIntoBatches(subscriptionDataList, BATCH_SIZE);
    const allCharges: Charge[] = [];
    const allEvents: ChargeGeneratedEvent[] = [];
    let totalDuplicatesSkipped = 0;
    const allErrors: Array<{ subscriptionId: string; error: string }> = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      try {
        // 8a. Generar cargos con el Domain Service para este lote
        const generationResult = ChargeGenerator.generateForMonth(
          batch,
          month,
          year,
          existingCharges,
        );

        totalDuplicatesSkipped += generationResult.skippedDuplicate;
        allErrors.push(...generationResult.errors);

        // 8b. Crear entidades Charge y acumular eventos
        const batchCharges: Charge[] = [];
        const batchEvents: ChargeGeneratedEvent[] = [];

        for (const chargeInput of generationResult.charges) {
          const descriptionResult = ChargeDescription.create(
            chargeInput.description,
            fiscalYear.id,
          );
          if (!descriptionResult.ok) {
            allErrors.push({
              subscriptionId: chargeInput.subscriptionId,
              error: descriptionResult.error.message,
            });
            continue;
          }

          try {
            const charge = Charge.create({
              subscriptionId: chargeInput.subscriptionId,
              baseAmount: chargeInput.baseAmount,
              finalAmount: chargeInput.finalAmount,
              description: descriptionResult.value,
              billingMonth: chargeInput.billingMonth,
              billingYear: chargeInput.billingYear,
              issueDate: chargeInput.issueDate,
              dueDate: chargeInput.dueDate,
              isProrated: chargeInput.isProrated,
              isManual: false,
            });

            batchCharges.push(charge);

            batchEvents.push(
              new ChargeGeneratedEvent({
                chargeId: charge.id.toValue(),
                memberAccountId: chargeInput.memberAccountId,
                memberId: chargeInput.memberId,
                subscriptionId: chargeInput.subscriptionId,
                amount: chargeInput.finalAmount.amount,
                billingMonth: chargeInput.billingMonth,
                billingYear: chargeInput.billingYear,
                dueDate: chargeInput.dueDate,
              }),
            );
          } catch (error) {
            allErrors.push({
              subscriptionId: chargeInput.subscriptionId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // 8c. Persistir cargos del lote
        if (batchCharges.length > 0) {
          await this.chargeRepository.saveMany(batchCharges);
        }

        // 8d. Publicar eventos del lote al outbox
        if (batchEvents.length > 0) {
          await this.outboxPublisher.publish(tenantId, batchEvents);
        }

        allCharges.push(...batchCharges);
        allEvents.push(...batchEvents);
      } catch (error) {
        // 8e. Si un lote falla: loguear error, reportar, y continuar con el siguiente
        const batchSubscriptionIds = batch.map((s) => s.subscriptionId);
        const batchError = error instanceof Error ? error : new Error(String(error));

        this.logger.error(
          `Error procesando lote ${batchIndex + 1}/${batches.length} para tenant ${tenantId}: ${batchError.message}`,
          batchError.stack,
        );

        this.errorReporter.captureException(batchError, {
          tenantId,
          batchIndex,
          subscriptionIds: batchSubscriptionIds,
        });

        // Registrar error para cada suscripción del lote fallido
        for (const sub of batch) {
          allErrors.push({
            subscriptionId: sub.subscriptionId,
            error: `Fallo de lote ${batchIndex + 1}: ${batchError.message}`,
          });
        }
      }
    }

    // 9. Evaluar umbral de errores >5% (CRITICAL-3)
    const subscriptionsEvaluated = subscriptionDataList.length;
    if (subscriptionsEvaluated > 0) {
      const errorRate = allErrors.length / subscriptionsEvaluated;
      if (errorRate > ERROR_THRESHOLD) {
        const alertMessage =
          `ALERTA CRÍTICA: Tasa de error ${(errorRate * 100).toFixed(1)}% supera umbral del 5%. ` +
          `Errores: ${allErrors.length}/${subscriptionsEvaluated} suscripciones para tenant ${tenantId}, periodo ${month}/${year}.`;

        this.logger.error(alertMessage);

        this.errorReporter.captureException(new Error(alertMessage), {
          tenantId,
          month,
          year,
          subscriptionsEvaluated,
          errorsCount: allErrors.length,
          errorRate,
          threshold: ERROR_THRESHOLD,
        });
      }
    }

    // 10. Publicar evento de generación completada
    const totalAmount = allCharges.reduce((sum, c) => sum + c.finalAmount.amount, 0);

    const completionEvent = new MonthlyGenerationCompletedEvent({
      tenantId,
      month,
      year,
      totalSubscriptions: subscriptionsEvaluated,
      chargesGenerated: allCharges.length,
      totalAmount,
      duplicatesSkipped: totalDuplicatesSkipped,
      errorsCount: allErrors.length,
      durationMs: Date.now() - startTime,
    });

    await this.outboxPublisher.publish(tenantId, [completionEvent]);

    // 11. Retornar resultado
    return GenerationResultDto.create({
      tenantId,
      month,
      year,
      subscriptionsEvaluated,
      chargesGenerated: allCharges.length,
      totalAmount,
      duplicatesSkipped: totalDuplicatesSkipped,
      errorsCount: allErrors.length,
      errors: allErrors,
      durationMs: Date.now() - startTime,
    });
  }

  /**
   * Divide un array en lotes de tamaño fijo.
   * @param items Array a dividir.
   * @param batchSize Tamaño máximo de cada lote.
   * @returns Array de lotes.
   */
  private splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }
}
