import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { ProvisionTenantHandler } from '../application/commands/provision-tenant.handler';
import { ProvisionTenantCommand } from '../application/commands/provision-tenant.command';
import { TenantProvisionedResponseDto } from '../application/dtos/tenant-provisioned-response.dto';
import { CifAlreadyExistsError } from '../domain/exceptions/cif-already-exists.error';
import { TenantProvisioningFailedError } from '../domain/exceptions/tenant-provisioning-failed.error';
import type { DatabaseProvisioningPort } from '../application/ports/database-provisioning.port';
import type { TenantCredentialPort } from '../application/ports/tenant-credential.port';
import type { ErrorReporter } from '../../shared/domain';
import { PrismaMainService } from '../../shared/infrastructure/persistence/prisma-main.service';
import { PrismaTenantRepository } from '../infrastructure/persistence/prisma-tenant.repository';
import { DatabaseProvisioningService } from '../infrastructure/services/database-provisioning.service';

/**
 * URL de conexión a PostgreSQL para tests de integración.
 * Se lee de la variable de entorno o se usa la configuración por defecto de Docker Compose.
 */
const DATABASE_MAIN_URL =
  process.env.DATABASE_MAIN_URL ??
  'postgresql://associated:associated_dev@localhost:5432/associated_main';

/**
 * Comprueba si PostgreSQL está disponible intentando una conexión.
 * Retorna true si la BD responde, false si no.
 */
async function isPostgresAvailable(): Promise<boolean> {
  const { PrismaClient } = await import('@prisma-main');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString: DATABASE_MAIN_URL });
  const client = new PrismaClient({ adapter });
  try {
    await client.$connect();
    await client.$disconnect();
    return true;
  } catch {
    return false;
  }
}

