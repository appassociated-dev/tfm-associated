import { Module } from '@nestjs/common';
import { IdentityModule } from './identity/identity.module';
import { MembershipModule } from './membership/membership.module';
import { TreasuryModule } from './treasury/treasury.module';
import { EventsModule } from './events/events.module';
import { CommunicationModule } from './communication/communication.module';
import { DocumentsModule } from './documents/documents.module';
import { ObservabilityModule } from './shared/infrastructure/observability/observability.module';

/**
 * Módulo raíz de la aplicación.
 * Importa todos los Bounded Context como módulos NestJS (ADR-003).
 * ObservabilityModule se registra como global (provee ERROR_REPORTER y EVENT_TRACKER).
 */
@Module({
  imports: [
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
