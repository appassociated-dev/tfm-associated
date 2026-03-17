import { describe, it, expect } from 'vitest';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { TenantCredentialsModule } from '../tenant-credentials.module';
import { ENCRYPTION_SERVICE } from '../../../domain/ports/encryption-service.port';
import { TENANT_CREDENTIAL_PROVIDER } from '../../../domain/ports/tenant-credential-provider.port';
import { TENANT_CREDENTIAL_PORT } from '../../../../identity/application/ports/tenant-credential.port';
import { PrismaMainService } from '../../persistence/prisma-main.service';
import { Aes256EncryptionService } from '../../services/aes256-encryption.service';
import { TenantCredentialService } from '../../../../identity/infrastructure/services/tenant-credential.service';

/**
 * Verifica la estructura de TenantCredentialsModule.
 *
 * Usa reflexion de metadatos de NestJS para validar que el modulo
 * registra los providers y exports correctos sin instanciar el contenedor
 * (evita la conexion real a PostgreSQL en tests unitarios).
 *
 * Patron coherente con observability.module.spec.ts.
 */
describe('TenantCredentialsModule', () => {
  const providers: unknown[] =
    Reflect.getMetadata(MODULE_METADATA.PROVIDERS, TenantCredentialsModule) ?? [];
  const exports_: unknown[] =
    Reflect.getMetadata(MODULE_METADATA.EXPORTS, TenantCredentialsModule) ?? [];
  const imports: unknown[] =
    Reflect.getMetadata(MODULE_METADATA.IMPORTS, TenantCredentialsModule) ?? [];
  const isGlobal: boolean =
    Reflect.getMetadata('__module:global__', TenantCredentialsModule) ?? false;

  it('deberia estar decorado como @Global()', () => {
    expect(isGlobal).toBe(true);
  });

  it('deberia proveer PrismaMainService', () => {
    expect(providers).toContain(PrismaMainService);
  });

  it('deberia proveer ENCRYPTION_SERVICE con Aes256EncryptionService', () => {
    const encryptionProvider = providers.find(
      (p) => (p as { provide?: unknown }).provide === ENCRYPTION_SERVICE,
    ) as { provide: unknown; useClass: unknown } | undefined;
    expect(encryptionProvider).toBeDefined();
    expect(encryptionProvider!.useClass).toBe(Aes256EncryptionService);
  });

  it('deberia proveer TENANT_CREDENTIAL_PROVIDER con TenantCredentialService', () => {
    const credProvider = providers.find(
      (p) => (p as { provide?: unknown }).provide === TENANT_CREDENTIAL_PROVIDER,
    ) as { provide: unknown; useClass: unknown } | undefined;
    expect(credProvider).toBeDefined();
    expect(credProvider!.useClass).toBe(TenantCredentialService);
  });

  it('deberia proveer TENANT_CREDENTIAL_PORT con TenantCredentialService', () => {
    const portProvider = providers.find(
      (p) => (p as { provide?: unknown }).provide === TENANT_CREDENTIAL_PORT,
    ) as { provide: unknown; useClass: unknown } | undefined;
    expect(portProvider).toBeDefined();
    expect(portProvider!.useClass).toBe(TenantCredentialService);
  });

  it('deberia exportar PrismaMainService, ENCRYPTION_SERVICE, TENANT_CREDENTIAL_PROVIDER y TENANT_CREDENTIAL_PORT', () => {
    expect(exports_).toContain(PrismaMainService);
    expect(exports_).toContain(ENCRYPTION_SERVICE);
    expect(exports_).toContain(TENANT_CREDENTIAL_PROVIDER);
    expect(exports_).toContain(TENANT_CREDENTIAL_PORT);
    expect(exports_).toHaveLength(4);
  });

  it('no deberia importar ningun otro modulo (autocontenido)', () => {
    expect(imports).toHaveLength(0);
  });

  it('no deberia proveer guards ni handlers de Identity BC', () => {
    // Verificar que no hay APP_GUARD ni ningun handler CQRS
    const providerNames = providers.map((p) => {
      const provider = p as { useClass?: { name: string } };
      const cls = provider.useClass ?? p;
      return typeof cls === 'function' ? (cls as { name: string }).name : String(cls);
    });

    const dangerousPatterns = ['JwtAuthGuard', 'PermissionsGuard', 'Handler'];

    for (const name of providerNames) {
      for (const pattern of dangerousPatterns) {
        expect(name).not.toContain(pattern);
      }
    }
  });
});