async function ensureMainSchemaUpToDate(prisma: PrismaMainService): Promise<void> {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "failed_attempt_timestamps" JSONB NOT NULL DEFAULT '[]'::jsonb`,
  );
}

/**
 * Helper para limpiar recursos creados durante los tests.
 * Elimina tenant, roles, usuarios y membresías asociadas.
 */
async function cleanupTenant(
  prisma: PrismaMainService,
  tenantId: string,
  databaseName: string,
  username?: string,
): Promise<void> {
  try {
    // Eliminar membresías
    await prisma.tenantMembership.deleteMany({
      where: { tenantId: tenantId },
    });
    // Eliminar roles
    await prisma.role.deleteMany({
      where: { tenantId: tenantId },
    });
    // Eliminar tenant
    await prisma.tenant.deleteMany({
      where: { id: tenantId },
    });
    // Eliminar usuarios creados durante el test
    // (los usuarios no tienen tenantId directo, se limpian por membresía)
  } catch {
    // Ignorar errores de limpieza
  }

  // Eliminar BD y usuario PostgreSQL
  try {
    await prisma.$queryRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
  } catch {
    // Ignorar si no existe
  }

  if (username) {
    try {
      await prisma.$queryRawUnsafe(`DROP USER IF EXISTS "${username}"`);
    } catch {
      // Ignorar si no existe
    }
  }
}

async function cleanupKnownProvisioningFixtures(prisma: PrismaMainService): Promise<void> {
  const emails = [
    'admin-A28015550@test.es',
    'admin-G33340241@test.es',
    'admin-B65410011@test.es',
    'admin-Q0801175A@test.es',
    'admin-S0800001J@test.es',
    'otro-admin@test.es',
  ];
  const cifs = ['A28015550', 'G33340241', 'B65410011', 'Q0801175A', 'S0800001J'];

  await prisma.tenantMembership.deleteMany({
    where: {
      OR: emails.map((email) => ({ user: { email } })),
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: { in: emails },
    },
  });
  const tenants = await (
    prisma.tenant as unknown as {
      findMany: (args: Record<string, unknown>) => Promise<{ id: string }[]>;
    }
  ).findMany({
    where: { cif: { in: cifs } },
    select: { id: true },
  });

  await prisma.role.deleteMany({
    where: {
      tenantId: {
        in: tenants.map((tenant: { id: string }) => tenant.id),
      },
    },
  });
  await prisma.tenant.deleteMany({
    where: { cif: { in: cifs } },
  });
}

/**
 * Tests de integración para el flujo completo de provisión de tenant (UC-001).
 *
 * Requiere PostgreSQL corriendo (Docker Compose).
 * Ejecutar con: npm run test:integration -w api
 *
 * Las pruebas verifican el flujo real contra la BD:
 * - Creación de BD aislada por tenant
 * - Creación de usuario PostgreSQL con permisos limitados
 * - Seed de roles predefinidos
 * - Creación de usuario admin
 * - Rollback ante fallos
 * - Rechazo de CIF duplicado
 */
describe('TenantProvisioning Integration', () => {
  let prisma: PrismaMainService;
  let handler: ProvisionTenantHandler;
  let dbProvisioningService: DatabaseProvisioningService;

  // Recursos para limpieza
  const createdTenants: {
    tenantId: string;
    databaseName: string;
    username?: string;
    adminUserId?: string;
  }[] = [];

  beforeAll(async () => {
    // Verificar disponibilidad de PostgreSQL
    const pgAvailable = await isPostgresAvailable();
    if (!pgAvailable) {
      console.warn('PostgreSQL not available — skipping integration tests');
      return;
    }

    // Configurar la variable de entorno para PrismaMainService
    process.env.DATABASE_MAIN_URL = DATABASE_MAIN_URL;

    prisma = new PrismaMainService();
    await prisma.$connect();
    await ensureMainSchemaUpToDate(prisma);
    await cleanupKnownProvisioningFixtures(prisma);

    dbProvisioningService = new DatabaseProvisioningService(prisma);

    const errorReporter: ErrorReporter = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
    };

    const tenantRepository = new PrismaTenantRepository(prisma);

    // Mock de TenantCredentialPort — en integración no ciframos credenciales
    const tenantCredentialPort: TenantCredentialPort = {
      persistCredentials: vi.fn().mockResolvedValue(undefined),
      getCredentials: vi.fn().mockResolvedValue(null),
    };

    handler = new ProvisionTenantHandler(
      tenantRepository,
      dbProvisioningService as unknown as DatabaseProvisioningPort,
      tenantCredentialPort,
      errorReporter,
    );
  });

  afterAll(async () => {
    // Limpiar todos los recursos creados durante los tests
    for (const resource of createdTenants) {
      await cleanupTenant(prisma, resource.tenantId, resource.databaseName, resource.username);

      // Limpiar usuario admin si existe
      if (resource.adminUserId) {
        try {
          await prisma.user.deleteMany({
            where: { id: resource.adminUserId },
          });
        } catch {
          // Ignorar
        }
      }
    }

    await prisma.$disconnect();
  });

  /**
   * Crea un comando válido con CIF único para cada test.
   */
  function createValidCommand(cif: string): ProvisionTenantCommand {
    return new ProvisionTenantCommand(
      `Peña Test ${cif}`,
      'PENA',
      cif,
      `contacto-${cif}@test.es`,
      'Admin Test',
      `admin-${cif}@test.es`,
      'SecurePass123!',
    );
  }

  // ====================================================================
  // Test 1: Flujo completo de provisión (happy path)
  // ====================================================================
  it('should provision a tenant with isolated database', async () => {
    const command = createValidCommand('A28015550');
    const result = await handler.execute(command);

    // Registrar para limpieza
    const tenantId = result.tenantId;
    const databaseName = `associated_${tenantId.replace(/-/g, '_')}`;
    const username = `tenant_${tenantId.replace(/-/g, '_')}`;
    createdTenants.push({
      tenantId,
      databaseName,
      username,
      adminUserId: result.adminUserId,
    });

    // Verificar respuesta
    expect(result).toBeInstanceOf(TenantProvisionedResponseDto);
    expect(result.tenantId).toBeDefined();
    expect(result.slug).toBe('pena-test-a28015550');
    expect(result.adminUserId).toBeDefined();

    // Verificar: tenant guardado en la BD principal
    const savedTenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    expect(savedTenant).not.toBeNull();
    expect(savedTenant!.name).toBe('Peña Test A28015550');
    expect(savedTenant!.cif).toBe('A28015550');
    expect(savedTenant!.status).toBe('ACTIVE');

    // Verificar: base de datos del tenant creada (intentar conectar)
    const dbExists = await prisma.$queryRawUnsafe<Record<string, boolean>[]>(
      `SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${databaseName}')`,
    );
    expect(dbExists[0]?.exists ?? dbExists[0]?.['exists']).toBe(true);

    // Verificar: usuario PostgreSQL creado
    const userExists = await prisma.$queryRawUnsafe<Record<string, boolean>[]>(
      `SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${username}')`,
    );
    expect(userExists[0]?.exists ?? userExists[0]?.['exists']).toBe(true);

    // Verificar: 5 roles de sistema seedeados
    const roles = await prisma.role.findMany({
      where: { tenantId: tenantId },
    });
    expect(roles).toHaveLength(5);

    const roleCodes = roles.map((r) => r.code).sort();
    expect(roleCodes).toEqual(['BOARD_MEMBER', 'MEMBER', 'PRESIDENT', 'SECRETARY', 'TREASURER']);

    // Verificar: todos los roles son de sistema
    for (const role of roles) {
      expect(role.isSystem).toBe(true);
    }

    // Verificar: PRESIDENT tiene permiso '*'
    // permissions es Json en Prisma → Prisma lo devuelve como array nativo (Bug 3 fix)
    const presidentRole = roles.find((r) => r.code === 'PRESIDENT');
    expect(presidentRole).toBeDefined();
    expect(presidentRole!.permissions).toContain('*');

    // Verificar: usuario admin creado
    const adminUser = await prisma.user.findUnique({
      where: { id: result.adminUserId },
    });
    expect(adminUser).not.toBeNull();
    expect(adminUser!.email).toBe('admin-A28015550@test.es');
    expect(adminUser!.name).toBe('Admin Test');
    expect(adminUser!.status).toBe('ACTIVE');

    // Verificar: membresía con rol PRESIDENT
    const membership = await prisma.tenantMembership.findFirst({
      where: {
        userId: result.adminUserId,
        tenantId: tenantId,
      },
    });
    expect(membership).not.toBeNull();
    expect(membership!.roleId).toBe(presidentRole!.id);
    expect(membership!.active).toBe(true);
  }, 60_000);

  // ====================================================================
  // Test 2: Rechazo de CIF duplicado
  // ====================================================================
  it('should reject duplicate CIF', async () => {
    // Provisionar un primer tenant con CIF X
    const command1 = createValidCommand('G33340241');
    const result1 = await handler.execute(command1);

    const tenantId1 = result1.tenantId;
    const databaseName1 = `associated_${tenantId1.replace(/-/g, '_')}`;
    const username1 = `tenant_${tenantId1.replace(/-/g, '_')}`;
    createdTenants.push({
      tenantId: tenantId1,
      databaseName: databaseName1,
      username: username1,
      adminUserId: result1.adminUserId,
    });

    // Intentar provisionar otro tenant con el mismo CIF
    const command2 = new ProvisionTenantCommand(
      'Otra Peña Duplicada',
      'COFRADIA',
      'G33340241', // Mismo CIF
      'otro@test.es',
      'Otro Admin',
      'otro-admin@test.es',
      'OtraPass456!',
    );

    await expect(handler.execute(command2)).rejects.toThrow(CifAlreadyExistsError);

    // Verificar que NO se creó una BD huérfana
    // (el error se lanza antes de crear BD, así que no debería existir ninguna nueva)
    const tenantsWithCif = await prisma.tenant.findMany({
      where: { cif: 'G33340241' },
    });
    expect(tenantsWithCif).toHaveLength(1);
    expect(tenantsWithCif[0].id).toBe(tenantId1);
  }, 60_000);

  // ====================================================================
  // Test 3: Rollback ante fallo
  // ====================================================================
  it('should rollback on provisioning failure', async () => {
    // Crear un handler con un servicio de provisión parcialmente mockeado
    // que falla en seedRoles
    const errorReporter: ErrorReporter = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      setUser: vi.fn(),
      setContext: vi.fn(),
    };

    const failingDbService: DatabaseProvisioningPort = {
      createDatabase: dbProvisioningService.createDatabase.bind(dbProvisioningService),
      createDatabaseUser: dbProvisioningService.createDatabaseUser.bind(dbProvisioningService),
      grantPermissions: dbProvisioningService.grantPermissions.bind(dbProvisioningService),
      grantSchemaPermissions:
        dbProvisioningService.grantSchemaPermissions.bind(dbProvisioningService),
      runMigrations: dbProvisioningService.runMigrations.bind(dbProvisioningService),
      buildDatabaseUrl: dbProvisioningService.buildDatabaseUrl.bind(dbProvisioningService),
      // seedRoles falla a propósito para provocar rollback
      seedRoles: async () => {
        throw new Error('Simulated seedRoles failure');
      },
      createAdminUser: dbProvisioningService.createAdminUser.bind(dbProvisioningService),
      rollback: dbProvisioningService.rollback.bind(dbProvisioningService),
    };

    const tenantRepository = new PrismaTenantRepository(prisma);
    const failingCredentialPort: TenantCredentialPort = {
      persistCredentials: vi.fn().mockResolvedValue(undefined),
      getCredentials: vi.fn().mockResolvedValue(null),
    };
    const failingHandler = new ProvisionTenantHandler(
      tenantRepository,
      failingDbService,
      failingCredentialPort,
      errorReporter,
    );

    const command = createValidCommand('B65410011');

    await expect(failingHandler.execute(command)).rejects.toThrow(TenantProvisioningFailedError);

    // Verificar que errorReporter fue llamado
    expect(errorReporter.captureException).toHaveBeenCalledOnce();

    // Verificar que no quedó BD huérfana
    // No sabemos el tenantId exacto, pero podemos verificar que no hay tenant con ese CIF
    const orphanTenant = await prisma.tenant.findFirst({
      where: { cif: 'B65410011' },
    });
    expect(orphanTenant).toBeNull();

    // Verificar que la BD fue eliminada (rollback)
    // Buscamos BDs que empiecen con associated_ para este CIF (no debería quedar ninguna nueva)
    const databases = await prisma.$queryRawUnsafe<{ datname: string }[]>(
      `SELECT datname FROM pg_database WHERE datname LIKE 'associated_%' AND datname != 'associated_main'`,
    );

    // Ninguna de las BDs debería corresponder a un tenant con CIF A12345678
    // (ya que el rollback las elimina)
    for (const db of databases) {
      // Reconstruir posible tenantId
      const possibleId = db.datname.replace('associated_', '').replace(/_/g, '-');
      const possibleTenant = await prisma.tenant.findUnique({
        where: { id: possibleId },
      });
      // Si existe un tenant para esta BD, no debería tener CIF A12345678
      if (possibleTenant) {
        expect(possibleTenant.cif).not.toBe('B65410011');
      }
    }
  }, 60_000);

  // ====================================================================
  // Test 4: Usuario PostgreSQL con permisos limitados
  // ====================================================================
  it('should create PostgreSQL user with limited permissions', async () => {
    const command = createValidCommand('Q0801175A');
    const result = await handler.execute(command);

    const tenantId = result.tenantId;
    const databaseName = `associated_${tenantId.replace(/-/g, '_')}`;
    const username = `tenant_${tenantId.replace(/-/g, '_')}`;
    createdTenants.push({
      tenantId,
      databaseName,
      username,
      adminUserId: result.adminUserId,
    });

    // Verificar que el usuario tiene CONNECT sobre su BD
    const grants = await prisma.$queryRawUnsafe<Record<string, boolean>[]>(
      `SELECT has_database_privilege('${username}', '${databaseName}', 'CONNECT') AS has_database_privilege`,
    );
    expect(grants[0]?.has_database_privilege ?? grants[0]?.['has_database_privilege']).toBe(true);

    // PostgreSQL concede CONNECT a traves de PUBLIC por defecto, por lo que
    // la comprobacion relevante sin alterar la configuracion global es que
    // el usuario no reciba privilegios de administracion sobre associated_main.
    const mainGrants = await prisma.$queryRawUnsafe<Record<string, boolean>[]>(
      `SELECT has_database_privilege('${username}', 'associated_main', 'CREATE') AS has_database_privilege`,
    );
    expect(mainGrants[0]?.has_database_privilege ?? mainGrants[0]?.['has_database_privilege']).toBe(
      false,
    );
  }, 60_000);

  // ====================================================================
  // Test 5: Seed de roles predefinidos correcto
  // ====================================================================
  it('should seed predefined roles correctly', async () => {
    const command = createValidCommand('S0800001J');
    const result = await handler.execute(command);

    const tenantId = result.tenantId;
    const databaseName = `associated_${tenantId.replace(/-/g, '_')}`;
    const username = `tenant_${tenantId.replace(/-/g, '_')}`;
    createdTenants.push({
      tenantId,
      databaseName,
      username,
      adminUserId: result.adminUserId,
    });

    // Consultar roles para este tenant
    const roles = await prisma.role.findMany({
      where: { tenantId: tenantId },
      orderBy: { code: 'asc' },
    });

    // Verificar: exactamente 5 roles
    expect(roles).toHaveLength(5);

    // Verificar: todos son de sistema
    for (const role of roles) {
      expect(role.isSystem).toBe(true);
    }

    // Verificar: PRESIDENT tiene todos los permisos ('*')
    // permissions es Json en Prisma → Prisma lo devuelve como array nativo (Bug 3 fix)
    const president = roles.find((r) => r.code === 'PRESIDENT');
    expect(president).toBeDefined();
    expect(president!.name).toBe('Presidente');
    expect(president!.permissions).toEqual(['*']);

    // Verificar: SECRETARY tiene permisos correctos
    const secretary = roles.find((r) => r.code === 'SECRETARY');
    expect(secretary).toBeDefined();
    expect(secretary!.permissions).toEqual(
      expect.arrayContaining(['membership:*', 'documents:*', 'communication:*']),
    );

    // Verificar: TREASURER tiene permisos correctos
    const treasurer = roles.find((r) => r.code === 'TREASURER');
    expect(treasurer).toBeDefined();
    expect(treasurer!.permissions).toEqual(
      expect.arrayContaining(['treasury:*', 'membership:members:read']),
    );

    // Verificar: BOARD_MEMBER tiene permisos vacíos (configurable)
    const boardMember = roles.find((r) => r.code === 'BOARD_MEMBER');
    expect(boardMember).toBeDefined();
    expect(boardMember!.permissions).toEqual([]);

    // Verificar: MEMBER tiene permisos básicos de lectura propia
    const member = roles.find((r) => r.code === 'MEMBER');
    expect(member).toBeDefined();
    expect(member!.permissions).toEqual(
      expect.arrayContaining(['membership:members:read:own', 'treasury:payments:read:own']),
    );
  }, 60_000);
});
