import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FeePlansController } from './infrastructure/controllers/fee-plans.controller';
import { SubscriptionsController } from './infrastructure/controllers/subscriptions.controller';
import { CreateFeePlanHandler } from './application/commands/create-fee-plan.handler';
import { UpdateFeePlanHandler } from './application/commands/update-fee-plan.handler';
import { DeactivateFeePlanHandler } from './application/commands/deactivate-fee-plan.handler';
import { ImportFeePlanTemplateHandler } from './application/commands/import-fee-plan-template.handler';
import { LinkMemberTypesHandler } from './application/commands/link-member-types.handler';
import { CreateSubscriptionHandler } from './application/commands/create-subscription.handler';
import { ChangeSubscriptionPlanHandler } from './application/commands/change-subscription-plan.handler';
import { CloseSubscriptionHandler } from './application/commands/close-subscription.handler';
import { UpdateSubscriptionDiscountHandler } from './application/commands/update-subscription-discount.handler';
import { GetFeePlanHandler } from './application/queries/get-fee-plan.handler';
import { ListFeePlansHandler } from './application/queries/list-fee-plans.handler';
import { GetFeePlanTemplatesHandler } from './application/queries/get-fee-plan-templates.handler';
import { GetSubscriptionsHandler } from './application/queries/get-subscriptions.handler';
import { GetActiveSubscriptionHandler } from './application/queries/get-active-subscription.handler';
import { FEE_PLAN_REPOSITORY } from './domain/repositories/fee-plan.repository';
import { PrismaFeePlanRepository } from './infrastructure/persistence/prisma-fee-plan.repository';
import { MEMBER_TYPE_FEE_PLAN_REPOSITORY } from './domain/repositories/member-type-fee-plan.repository';
import { PrismaMemberTypeFeePlanRepository } from './infrastructure/persistence/prisma-member-type-fee-plan.repository';
import { MEMBER_ACCOUNT_REPOSITORY } from './domain/repositories/member-account.repository';
import { PrismaMemberAccountRepository } from './infrastructure/persistence/prisma-member-account.repository';
import { MEMBER_TYPE_QUERY_PORT } from './domain/ports/member-type-query.port';
import { PrismaMemberTypeQueryAdapter } from './infrastructure/ports/prisma-member-type-query.adapter';
import { MEMBER_QUERY_PORT } from './domain/ports/member-query.port';
import { PrismaMemberQueryAdapter } from './infrastructure/ports/prisma-member-query.adapter';
import { TREASURY_OUTBOX_PUBLISHER } from './application/ports/treasury-outbox.publisher';
import { PrismaTreasuryOutboxPublisher } from './infrastructure/services/prisma-treasury-outbox.publisher';
import { PrismaTenantService } from '../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * BC-Treasury: Cuentas, planes de cuotas, remesas SEPA y transacciones.
 * Módulo autocontenido según ADR-003.
 *
 * Registra:
 * - CqrsModule para Command/Query handling (ADR-004)
 * - FeePlansController para endpoints REST de planes de cuota (UC-017)
 * - SubscriptionsController para endpoints REST de suscripciones (UC-018)
 * - Handlers CQRS: crear, actualizar, desactivar, importar plantillas, vincular tipos de socio, consultas
 * - Handlers CQRS: crear suscripción, cambiar plan, cerrar, actualizar descuento, consultas de suscripciones
 * - Repositorios FeePlan, MemberTypeFeePlan y MemberAccount vía inyección por token
 * - Puertos anti-corrupción MemberTypeQueryPort y MemberQueryPort para consultas cross-BC (ADR-008)
 * - TreasuryOutboxPublisher para eventos de dominio al outbox (ADR-008)
 * - PrismaTenantService para acceso a la BD del tenant (ADR-002)
 */
@Module({
  imports: [CqrsModule],
  controllers: [FeePlansController, SubscriptionsController],
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

    // Handlers CQRS — Queries (FeePlan)
    GetFeePlanHandler,
    ListFeePlansHandler,
    GetFeePlanTemplatesHandler,

    // Handlers CQRS — Queries (Subscriptions / UC-018)
    GetSubscriptionsHandler,
    GetActiveSubscriptionHandler,

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

    // Puertos anti-corrupción cross-BC (ADR-008)
    {
      provide: MEMBER_TYPE_QUERY_PORT,
      useClass: PrismaMemberTypeQueryAdapter,
    },
    {
      provide: MEMBER_QUERY_PORT,
      useClass: PrismaMemberQueryAdapter,
    },

    // Publisher de outbox (ADR-008)
    {
      provide: TREASURY_OUTBOX_PUBLISHER,
      useClass: PrismaTreasuryOutboxPublisher,
    },

    // Servicios de infraestructura compartidos
    PrismaTenantService,
  ],
  exports: [],
})
export class TreasuryModule {}
