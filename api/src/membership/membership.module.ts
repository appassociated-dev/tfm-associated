import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MemberTypesController } from './infrastructure/controllers/member-types.controller';
import { FiscalYearsController } from './infrastructure/controllers/fiscal-years.controller';
import { MemberStatusController } from './infrastructure/controllers/member-status.controller';
import { MembersController } from './infrastructure/controllers/members.controller';
import { RegistrationController } from './infrastructure/controllers/registration.controller';
import { MemberLeaveController } from './infrastructure/controllers/member-leave.controller';
import { CreateMemberTypeHandler } from './application/commands/create-member-type.handler';
import { UpdateMemberTypeHandler } from './application/commands/update-member-type.handler';
import { DeactivateMemberTypeHandler } from './application/commands/deactivate-member-type.handler';
import { ImportTemplateHandler } from './application/commands/import-template.handler';
import { OpenFiscalYearHandler } from './application/commands/open-fiscal-year.handler';
import { CloseFiscalYearHandler } from './application/commands/close-fiscal-year.handler';
import { ChangeStatusHandler } from './application/commands/change-status.handler';
import { RunDelinquencyCheckHandler } from './application/commands/run-delinquency-check.handler';
import { CreateMemberHandler } from './application/commands/create-member.handler';
import { UpdateMemberHandler } from './application/commands/update-member.handler';
import { SimpleRegistrationHandler } from './application/commands/simple-registration.handler';
import { ProcessVoluntaryLeaveHandler } from './application/commands/voluntary-leave.handler';
import { ProcessNonpaymentLeaveHandler } from './application/commands/nonpayment-leave.handler';
import { ReinstateMemberHandler } from './application/commands/reinstate-member.handler';
import { GetMemberTypeHandler } from './application/queries/get-member-type.handler';
import { ListMemberTypesHandler } from './application/queries/list-member-types.handler';
import { GetTemplatesHandler } from './application/queries/get-templates.handler';
import { GetFiscalYearHandler } from './application/queries/get-fiscal-year.handler';
import { GetActiveFiscalYearHandler } from './application/queries/get-active-fiscal-year.handler';
import { ListFiscalYearsHandler } from './application/queries/list-fiscal-years.handler';
import { CompareFiscalYearsHandler } from './application/queries/compare-fiscal-years.handler';
import { GetStatusHistoryHandler } from './application/queries/get-status-history.handler';
import { GetAvailableTransitionsHandler } from './application/queries/get-available-transitions.handler';
import { GetMemberHandler } from './application/queries/get-member.handler';
import { ListMembersHandler } from './application/queries/list-members.handler';
import { CheckDniHandler } from './application/queries/check-dni.handler';
import { CheckEmailHandler } from './application/queries/check-email.handler';
import { ValidatePreconditionsHandler } from './application/queries/validate-preconditions.handler';
import { GetLeaveSummaryHandler } from './application/queries/leave-summary.handler';
import { GetReinstatementSummaryHandler } from './application/queries/reinstatement-summary.handler';
import { MEMBER_TYPE_REPOSITORY } from './domain/repositories/member-type.repository';
import { PrismaMemberTypeRepository } from './infrastructure/persistence/prisma-member-type.repository';
import { FISCAL_YEAR_REPOSITORY } from './domain/repositories/fiscal-year.repository';
import { PrismaFiscalYearRepository } from './infrastructure/persistence/prisma-fiscal-year.repository';
import { MEMBER_REPOSITORY } from './domain/repositories/member.repository';
import { PrismaMemberRepository } from './infrastructure/persistence/prisma-member.repository';
import { STATUS_HISTORY_REPOSITORY } from './domain/repositories/status-history.repository';
import { PrismaStatusHistoryRepository } from './infrastructure/persistence/prisma-status-history.repository';
import { REGISTRATION_CHARGE_PORT } from './domain/ports/registration-charge.port';
import { PrismaRegistrationChargeAdapter } from './infrastructure/ports/prisma-registration-charge.adapter';
import { SUBSCRIPTION_QUERY_PORT } from './domain/ports/subscription-query.port';
import { PrismaSubscriptionQueryAdapter } from './infrastructure/ports/prisma-subscription-query.adapter';
import { MemberPrismaMapper } from './infrastructure/persistence/member-prisma.mapper';
import { PrismaTenantService } from '../shared/infrastructure/persistence/prisma-tenant.service';
import { PrismaMemberOutboxPublisher } from './infrastructure/services/prisma-member-outbox.publisher';
import { MEMBER_OUTBOX_PUBLISHER } from './application/ports/member-outbox.publisher';

