import { Inject, Injectable } from '@nestjs/common';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';
import {
  ENCRYPTION_SERVICE,
  type EncryptionService,
} from '../../../shared/domain/ports/encryption-service.port';
import type { TenantCredentialPort } from '../../application/ports/tenant-credential.port';
import type { TenantCredentialProvider } from '../../../shared/domain/ports/tenant-credential-provider.port';

/**
 * Servicio que implementa TenantCredentialPort (Identity BC) y
 * TenantCredentialProvider (Shared) para persistir y recuperar
 * credenciales cifradas de BD de tenant.
 *
 * - Cifra la contrasena con AES-256-GCM antes de almacenar (RNF-006).
 * - Lee de la tabla tenants en DB-Main (columnas database_user, database_password_encrypted).
 * - Cumple RNF-004 (aislamiento por credenciales dedicadas) y ADR-002.
 */
@Injectable()
export class TenantCredentialService implements TenantCredentialPort, TenantCredentialProvider {
  constructor(
    private readonly prismaMain: PrismaMainService,
    @Inject(ENCRYPTION_SERVICE)
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Cifra la contrasena y persiste username + contrasena cifrada en DB-Main.
   */
  async persistCredentials(tenantId: string, username: string, password: string): Promise<void> {
    const encryptedPassword = await this.encryptionService.encrypt(password);

    await this.prismaMain.tenant.update({
      where: { id: tenantId },
      data: {
        databaseUser: username,
        databasePasswordEncrypted: encryptedPassword,
      },
    });
  }

  /**
   * Recupera y descifra las credenciales de BD de un tenant.
   * Retorna null si el tenant no existe o no tiene credenciales almacenadas.
   */
  async getCredentials(tenantId: string): Promise<{ username: string; password: string } | null> {
    const tenant = await this.prismaMain.tenant.findUnique({
      where: { id: tenantId },
      select: {
        databaseUser: true,
        databasePasswordEncrypted: true,
      },
    });

    if (!tenant || !tenant.databaseUser || !tenant.databasePasswordEncrypted) {
      return null;
    }

    const password = await this.encryptionService.decrypt(tenant.databasePasswordEncrypted);

    return {
      username: tenant.databaseUser,
      password,
    };
  }

  /**
   * Implementacion de TenantCredentialProvider para consumidores cross-BC.
   * Delega a getCredentials.
   */
  async getConnectionCredentials(
    tenantId: string,
  ): Promise<{ username: string; password: string } | null> {
    return this.getCredentials(tenantId);
  }
}
