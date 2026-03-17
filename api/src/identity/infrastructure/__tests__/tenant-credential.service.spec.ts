import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantCredentialService } from '../services/tenant-credential.service';
import type { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';
import type { EncryptionService } from '../../../shared/domain/ports/encryption-service.port';

describe('TenantCredentialService', () => {
  let service: TenantCredentialService;
  let prismaMain: {
    tenant: {
      update: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
  };
  let encryptionService: {
    encrypt: ReturnType<typeof vi.fn>;
    decrypt: ReturnType<typeof vi.fn>;
  };

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
  const USERNAME = 'tenant_550e8400_e29b_41d4_a716_446655440000';
  const PASSWORD = 'super-secret-password-123';
  const ENCRYPTED_PASSWORD = 'iv_base64:authTag_base64:cipher_base64';

  beforeEach(() => {
    vi.clearAllMocks();

    prismaMain = {
      tenant: {
        update: vi.fn().mockResolvedValue(undefined),
        findUnique: vi.fn(),
      },
    };

    encryptionService = {
      encrypt: vi.fn().mockResolvedValue(ENCRYPTED_PASSWORD),
      decrypt: vi.fn().mockResolvedValue(PASSWORD),
    };

    service = new TenantCredentialService(
      prismaMain as unknown as PrismaMainService,
      encryptionService as unknown as EncryptionService,
    );
  });

  // --- persistCredentials ---

  describe('persistCredentials', () => {
    it('deberia cifrar la contrasena y guardar username + contrasena cifrada en DB-Main', async () => {
      await service.persistCredentials(TENANT_ID, USERNAME, PASSWORD);

      // Debe cifrar la contrasena
      expect(encryptionService.encrypt).toHaveBeenCalledWith(PASSWORD);

      // Debe actualizar el tenant con las credenciales
      expect(prismaMain.tenant.update).toHaveBeenCalledWith({
        where: { id: TENANT_ID },
        data: {
          databaseUser: USERNAME,
          databasePasswordEncrypted: ENCRYPTED_PASSWORD,
        },
      });
    });

    it('deberia cifrar antes de persistir (orden de operaciones)', async () => {
      const callOrder: string[] = [];

      encryptionService.encrypt.mockImplementation(async () => {
        callOrder.push('encrypt');
        return ENCRYPTED_PASSWORD;
      });

      prismaMain.tenant.update.mockImplementation(async () => {
        callOrder.push('update');
        return undefined;
      });

      await service.persistCredentials(TENANT_ID, USERNAME, PASSWORD);

      expect(callOrder).toEqual(['encrypt', 'update']);
    });
  });

  // --- getCredentials ---

  describe('getCredentials', () => {
    it('deberia leer y descifrar las credenciales de un tenant existente', async () => {
      prismaMain.tenant.findUnique.mockResolvedValue({
        id: TENANT_ID,
        databaseUser: USERNAME,
        databasePasswordEncrypted: ENCRYPTED_PASSWORD,
      });

      const result = await service.getCredentials(TENANT_ID);

      // Debe buscar el tenant
      expect(prismaMain.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: TENANT_ID },
        select: {
          databaseUser: true,
          databasePasswordEncrypted: true,
        },
      });

      // Debe descifrar la contrasena
      expect(encryptionService.decrypt).toHaveBeenCalledWith(ENCRYPTED_PASSWORD);

      // Debe retornar las credenciales descifradas
      expect(result).toEqual({
        username: USERNAME,
        password: PASSWORD,
      });
    });

    it('deberia retornar null si el tenant no existe', async () => {
      prismaMain.tenant.findUnique.mockResolvedValue(null);

      const result = await service.getCredentials(TENANT_ID);

      expect(result).toBeNull();
      expect(encryptionService.decrypt).not.toHaveBeenCalled();
    });

    it('deberia retornar null si el tenant no tiene credenciales almacenadas', async () => {
      prismaMain.tenant.findUnique.mockResolvedValue({
        id: TENANT_ID,
        databaseUser: null,
        databasePasswordEncrypted: null,
      });

      const result = await service.getCredentials(TENANT_ID);

      expect(result).toBeNull();
      expect(encryptionService.decrypt).not.toHaveBeenCalled();
    });

    it('deberia retornar null si solo tiene username pero no contrasena cifrada', async () => {
      prismaMain.tenant.findUnique.mockResolvedValue({
        id: TENANT_ID,
        databaseUser: USERNAME,
        databasePasswordEncrypted: null,
      });

      const result = await service.getCredentials(TENANT_ID);

      expect(result).toBeNull();
      expect(encryptionService.decrypt).not.toHaveBeenCalled();
    });
  });

  // --- getConnectionCredentials (TenantCredentialProvider) ---

  describe('getConnectionCredentials', () => {
    it('deberia delegar a getCredentials y retornar el mismo resultado', async () => {
      prismaMain.tenant.findUnique.mockResolvedValue({
        id: TENANT_ID,
        databaseUser: USERNAME,
        databasePasswordEncrypted: ENCRYPTED_PASSWORD,
      });

      const result = await service.getConnectionCredentials(TENANT_ID);

      expect(result).toEqual({
        username: USERNAME,
        password: PASSWORD,
      });
    });

    it('deberia retornar null cuando getCredentials retorna null', async () => {
      prismaMain.tenant.findUnique.mockResolvedValue(null);

      const result = await service.getConnectionCredentials(TENANT_ID);

      expect(result).toBeNull();
    });
  });
});
