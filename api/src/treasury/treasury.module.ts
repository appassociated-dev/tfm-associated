import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FeePlansController } from './infrastructure/controllers/fee-plans.controller';
import { SubscriptionsController } from './infrastructure/controllers/subscriptions.controller';
import {
  ChargesController,
  MemberAccountChargesController,
} from './infrastructure/controllers/charges.controller';
import { CreateFeePlanHandler } from './application/commands/create-fee-plan.handler';
import { UpdateFeePlanHandler } from './application/commands/update-fee-plan.handler';
import { DeactivateFeePlanHandler } from './application/commands/deactivate-fee-plan.handler';
import { ImportFeePlanTemplateHandler } from './application/commands/import-fee-plan-template.handler';
import { LinkMemberTypesHandler } from './application/commands/link-member-types.handler';
import { CreateSubscriptionHandler } from './application/commands/create-subscription.handler';
import { ChangeSubscriptionPlanHandler } from './application/commands/change-subscription-plan.handler';
import { CloseSubscriptionHandler } from './application/commands/close-subscription.handler';
import { UpdateSubscriptionDiscountHandler } from './application/commands/update-subscription-discount.handler';
import { GenerateMonthlyChargesHandler } from './application/commands/generate-monthly-charges.handler';
import { GenerateSubscriptionChargesHandler } from './application/commands/generate-subscription-charges.handler';
import { GetFeePlanHandler } from './application/queries/get-fee-plan.handler';
import { ListFeePlansHandler } from './application/queries/list-fee-plans.handler';
import { GetFeePlanTemplatesHandler } from './application/queries/get-fee-plan-templates.handler';
import { GetSubscriptionsHandler } from './application/queries/get-subscriptions.handler';
import { GetActiveSubscriptionHandler } from './application/queries/get-active-subscription.handler';
import { GetChargesByAccountHandler } from './application/queries/get-charges-by-account.handler';
import { GetGenerationLogHandler } from './application/queries/get-generation-log.handler';
import { FEE_PLAN_REPOSITORY } from './domain/repositories/fee-plan.repository';
import { PrismaFeePlanRepository } from './infrastructure/persistence/prisma-fee-plan.repository';
import { MEMBER_TYPE_FEE_PLAN_REPOSITORY } from './domain/repositories/member-type-fee-plan.repository';
import { PrismaMemberTypeFeePlanRepository } from './infrastructure/persistence/prisma-member-type-fee-plan.repository';
import { MEMBER_ACCOUNT_REPOSITORY } from './domain/repositories/member-account.repository';
import { PrismaMemberAccountRepository } from './infrastructure/persistence/prisma-member-account.repository';
import { CHARGE_REPOSITORY } from './domain/repositories/charge.repository';
import { PrismaChargeRepository } from './infrastructure/persistence/prisma-charge.repository';
import { MEMBER_TYPE_QUERY_PORT } from './domain/ports/member-type-query.port';
import { PrismaMemberTypeQueryAdapter } from './infrastructure/ports/prisma-member-type-query.adapter';
import { MEMBER_QUERY_PORT } from './domain/ports/member-query.port';
import { PrismaMemberQueryAdapter } from './infrastructure/ports/prisma-member-query.adapter';
import { FISCAL_YEAR_QUERY_PORT } from './domain/ports/fiscal-year-query.port';
import { PrismaFiscalYearQueryAdapter } from './infrastructure/ports/prisma-fiscal-year-query.adapter';
import { TREASURY_OUTBOX_PUBLISHER } from './application/ports/treasury-outbox.publisher';
import { PrismaTreasuryOutboxPublisher } from './infrastructure/services/prisma-treasury-outbox.publisher';
import { ChargeGenerationCron } from './infrastructure/cron/charge-generation.cron';
import { PrismaMainService } from '../shared/infrastructure/persistence/prisma-main.service';
import { PrismaTenantService } from '../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * BC-Treasury: Cuentas, planes de cuotas, remesas SEPA y transacciones.
 * Módulo autocontenido según ADR-003.
 *
 * Registra:
 * - CqrsModule para Command/Query handling (ADR-004)
 * - FeePlansController para endpoints REST de planes de cuota (UC-017)
 * - SubscriptionsController para endpoints REST de suscripciones (UC-018)
 * - ChargesController y MemberAccountChargesController para endpoints REST de cargos (UC-019)
 * - Handlers CQRS: crear, actualizar, desactivar, importar plantillas, vincular tipos de socio, consultas
 * - Handlers CQRS: crear suscripción, cambiar plan, cerrar, actualizar descuento, consultas de suscripciones
 * - Handlers CQRS: generación masiva de cargos, generación por suscripción, consulta de cargos por cuenta
 * - Repositorios FeePlan, MemberTypeFeePlan, MemberAccount y Charge vía inyección por token
 * - Puertos anti-corrupción MemberTypeQueryPort, MemberQueryPort y FiscalYearQueryPort para consultas cross-BC (ADR-008)
 * - TreasuryOutboxPublisher para eventos de dominio al outbox (ADR-008)
 * - ChargeGenerationCron para generación automática mensual de cargos (US-047)
 * - PrismaTenantService para acceso a la BD del tenant (ADR-002)
 */
