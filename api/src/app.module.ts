import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { IdentityModule } from './identity/identity.module';
import { MembershipModule } from './membership/membership.module';
import { TreasuryModule } from './treasury/treasury.module';
import { EventsModule } from './events/events.module';
import { CommunicationModule } from './communication/communication.module';
import { DocumentsModule } from './documents/documents.module';
import { ObservabilityModule } from './shared/infrastructure/observability/observability.module';
import { TenantCredentialsModule } from './shared/infrastructure/modules/tenant-credentials.module';

/**
 * Módulo raíz de la aplicación.
 * Importa todos los Bounded Context como módulos NestJS (ADR-003).
 * TenantCredentialsModule es @Global() y provee PrismaMainService, ENCRYPTION_SERVICE,
 * TENANT_CREDENTIAL_PROVIDER y TENANT_CREDENTIAL_PORT a todos los BCs (RNF-004, ADR-002).
 * ObservabilityModule se registra como global (provee ERROR_REPORTER y EVENT_TRACKER).
 * ScheduleModule habilita @Cron y demás decoradores de @nestjs/schedule.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    TenantCredentialsModule,
    ObservabilityModule.register(),
    IdentityModule,
    MembershipModule,
    TreasuryModule,
    EventsModule,
    CommunicationModule,
    DocumentsModule,
  ],
})
export class AppModule {}
