import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SharedModule } from './shared/shared.module';
import { IdentityModule } from './identity/identity.module';
import { MembershipModule } from './membership/membership.module';
import { TreasuryModule } from './treasury/treasury.module';
import { EventsModule } from './events/events.module';
import { CommunicationModule } from './communication/communication.module';
import { DocumentsModule } from './documents/documents.module';

// Módulo raíz de la aplicación — registra todos los Bounded Contexts y módulos transversales
@Module({
  imports: [
    // Configuración de variables de entorno disponible en toda la aplicación
    ConfigModule.forRoot({ isGlobal: true }),
    // Módulo de tareas programadas (outbox processor, jobs recurrentes)
    ScheduleModule.forRoot(),
    // Infraestructura compartida y kernel de dominio
    SharedModule,
    // Bounded Contexts
    IdentityModule,
    MembershipModule,
    TreasuryModule,
    EventsModule,
    CommunicationModule,
    DocumentsModule,
  ],
})
export class AppModule {}