@Module({
  imports: [CqrsModule],
  controllers: [
    FeePlansController,
    SubscriptionsController,
    ChargesController,
    MemberAccountChargesController,
  ],
  providers: [
    // Handlers CQRS — Comandos (FeePlan)
    CreateFeePlanHandler,
    UpdateFeePlanHandler,
    DeactivateFeePlanHandler,
    ImportFeePlanTemplateHandler,
    LinkMemberTypesHandler,

    // Handlers CQRS — Comandos (Subscriptions / UC-018)
    CreateSubscriptionHandler,
    ChangeSubscriptionPlanHandler,
    CloseSubscriptionHandler,
    UpdateSubscriptionDiscountHandler,

    // Handlers CQRS — Comandos (Charges / UC-019)
    GenerateMonthlyChargesHandler,
    GenerateSubscriptionChargesHandler,

    // Handlers CQRS — Queries (FeePlan)
    GetFeePlanHandler,
    ListFeePlansHandler,
    GetFeePlanTemplatesHandler,

    // Handlers CQRS — Queries (Subscriptions / UC-018)
    GetSubscriptionsHandler,
    GetActiveSubscriptionHandler,

    // Handlers CQRS — Queries (Charges / UC-019)
    GetChargesByAccountHandler,
    GetGenerationLogHandler,

    // Repositorios (inyección por token)
    {
      provide: FEE_PLAN_REPOSITORY,
      useClass: PrismaFeePlanRepository,
    },
    {
      provide: MEMBER_TYPE_FEE_PLAN_REPOSITORY,
      useClass: PrismaMemberTypeFeePlanRepository,
    },
    {
      provide: MEMBER_ACCOUNT_REPOSITORY,
      useClass: PrismaMemberAccountRepository,
    },
    {
      provide: CHARGE_REPOSITORY,
      useClass: PrismaChargeRepository,
    },

    // Puertos anti-corrupción cross-BC (ADR-008)
    {
      provide: MEMBER_TYPE_QUERY_PORT,
      useClass: PrismaMemberTypeQueryAdapter,
    },
    {
      provide: MEMBER_QUERY_PORT,
      useClass: PrismaMemberQueryAdapter,
    },
    {
      provide: FISCAL_YEAR_QUERY_PORT,
      useClass: PrismaFiscalYearQueryAdapter,
    },

    // Publisher de outbox (ADR-008)
    {
      provide: TREASURY_OUTBOX_PUBLISHER,
      useClass: PrismaTreasuryOutboxPublisher,
    },

    // Cron job para generación automática mensual de cargos (US-047)
    ChargeGenerationCron,

    // Servicios de infraestructura compartidos
    PrismaMainService,
    PrismaTenantService,
  ],
  exports: [],
})
export class TreasuryModule {}
