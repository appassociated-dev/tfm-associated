import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MemberTypesController } from './infrastructure/controllers/member-types.controller';
import { FiscalYearsController } from './infrastructure/controllers/fiscal-years.controller';
import { MemberStatusController } from './infrastructure/controllers/member-status.controller';
import { CreateMemberTypeHandler } from './application/commands/create-member-type.handler';
import { UpdateMemberTypeHandler } from './application/commands/update-member-type.handler';
import { DeactivateMemberTypeHandler } from './application/commands/deactivate-member-type.handler';
import { ImportTemplateHandler } from './application/commands/import-template.handler';
import { OpenFiscalYearHandler } from './application/commands/open-fiscal-year.handler';
import { CloseFiscalYearHandler } from './application/commands/close-fiscal-year.handler';
import { ChangeStatusHandler } from './application/commands/change-status.handler';
import { RunDelinquencyCheckHandler } from './application/commands/run-delinquency-check.handler';
import { GetMemberTypeHandler } from './application/queries/get-member-type.handler';
import { ListMemberTypesHandler } from './application/queries/list-member-types.handler';
import { GetTemplatesHandler } from './application/queries/get-templates.handler';
import { GetFiscalYearHandler } from './application/queries/get-fiscal-year.handler';
import { GetActiveFiscalYearHandler } from './application/queries/get-active-fiscal-year.handler';
import { ListFiscalYearsHandler } from './application/queries/list-fiscal-years.handler';
import { CompareFiscalYearsHandler } from './application/queries/compare-fiscal-years.handler';
import { GetStatusHistoryHandler } from './application/queries/get-status-history.handler';
import { GetAvailableTransitionsHandler } from './application/queries/get-available-transitions.handler';
import { MEMBER_TYPE_REPOSITORY } from './domain/repositories/member-type.repository';
import { PrismaMemberTypeRepository } from './infrastructure/persistence/prisma-member-type.repository';
import { FISCAL_YEAR_REPOSITORY } from './domain/repositories/fiscal-year.repository';
import { PrismaFiscalYearRepository } from './infrastructure/persistence/prisma-fiscal-year.repository';
import { MEMBER_REPOSITORY } from './domain/repositories/member.repository';
import { PrismaMemberRepository } from './infrastructure/persistence/prisma-member.repository';
import { STATUS_HISTORY_REPOSITORY } from './domain/repositories/status-history.repository';
import { PrismaStatusHistoryRepository } from './infrastructure/persistence/prisma-status-history.repository';
import { PrismaTenantService } from '../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * BC-Membership: Socios, tipos, ejercicios fiscales, altas y carnets.
 * Módulo autocontenido según ADR-003.
 *
 * Registra:
 * - CqrsModule para Command/Query handling (ADR-004)
 * - MemberTypesController para endpoints REST de tipos de socio (UC-008)
 * - FiscalYearsController para endpoints REST de ejercicios fiscales (UC-010)
 * - MemberStatusController para endpoints REST de gestión de estados (UC-007)
 * - Handlers CQRS: crear, actualizar, desactivar, importar plantillas, consultas
 * - Repositorios MemberType, FiscalYear, Member y StatusHistory vía inyección por token
 * - PrismaTenantService para acceso a la BD del tenant (ADR-002)
 */
@Module({
  imports: [CqrsModule],
  controllers: [MemberTypesController, FiscalYearsController, MemberStatusController],
  providers: [
    // Handlers CQRS — Comandos (MemberType)
    CreateMemberTypeHandler,
    UpdateMemberTypeHandler,
    DeactivateMemberTypeHandler,
    ImportTemplateHandler,

    // Handlers CQRS — Comandos (FiscalYear)
    OpenFiscalYearHandler,
    CloseFiscalYearHandler,

    // Handlers CQRS — Comandos (Member - UC-007)
    ChangeStatusHandler,
    RunDelinquencyCheckHandler,

    // Handlers CQRS — Queries (MemberType)
    GetMemberTypeHandler,
    ListMemberTypesHandler,
    GetTemplatesHandler,

    // Handlers CQRS — Queries (FiscalYear)
    GetFiscalYearHandler,
    GetActiveFiscalYearHandler,
    ListFiscalYearsHandler,
    CompareFiscalYearsHandler,

    // Handlers CQRS — Queries (Member - UC-007)
    GetStatusHistoryHandler,
    GetAvailableTransitionsHandler,

    // Repositorios (inyección por token)
    {
      provide: MEMBER_TYPE_REPOSITORY,
      useClass: PrismaMemberTypeRepository,
    },
    {
      provide: FISCAL_YEAR_REPOSITORY,
      useClass: PrismaFiscalYearRepository,
    },
    {
      provide: MEMBER_REPOSITORY,
      useClass: PrismaMemberRepository,
    },
    {
      provide: STATUS_HISTORY_REPOSITORY,
      useClass: PrismaStatusHistoryRepository,
    },

    // Servicios de infraestructura compartidos
    PrismaTenantService,
  ],
  exports: [],
})
export class MembershipModule {}
