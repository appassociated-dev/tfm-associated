import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { FeePlansController } from './infrastructure/controllers/fee-plans.controller';
import { SubscriptionsController } from './infrastructure/controllers/subscriptions.controller';
import {
  ChargesController,
  MemberAccountChargesController,
} from './infrastructure/controllers/charges.controller';
import {
  PaymentsGlobalController,
  MemberAccountPaymentsController,
} from './infrastructure/controllers/payments.controller';
import { CreateFeePlanHandler } from './application/commands/create-fee-plan.handler';
import { UpdateFeePlanHandler } from './application/commands/update-fee-plan.handler';
import { DeactivateFeePlanHandler } from './application/commands/deactivate-fee-plan.handler';
import { ActivateFeePlanHandler } from './application/commands/activate-fee-plan.handler';
import { ImportFeePlanTemplateHandler } from './application/commands/import-fee-plan-template.handler';
import { LinkMemberTypesHandler } from './application/commands/link-member-types.handler';
import { CreateSubscriptionHandler } from './application/commands/create-subscription.handler';
import { ChangeSubscriptionPlanHandler } from './application/commands/change-subscription-plan.handler';
import { CloseSubscriptionHandler } from './application/commands/close-subscription.handler';
import { UpdateSubscriptionDiscountHandler } from './application/commands/update-subscription-discount.handler';
import { GenerateMonthlyChargesHandler } from './application/commands/generate-monthly-charges.handler';
import { GenerateSubscriptionChargesHandler } from './application/commands/generate-subscription-charges.handler';
import { RecordPaymentHandler } from './application/commands/record-payment.handler';
import { RecordMultiChargePaymentHandler } from './application/commands/record-multi-charge-payment.handler';
import { CreateMemberAccountHandler } from './application/commands/create-member-account.handler';
import { OnMemberRegisteredTreasuryHandler } from './application/event-handlers/on-member-registered.treasury-handler';
import { OnMemberDeactivatedTreasuryHandler } from './application/event-handlers/on-member-deactivated.treasury-handler';
import { OnMemberReinstatedTreasuryHandler } from './application/event-handlers/on-member-reinstated.treasury-handler';
import { OnMemberDataUpdatedTreasuryHandler } from './application/event-handlers/on-member-data-updated.treasury-handler';
import { OnMemberStatusChangedTreasuryHandler } from './application/event-handlers/on-member-status-changed.treasury-handler';
import { OnFiscalYearOpenedTreasuryHandler } from './application/event-handlers/on-fiscal-year-opened.treasury-handler';
import { OnMemberTypeChangedTreasuryHandler } from './application/event-handlers/on-member-type-changed.treasury-handler';
import { GetFeePlanHandler } from './application/queries/get-fee-plan.handler';
import { ListFeePlansHandler } from './application/queries/list-fee-plans.handler';
import { GetFeePlanTemplatesHandler } from './application/queries/get-fee-plan-templates.handler';
import { GetSubscriptionsHandler } from './application/queries/get-subscriptions.handler';
import { GetActiveSubscriptionHandler } from './application/queries/get-active-subscription.handler';
import { GetChargesByAccountHandler } from './application/queries/get-charges-by-account.handler';
import { GetGenerationLogHandler } from './application/queries/get-generation-log.handler';
import { GetPaymentsByAccountHandler } from './application/queries/get-payments-by-account.handler';
import { GetPendingChargesHandler } from './application/queries/get-pending-charges.handler';
import { GetAccountBalanceHandler } from './application/queries/get-account-balance.handler';
import { GetReceiptHandler } from './application/queries/get-receipt.handler';
import { SearchMembersForPaymentHandler } from './application/queries/search-members-for-payment.handler';
import { FEE_PLAN_REPOSITORY } from './domain/repositories/fee-plan.repository';
import { PrismaFeePlanRepository } from './infrastructure/persistence/prisma-fee-plan.repository';
import { MEMBER_TYPE_FEE_PLAN_REPOSITORY } from './domain/repositories/member-type-fee-plan.repository';
import { PrismaMemberTypeFeePlanRepository } from './infrastructure/persistence/prisma-member-type-fee-plan.repository';
import { MEMBER_ACCOUNT_REPOSITORY } from './domain/repositories/member-account.repository';
import { PrismaMemberAccountRepository } from './infrastructure/persistence/prisma-member-account.repository';
import { CHARGE_REPOSITORY } from './domain/repositories/charge.repository';
import { PrismaChargeRepository } from './infrastructure/persistence/prisma-charge.repository';
import { PAYMENT_REPOSITORY } from './domain/repositories/payment.repository';
import { PrismaPaymentRepository } from './infrastructure/persistence/prisma-payment.repository';
import { MEMBER_TYPE_QUERY_PORT } from './domain/ports/member-type-query.port';
import { PrismaMemberTypeQueryAdapter } from './infrastructure/ports/prisma-member-type-query.adapter';
import { MEMBER_QUERY_PORT } from './domain/ports/member-query.port';
import { PrismaMemberQueryAdapter } from './infrastructure/ports/prisma-member-query.adapter';
import { FISCAL_YEAR_QUERY_PORT } from './domain/ports/fiscal-year-query.port';
import { PrismaFiscalYearQueryAdapter } from './infrastructure/ports/prisma-fiscal-year-query.adapter';
import { RECEIPT_GENERATOR } from './infrastructure/services/receipt-generator';
import { PdfReceiptGenerator } from './infrastructure/services/receipt-generator';
import { ChargeGenerationCron } from './infrastructure/cron/charge-generation.cron';
import { PrismaTenantService } from '../shared/infrastructure/persistence/prisma-tenant.service';
import { EventReconstitutionRegistry } from '../shared/infrastructure/persistence/event-reconstitution.registry';
import {
  ChargeGeneratedEvent,
  FeePlanCreatedEvent,
  FeePlanLinkedToMemberTypeEvent,
  FeePlanModifiedEvent,
  MonthlyGenerationCompletedEvent,
  PaymentRecordedEvent,
  ReceiptGeneratedEvent,
  SubscriptionClosedEvent,
  SubscriptionCreatedEvent,
  SubscriptionModifiedEvent,
} from './domain/events';

