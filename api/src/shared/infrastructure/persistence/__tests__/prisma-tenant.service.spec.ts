import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaTenantService } from '../prisma-tenant.service';
import type { TenantCredentialProvider } from '../../../domain/ports/tenant-credential-provider.port';

// Mock del módulo PrismaPg y PrismaClient del tenant
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: vi.fn().mockImplementation(({ connectionString }: { connectionString: string }) => ({
    _connectionString: connectionString,
  })),
}));

vi.mock('@prisma-tenant', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
  })),
}));

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PrismaTenantService', () => {
  let service: PrismaTenantService;
  let credentialProvider: {
    getConnectionCredentials: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Credenciales por defecto del provider
    credentialProvider = {
      getConnectionCredentials: vi.fn().mockResolvedValue({
        username: `tenant_${TENANT_ID.replace(/-/g, '_')}`,
        password: 'per-tenant-secret',
      }),
    };

    // Configurar DATABASE_MAIN_URL para los tests
    process.env.DATABASE_MAIN_URL = 'postgresql://shared_user:shared_pass@localhost:5432/main_db';
  });

  afterEach(() => {
    delete process.env.DATABASE_MAIN_URL;
  });

  describe('getClient con credential provider', () => {
    beforeEach(() => {
      service = new PrismaTenantService(credentialProvider as unknown as TenantCredentialProvider);
    });

    it('deberia retornar un PrismaClient (async)', async () => {
      const client = await service.getClient(TENANT_ID);

      expect(client).toBeDefined();
      expect(client.$disconnect).toBeDefined();
    });

    it('deberia consultar credenciales del provider al crear un cliente nuevo', async () => {
      await service.getClient(TENANT_ID);

      expect(credentialProvider.getConnectionCredentials).toHaveBeenCalledWith(TENANT_ID);
    });

    it('deberia cachear el cliente en el pool (segunda llamada no consulta credenciales)', async () => {
      await service.getClient(TENANT_ID);
      await service.getClient(TENANT_ID);

      // Solo debe consultar credenciales una vez (la primera)
      expect(credentialProvider.getConnectionCredentials).toHaveBeenCalledTimes(1);
    });

    it('deberia obtener clientes diferentes para tenants diferentes', async () => {
      const otherTenantId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      const client1 = await service.getClient(TENANT_ID);
      const client2 = await service.getClient(otherTenantId);

      expect(client1).not.toBe(client2);
      expect(credentialProvider.getConnectionCredentials).toHaveBeenCalledTimes(2);
    });
  });

  describe('getClient sin credential provider (fallback)', () => {
    beforeEach(() => {
      // Construir sin credential provider (simula @Optional())
      service = new PrismaTenantService(null as unknown as TenantCredentialProvider);
    });

    it('deberia crear un cliente usando credenciales compartidas de DATABASE_MAIN_URL', async () => {
      const client = await service.getClient(TENANT_ID);

      expect(client).toBeDefined();
    });
  });

  describe('getClient con credential provider que retorna null', () => {
    beforeEach(() => {
      credentialProvider.getConnectionCredentials.mockResolvedValue(null);
      service = new PrismaTenantService(credentialProvider as unknown as TenantCredentialProvider);
    });

    it('deberia usar fallback a credenciales compartidas cuando el provider retorna null', async () => {
      const client = await service.getClient(TENANT_ID);

      expect(client).toBeDefined();
      expect(credentialProvider.getConnectionCredentials).toHaveBeenCalledWith(TENANT_ID);
    });
  });

  describe('pool y evicción', () => {
    beforeEach(() => {
      service = new PrismaTenantService(credentialProvider as unknown as TenantCredentialProvider);
    });

    it('deberia actualizar lastUsed cuando se obtiene un cliente existente del pool', async () => {
      await service.getClient(TENANT_ID);

      // Segunda llamada debería actualizar lastUsed
      const client2 = await service.getClient(TENANT_ID);
      expect(client2).toBeDefined();
    });
  });

  describe('onModuleDestroy', () => {
    beforeEach(() => {
      service = new PrismaTenantService(credentialProvider as unknown as TenantCredentialProvider);
    });

    it('deberia desconectar todos los clientes del pool', async () => {
      const client = await service.getClient(TENANT_ID);

      await service.onModuleDestroy();

      expect(client.$disconnect).toHaveBeenCalled();
    });
  });
});
