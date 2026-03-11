import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FeePlansController } from './infrastructure/controllers/fee-plans.controller';
import { CreateFeePlanHandler } from './application/commands/create-fee-plan.handler';
import { UpdateFeePlanHandler } from './application/commands/update-fee-plan.handler';
import { DeactivateFeePlanHandler } from './application/commands/deactivate-fee-plan.handler';
import { ImportFeePlanTemplateHandler } from './application/commands/import-fee-plan-template.handler';
import { LinkMemberTypesHandler } from './application/commands/link-member-types.handler';
import { GetFeePlanHandler } from './application/queries/get-fee-plan.handler';
import { ListFeePlansHandler } from './application/queries/list-fee-plans.handler';
import { GetFeePlanTemplatesHandler } from './application/queries/get-fee-plan-templates.handler';
import { FEE_PLAN_REPOSITORY } from './domain/repositories/fee-plan.repository';
import { PrismaFeePlanRepository } from './infrastructure/persistence/prisma-fee-plan.repository';
import { MEMBER_TYPE_FEE_PLAN_REPOSITORY } from './domain/repositories/member-type-fee-plan.repository';
import { PrismaMemberTypeFeePlanRepository } from './infrastructure/persistence/prisma-member-type-fee-plan.repository';
import { MEMBER_TYPE_QUERY_PORT } from './domain/ports/member-type-query.port';
import { PrismaMemberTypeQueryAdapter } from './infrastructure/ports/prisma-member-type-query.adapter';
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
 * - Handlers CQRS: crear, actualizar, desactivar, importar plantillas, vincular tipos de socio, consultas
 * - Repositorios FeePlan y MemberTypeFeePlan vía inyección por token
 * - Puerto anti-corrupción MemberTypeQueryPort para consultas cross-BC (ADR-008)
 * - TreasuryOutboxPublisher para eventos de dominio al outbox (ADR-008)
 * - PrismaTenantService para acceso a la BD del tenant (ADR-002)
 */
@Module({
  imports: [CqrsModule],
  controllers: [FeePlansController],
  providers: [
    // Handlers CQRS — Comandos (FeePlan)
    CreateFeePlanHandler,
    UpdateFeePlanHandler,
    DeactivateFeePlanHandler,
    ImportFeePlanTemplateHandler,
    LinkMemberTypesHandler,

    // Handlers CQRS — Queries (FeePlan)
    GetFeePlanHandler,
    ListFeePlansHandler,
    GetFeePlanTemplatesHandler,

    // Repositorios (inyección por token)
    {
      provide: FEE_PLAN_REPOSITORY,
      useClass: PrismaFeePlanRepository,
    },
    {
      provide: MEMBER_TYPE_FEE_PLAN_REPOSITORY,
      useClass: PrismaMemberTypeFeePlanRepository,
    },

    // Puerto anti-corrupción cross-BC (ADR-008)
    {
      provide: MEMBER_TYPE_QUERY_PORT,
      useClass: PrismaMemberTypeQueryAdapter,
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