/**
 * BC-Treasury: Cuentas, planes de cuotas, remesas SEPA y transacciones.
 * Módulo autocontenido según ADR-003.
 *
 * Registra:
 * - CqrsModule para Command/Query handling (ADR-004)
 * - FeePlansController para endpoints REST de planes de cuota (UC-017)
 * - SubscriptionsController para endpoints REST de suscripciones (UC-018)
 * - ChargesController y MemberAccountChargesController para endpoints REST de cargos (UC-019)
 * - PaymentsGlobalController y MemberAccountPaymentsController para endpoints REST de pagos (UC-021)
 * - Handlers CQRS: crear, actualizar, desactivar, importar plantillas, vincular tipos de socio, consultas
 * - Handlers CQRS: crear suscripción, cambiar plan, cerrar, actualizar descuento, consultas de suscripciones
 * - Handlers CQRS: generación masiva de cargos, generación por suscripción, consulta de cargos por cuenta
 * - Handlers CQRS: registro de cobros, cobro multi-cargo, consultas de pagos, balance, recibos, búsqueda de socios (UC-021)
 * - Repositorios FeePlan, MemberTypeFeePlan, MemberAccount, Charge y Payment vía inyección por token
 * - Puertos anti-corrupción MemberTypeQueryPort, MemberQueryPort y FiscalYearQueryPort para consultas cross-BC (ADR-008)
 * - IntegrationEventPublisher (compartido, @Global vía OutboxProcessorModule) para eventos de integración al outbox (ADR-008)
 * - ReceiptGenerator para generación de recibos PDF (UC-021, US-057)
 * - ChargeGenerationCron para generación automática mensual de cargos (US-047)
 * - PrismaTenantService para acceso a la BD del tenant (ADR-002)
 *
 * PrismaMainService, ENCRYPTION_SERVICE y TENANT_CREDENTIAL_PROVIDER provistos
 * globalmente por TenantCredentialsModule (RNF-004, RNF-006).
 */
@Module({
  imports: [CqrsModule],
  controllers: [
    FeePlansController,
    SubscriptionsController,
    ChargesController,
    MemberAccountChargesController,
    PaymentsGlobalController,
    MemberAccountPaymentsController,
  ],
  providers: [
    // Handlers CQRS — Comandos (FeePlan)
    CreateFeePlanHandler,
    UpdateFeePlanHandler,
    DeactivateFeePlanHandler,
    ActivateFeePlanHandler,
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

    // Handlers CQRS — Comandos (Payments / UC-021)
    RecordPaymentHandler,
    RecordMultiChargePaymentHandler,

    // Handlers CQRS — Comandos (MemberAccount — Integration Event consumers ADR-008)
    CreateMemberAccountHandler,

    // Event Handlers — Integration Events consumers BC-Membership → BC-Treasury (ADR-008)
    OnMemberRegisteredTreasuryHandler,
    OnMemberDeactivatedTreasuryHandler,
    OnMemberReinstatedTreasuryHandler,
    OnMemberDataUpdatedTreasuryHandler,
    OnMemberStatusChangedTreasuryHandler,
    OnFiscalYearOpenedTreasuryHandler,
    OnMemberTypeChangedTreasuryHandler,

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

    // Handlers CQRS — Queries (Payments / UC-021)
    GetPaymentsByAccountHandler,
    GetPendingChargesHandler,
    GetAccountBalanceHandler,
    GetReceiptHandler,
    SearchMembersForPaymentHandler,

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
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PrismaPaymentRepository,
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

    // INTEGRATION_EVENT_PUBLISHER provisto globalmente por OutboxProcessorModule

    // Generador de recibos PDF (UC-021, US-057)
    {
      provide: RECEIPT_GENERATOR,
      useClass: PdfReceiptGenerator,
    },

    // Cron job para generación automática mensual de cargos (US-047)
    ChargeGenerationCron,

    // PrismaMainService provisto globalmente por TenantCredentialsModule

    // Servicios de infraestructura compartidos
    PrismaTenantService,
  ],
  exports: [],
})
export class TreasuryModule implements OnModuleInit {
  constructor(
    @Inject(EventReconstitutionRegistry)
    private readonly registry: EventReconstitutionRegistry,
  ) {}

  /**
   * Registra los 10 tipos de eventos de BC-Treasury en el EventReconstitutionRegistry.
   * Permite que OutboxProcessorService reconstituya eventos tipados al procesarlos.
   */
  onModuleInit(): void {
    this.registry.register('ChargeGenerated', ChargeGeneratedEvent);
    this.registry.register('FeePlanCreated', FeePlanCreatedEvent);
    this.registry.register('FeePlanLinkedToMemberType', FeePlanLinkedToMemberTypeEvent);
    this.registry.register('FeePlanModified', FeePlanModifiedEvent);
    this.registry.register('MonthlyGenerationCompleted', MonthlyGenerationCompletedEvent);
    this.registry.register('PaymentRecorded', PaymentRecordedEvent);
    this.registry.register('ReceiptGenerated', ReceiptGeneratedEvent);
    this.registry.register('SubscriptionClosed', SubscriptionClosedEvent);
    this.registry.register('SubscriptionCreated', SubscriptionCreatedEvent);
    this.registry.register('SubscriptionModified', SubscriptionModifiedEvent);
  }
}
