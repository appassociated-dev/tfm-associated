import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { IdentityModule } from './identity/identity.module';
import { MembershipModule } from './membership/membership.module';
import { TreasuryModule } from './treasury/treasury.module';
import { EventsModule } from './events/events.module';
import { CommunicationModule } from './communication/communication.module';
import { DocumentsModule } from './documents/documents.module';
import { ObservabilityModule } from './shared/infrastructure/observability/observability.module';
import { TenantCredentialsModule } from './shared/infrastructure/modules/tenant-credentials.module';
import { HealthModule } from './shared/infrastructure/health/health.module';
import { OutboxProcessorModule } from './shared/infrastructure/persistence/outbox-processor.module';

/**
 * Módulo raíz de la aplicación.
 * Importa todos los Bounded Context como módulos NestJS (ADR-003).
 * TenantCredentialsModule es @Global() y provee PrismaMainService, ENCRYPTION_SERVICE,
 * TENANT_CREDENTIAL_PROVIDER y TENANT_CREDENTIAL_PORT a todos los BCs (RNF-004, ADR-002).
 * ObservabilityModule se registra como global (provee ERROR_REPORTER y EVENT_TRACKER).
 * HealthModule expone GET /api/v1/health para Docker healthchecks y monitoreo.
 * ScheduleModule habilita @Cron y demás decoradores de @nestjs/schedule.
 * ThrottlerModule aplica rate limiting HTTP por IP (REQ-RL-001, RNF-010):
 *   - 'default': 100 req/min global para todos los endpoints
 *   - 'login': 5 req/10min con bloqueo de 15min para endpoint de autenticación
 * ThrottlerGuard registrado como APP_GUARD ejecuta ANTES de JwtAuthGuard (ADR-007, REQ-RL-005).
 */
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        // Throttler global: 100 peticiones por minuto por IP
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
      {
        // Throttler de login: 5 intentos por 10 minutos, bloqueo 15 min post-exceso
        name: 'login',
        ttl: 600_000,
        limit: 5,
        blockDuration: 900_000,
      },
    ]),
    ScheduleModule.forRoot(),
    TenantCredentialsModule,
    ObservabilityModule.register(),
    OutboxProcessorModule,
    HealthModule,
    IdentityModule,
    MembershipModule,
    TreasuryModule,
    EventsModule,
    CommunicationModule,
    DocumentsModule,
  ],
  providers: [
    {
      // ThrottlerGuard como APP_GUARD ejecuta antes de los guards de IdentityModule
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
