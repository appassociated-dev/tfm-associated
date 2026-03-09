import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TenantsController } from './infrastructure/controllers/tenants.controller';
import { ProvisionTenantHandler } from './application/commands/provision-tenant.handler';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository';
import { PrismaTenantRepository } from './infrastructure/persistence/prisma-tenant.repository';
import { DATABASE_PROVISIONING_PORT } from './application/ports/database-provisioning.port';
import { DatabaseProvisioningService } from './infrastructure/services/database-provisioning.service';
import { PrismaMainService } from '../shared/infrastructure/persistence/prisma-main.service';

/**
 * BC-Identity: Usuarios, tenants, membresías y roles.
 * Módulo autocontenido según ADR-003.
 *
 * Registra:
 * - CqrsModule para Command/Query handling
 * - TenantsController para el endpoint REST
 * - ProvisionTenantHandler como command handler
 * - PrismaTenantRepository como implementación de TenantRepository
 * - DatabaseProvisioningService como implementación de DatabaseProvisioningPort
 * - PrismaMainService para acceso a la BD principal
 */
@Module({
  imports: [CqrsModule],
  controllers: [TenantsController],
  providers: [
    // Handlers CQRS
    ProvisionTenantHandler,

    // Repositorios (inyección por token)
    {
      provide: TENANT_REPOSITORY,
      useClass: PrismaTenantRepository,
    },

    // Puertos de infraestructura (inyección por token)
    {
      provide: DATABASE_PROVISIONING_PORT,
      useClass: DatabaseProvisioningService,
    },

    // Servicios de infraestructura compartidos
    PrismaMainService,
  ],
  exports: [],
})
export class IdentityModule {}
