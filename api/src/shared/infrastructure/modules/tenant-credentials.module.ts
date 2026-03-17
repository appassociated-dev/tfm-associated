import { Global, Module } from '@nestjs/common';
import { PrismaMainService } from '../persistence/prisma-main.service';
import { Aes256EncryptionService } from '../services/aes256-encryption.service';
import { TenantCredentialService } from '../../../identity/infrastructure/services/tenant-credential.service';
import { ENCRYPTION_SERVICE } from '../../domain/ports/encryption-service.port';
import { TENANT_CREDENTIAL_PROVIDER } from '../../domain/ports/tenant-credential-provider.port';
import { TENANT_CREDENTIAL_PORT } from '../../../identity/application/ports/tenant-credential.port';

/**
 * Modulo global de credenciales de tenant.
 *
 * Provee los servicios necesarios para que TODOS los Bounded Contexts
 * accedan a credenciales per-tenant (RNF-004, ADR-002):
 *
 * - PrismaMainService: acceso a DB-Main (necesario para leer credenciales cifradas).
 * - ENCRYPTION_SERVICE: cifrado AES-256-GCM para credenciales (RNF-006).
 * - TENANT_CREDENTIAL_PROVIDER: interfaz de solo lectura para consumidores cross-BC.
 * - TENANT_CREDENTIAL_PORT: interfaz completa (lectura + escritura) para Identity BC.
 *
 * Al ser @Global(), todos los modulos reciben estos providers sin importar
 * explicitamente este modulo. Se registra una sola vez en AppModule.
 *
 * Separa las credenciales/cifrado de los guards y handlers de IdentityModule
 * para evitar duplicar APP_GUARD al importar Identity en otros BCs.
 */
@Global()
@Module({
  providers: [
    // Acceso a DB-Main (singleton, requerido por TenantCredentialService)
    PrismaMainService,

    // Cifrado AES-256-GCM (RNF-006)
    {
      provide: ENCRYPTION_SERVICE,
      useClass: Aes256EncryptionService,
    },

    // TenantCredentialService implementa ambos puertos:
    // - TENANT_CREDENTIAL_PROVIDER (cross-BC, solo lectura)
    // - TENANT_CREDENTIAL_PORT (Identity BC, lectura + escritura)
    // Usamos useClass para cada token; NestJS crea una sola instancia
    // porque @Injectable() es singleton por defecto.
    {
      provide: TENANT_CREDENTIAL_PROVIDER,
      useClass: TenantCredentialService,
    },
    {
      provide: TENANT_CREDENTIAL_PORT,
      useClass: TenantCredentialService,
    },
  ],
  exports: [
    PrismaMainService,
    ENCRYPTION_SERVICE,
    TENANT_CREDENTIAL_PROVIDER,
    TENANT_CREDENTIAL_PORT,
  ],
})
export class TenantCredentialsModule {}
