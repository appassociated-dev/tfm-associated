import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxProcessorService } from './outbox-processor.service';
import { EventReconstitutionRegistry } from './event-reconstitution.registry';
import { PrismaIntegrationEventPublisher } from './prisma-integration-event.publisher';
import { PrismaDomainAuditPublisher } from './prisma-domain-audit.publisher';
import { INTEGRATION_EVENT_PUBLISHER } from '../../application/ports/integration-event.publisher';
import { DOMAIN_AUDIT_PUBLISHER } from '../../application/ports/domain-audit.publisher';

/**
 * Módulo global de procesamiento del outbox y publicación de eventos de dominio.
 *
 * Expone a todos los Bounded Contexts (via @Global) los tokens:
 * - INTEGRATION_EVENT_PUBLISHER: para escribir eventos en el outbox de DB-Main.
 * - DOMAIN_AUDIT_PUBLISHER: para escribir eventos de auditoría en DB-Tenant.
 * - EventReconstitutionRegistry: para registrar clases de eventos y reconstituirlos.
 *
 * Nota: ScheduleModule.forRoot() ya está registrado en AppModule.
 * No lo importamos aquí para evitar duplicación.
 *
 * PrismaMainService es @Global() via TenantCredentialsModule — no es necesario re-proveerlo aquí.
 */
@Global()
@Module({
  imports: [CqrsModule],
  providers: [
    OutboxProcessorService,
    EventReconstitutionRegistry,
    {
      provide: INTEGRATION_EVENT_PUBLISHER,
      useClass: PrismaIntegrationEventPublisher,
    },
    {
      provide: DOMAIN_AUDIT_PUBLISHER,
      useClass: PrismaDomainAuditPublisher,
    },
  ],
  exports: [INTEGRATION_EVENT_PUBLISHER, DOMAIN_AUDIT_PUBLISHER, EventReconstitutionRegistry],
})
export class OutboxProcessorModule {}