/**
 * BC-Membership: Socios, tipos, ejercicios fiscales, altas y carnets.
 * Módulo autocontenido según ADR-003.
 *
 * Registra:
 * - CqrsModule para Command/Query handling (ADR-004)
 * - MemberTypesController para endpoints REST de tipos de socio (UC-008)
 * - FiscalYearsController para endpoints REST de ejercicios fiscales (UC-010)
 * - MemberStatusController para endpoints REST de gestión de estados (UC-007)
 * - MembersController para endpoints REST de fichas de socio (UC-006)
 * - RegistrationController para endpoints REST de alta simple de socio (UC-011)
 * - MemberLeaveController para endpoints REST de baja y rehabilitación de socio (UC-013)
 * - Handlers CQRS: crear, actualizar, desactivar, importar plantillas, registro simple, baja, rehabilitación, consultas
 * - Repositorios MemberType, FiscalYear, Member y StatusHistory vía inyección por token
 * - MemberPrismaMapper como servicio inyectable
 * - PrismaTenantService para acceso a la BD del tenant (ADR-002)
 *
 * ENCRYPTION_SERVICE y TENANT_CREDENTIAL_PROVIDER provistos globalmente
 * por TenantCredentialsModule (RNF-004, RNF-006).
 */
@Module({
  imports: [CqrsModule],
  controllers: [
    MemberTypesController,
    FiscalYearsController,
    MemberStatusController,
    // RegistrationController DEBE ir antes de MembersController para que
    // rutas específicas como /preconditions, /check-dni, /simple-registration
    // se resuelvan antes que la ruta genérica :id (ParseUUIDPipe).
    RegistrationController,
    MembersController,
    MemberLeaveController,
  ],
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

    // Handlers CQRS — Comandos (Member - UC-006)
    CreateMemberHandler,
    UpdateMemberHandler,

    // Handlers CQRS — Comandos (Member - UC-011)
    SimpleRegistrationHandler,

    // Handlers CQRS — Comandos (Member - UC-013)
    ProcessVoluntaryLeaveHandler,
    ProcessNonpaymentLeaveHandler,
    ReinstateMemberHandler,

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

    // Handlers CQRS — Queries (Member - UC-006)
    GetMemberHandler,
    ListMembersHandler,

    // Handlers CQRS — Queries (Member - UC-011)
    CheckDniHandler,
    CheckEmailHandler,
    ValidatePreconditionsHandler,

    // Handlers CQRS — Queries (Member - UC-013)
    GetLeaveSummaryHandler,
    GetReinstatementSummaryHandler,

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

    // Puerto cross-BC de cargos de alta (UC-011)
    {
      provide: REGISTRATION_CHARGE_PORT,
      useClass: PrismaRegistrationChargeAdapter,
    },

    // Puerto cross-BC de consultas de suscripciones y cargos (UC-013)
    {
      provide: SUBSCRIPTION_QUERY_PORT,
      useClass: PrismaSubscriptionQueryAdapter,
    },

    // ENCRYPTION_SERVICE provisto globalmente por TenantCredentialsModule (RNF-006)

    // Mapper inyectable para Member
    MemberPrismaMapper,

    {
      provide: MEMBER_OUTBOX_PUBLISHER,
      useClass: PrismaMemberOutboxPublisher,
    },

    // Servicios de infraestructura compartidos
    PrismaTenantService,
  ],
  exports: [],
})
export class MembershipModule {}
