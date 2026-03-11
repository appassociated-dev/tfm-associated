import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { v4 as uuidV4 } from 'uuid';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';
import {
  DatabaseProvisioningPort,
  CreateAdminUserParams,
} from '../../application/ports/database-provisioning.port';

/** Longitud máxima de un identificador PostgreSQL. */
const PG_MAX_IDENTIFIER_LENGTH = 63;

/** Permisos predefinidos por rol de sistema. */
const SYSTEM_ROLES = [
  {
    code: 'PRESIDENT',
    name: 'Presidente',
    description: 'Rol de presidente con todos los permisos',
    permissions: ['*'],
  },
  {
    code: 'SECRETARY',
    name: 'Secretario',
    description: 'Rol de secretario con permisos de membresía, documentos y comunicación',
    permissions: ['membership:*', 'documents:*', 'communication:*'],
  },
  {
    code: 'TREASURER',
    name: 'Tesorero',
    description: 'Rol de tesorero con permisos de tesorería y lectura de miembros',
    permissions: ['treasury:*', 'membership:members:read'],
  },
  {
    code: 'BOARD_MEMBER',
    name: 'Vocal',
    description: 'Rol de vocal con permisos configurables',
    permissions: [],
  },
  {
    code: 'MEMBER',
    name: 'Socio',
    description: 'Rol de socio con permisos básicos de lectura propia',
    permissions: ['membership:members:read:own', 'treasury:payments:read:own'],
  },
];

/**
 * Servicio de infraestructura que implementa las operaciones DDL de PostgreSQL
 * para la provisión de bases de datos de tenant (ADR-002).
 *
 * Operaciones incluidas:
 * - Creación y eliminación de bases de datos
 * - Creación de usuarios PostgreSQL con permisos limitados
 * - Ejecución de migraciones Prisma
 * - Seed de roles predefinidos
 * - Creación de usuario administrador inicial
 * - Rollback completo en caso de fallo
 */
@Injectable()
export class DatabaseProvisioningService implements DatabaseProvisioningPort {
  private readonly logger = new Logger(DatabaseProvisioningService.name);

  constructor(private readonly prisma: PrismaMainService) {}

  /**
   * Crea una nueva base de datos PostgreSQL para el tenant.
   * CREATE DATABASE no puede ejecutarse dentro de una transacción.
   */
  async createDatabase(databaseName: string): Promise<void> {
    this.validateIdentifier(databaseName);

    this.logger.log(`Creando base de datos: ${databaseName}`);

    await this.prisma.$queryRawUnsafe(`CREATE DATABASE "${databaseName}"`);

    this.logger.log(`Base de datos creada: ${databaseName}`);
  }

  /**
   * Crea un usuario PostgreSQL específico para el tenant.
   * Genera una contraseña criptográficamente segura.
   */
  async createDatabaseUser(
    databaseName: string,
    tenantId: string,
  ): Promise<{ username: string; password: string }> {
    const username = this.buildUsername(tenantId);
    const password = this.generateSecurePassword();

    this.validateIdentifier(username);
    this.logger.log(`Creando usuario de BD: ${username}`);

    // Escapar la contraseña para evitar inyección SQL
    const escapedPassword = password.replace(/'/g, "''");

    await this.prisma.$queryRawUnsafe(
      `CREATE USER "${username}" WITH PASSWORD '${escapedPassword}'`,
    );

    this.logger.log(`Usuario de BD creado: ${username}`);

    return { username, password };
  }

  /**
   * Otorga permisos al usuario del tenant sobre su base de datos.
   * Revoca acceso a la BD principal para garantizar aislamiento (RNF-004).
   */
  async grantPermissions(databaseName: string, username: string): Promise<void> {
    this.validateIdentifier(databaseName);
    this.validateIdentifier(username);

    this.logger.log(`Otorgando permisos a ${username} sobre ${databaseName}`);

    await this.prisma.$queryRawUnsafe(
      `GRANT CONNECT ON DATABASE "${databaseName}" TO "${username}"`,
    );

    // Revocar acceso a la BD principal para aislamiento
    await this.prisma.$queryRawUnsafe(
      `REVOKE ALL ON DATABASE "associated_main" FROM "${username}"`,
    );

    this.logger.log(`Permisos otorgados a ${username}`);
  }

  /**
   * Ejecuta las migraciones del schema tenant en la base de datos indicada.
   * Usa prisma migrate deploy (no dev) para producción.
   */
  async runMigrations(databaseUrl: string): Promise<void> {
    this.logger.log('Ejecutando migraciones del schema tenant...');

    const prismaConfigPath = resolve(process.cwd(), 'prisma', 'tenant', 'prisma.config.ts');
    const migrationUrl = this.buildMigrationDatabaseUrl(databaseUrl);

    try {
      execSync(`npx prisma migrate deploy --config="${prismaConfigPath}"`, {
        env: {
          ...process.env,
          DATABASE_TENANT_URL: migrationUrl,
        },
        timeout: 60_000,
        stdio: 'pipe',
      });

      this.logger.log('Migraciones completadas');
    } catch (error) {
      const stderr =
        error instanceof Error && 'stderr' in error
          ? String((error as { stderr: unknown }).stderr)
          : 'unknown';
      this.logger.error(`Error en migraciones: ${stderr}`);
      throw new Error(`Failed to run migrations: ${stderr}`);
    }
  }

  /**
   * Seedea los roles predefinidos del sistema en la BD principal.
   * Los roles se asocian al tenant_id y son inmutables (is_system: true).
   * NOTA: Los roles se almacenan en la tabla Role de la BD principal,
   * vinculados al tenant mediante tenant_id.
   */
  async seedRoles(databaseUrl: string): Promise<void> {
    this.logger.log('Seedeando roles predefinidos...');

    // Extraer el tenantId de la URL de la BD no es viable,
    // así que se usa la BD principal para insertar roles.
    // El databaseUrl no se usa directamente aquí ya que los roles
    // van a la BD principal. El tenantId se extrae del nombre de la BD.
    const dbName = this.extractDatabaseName(databaseUrl);
    // El databaseName tiene formato associated_{tenantId_con_underscores}
    const tenantIdFromDb = dbName.replace('associated_', '').replace(/_/g, '-');

    // Verificar que el tenantId tiene formato UUID válido (8-4-4-4-12)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const tenantId = uuidRegex.test(tenantIdFromDb) ? tenantIdFromDb : undefined;

    for (const role of SYSTEM_ROLES) {
      const roleId = uuidV4();
      await this.prisma.role.create({
        data: {
          id: roleId,
          code: role.code,
          name: role.name,
          description: role.description,
          permissions: JSON.stringify(role.permissions),
          isSystem: true,
          tenantId: tenantId ?? null,
        },
      });
    }

    this.logger.log(`${SYSTEM_ROLES.length} roles predefinidos seedeados`);
  }

  /**
   * Crea el usuario administrador inicial en la BD principal.
   * Crea el User y la TenantMembership con rol PRESIDENT.
   */
  async createAdminUser(params: CreateAdminUserParams): Promise<string> {
    this.logger.log(`Creando usuario administrador: ${params.email}`);

    const userId = uuidV4();

    // Extraer tenantId del databaseUrl
    const dbName = this.extractDatabaseName(params.databaseUrl);
    const tenantIdFromDb = dbName.replace('associated_', '').replace(/_/g, '-');

    // Buscar el rol PRESIDENT para este tenant
    const presidentRole = await this.prisma.role.findFirst({
      where: {
        code: params.roleId,
        tenantId: tenantIdFromDb,
      },
    });

    if (!presidentRole) {
      throw new Error(`Role '${params.roleId}' not found for tenant`);
    }

    // Crear usuario + membresía en una sola transacción para evitar residuos parciales
    const membershipId = uuidV4();
    const prismaClient = this.prisma.client as any;
    await prismaClient.$transaction(async (tx: any) => {
      await tx.user.create({
        data: {
          id: userId,
          email: params.email,
          passwordHash: params.passwordHash,
          name: params.name,
          status: 'ACTIVE',
          failedAttempts: 0,
          failedAttemptTimestamps: [],
          createdAt: new Date(),
        },
      });

      await tx.tenantMembership.create({
        data: {
          id: membershipId,
          userId: userId,
          tenantId: tenantIdFromDb,
          roleId: presidentRole.id,
          assignedAt: new Date(),
          active: true,
        },
      });
    });

    this.logger.log(`Usuario administrador creado: ${userId}`);

    return userId;
  }

  /**
   * Ejecuta rollback completo: elimina BD y usuario PostgreSQL.
   * Todas las operaciones son idempotentes (IF EXISTS).
   */
  async rollback(databaseName: string, username?: string): Promise<void> {
    this.logger.warn(`Ejecutando rollback para BD: ${databaseName}`);

    // Paso 1: Eliminar base de datos
    try {
      await this.prisma.$queryRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
      this.logger.log(`BD eliminada: ${databaseName}`);
    } catch (error) {
      this.logger.error(`Error al eliminar BD ${databaseName}: ${(error as Error).message}`);
    }

    // Paso 2: Eliminar usuario (si se proporcionó)
    if (username) {
      try {
        await this.prisma.$queryRawUnsafe(`DROP USER IF EXISTS "${username}"`);
        this.logger.log(`Usuario eliminado: ${username}`);
      } catch (error) {
        this.logger.error(`Error al eliminar usuario ${username}: ${(error as Error).message}`);
      }
    }

    this.logger.warn('Rollback completado');
  }

  /**
   * Construye la URL de conexión PostgreSQL para una BD de tenant.
   * Extrae host y puerto de DATABASE_MAIN_URL o usa valores por defecto.
   */
  buildDatabaseUrl(databaseName: string, username: string, password: string): string {
    const mainUrl = process.env.DATABASE_MAIN_URL ?? '';
    let host = 'localhost';
    let port = '5432';

    // Extraer host:port de la URL principal si existe
    const urlMatch = mainUrl.match(/@([^:/?]+):?(\d+)?\//);
    if (urlMatch) {
      host = urlMatch[1];
      port = urlMatch[2] ?? '5432';
    }

    const encodedPassword = encodeURIComponent(password);

    return `postgresql://${username}:${encodedPassword}@${host}:${port}/${databaseName}`;
  }

  // --- Métodos privados auxiliares ---

  /**
   * Construye un nombre de usuario PostgreSQL a partir del tenantId.
   * Formato: tenant_{tenantId_con_underscores}
   * Trunca a 63 caracteres (límite de PostgreSQL).
   */
  private buildUsername(tenantId: string): string {
    const sanitized = tenantId.replace(/-/g, '_');
    const username = `tenant_${sanitized}`;

    return username.substring(0, PG_MAX_IDENTIFIER_LENGTH);
  }

  /**
   * Genera una contraseña criptográficamente segura.
   * 32 bytes codificados en base64 = ~43 caracteres.
   */
  private generateSecurePassword(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Valida que un identificador PostgreSQL no contenga caracteres peligrosos.
   * Solo permite alfanuméricos y guiones bajos.
   */
  private validateIdentifier(identifier: string): void {
    if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
      throw new Error(
        `Unsafe PostgreSQL identifier: "${identifier}". Only alphanumeric and underscores allowed.`,
      );
    }

    if (identifier.length > PG_MAX_IDENTIFIER_LENGTH) {
      throw new Error(
        `PostgreSQL identifier exceeds ${PG_MAX_IDENTIFIER_LENGTH} characters: "${identifier}"`,
      );
    }
  }

  /**
   * Extrae el nombre de la base de datos de una URL de conexión PostgreSQL.
   */
  private extractDatabaseName(databaseUrl: string): string {
    const match = databaseUrl.match(/\/([^/?]+)(\?|$)/);
    return match ? match[1] : '';
  }

  /**
   * Construye URL de migración con credenciales privilegiadas de DATABASE_MAIN_URL
   * manteniendo el nombre de BD del tenant destino.
   */
  private buildMigrationDatabaseUrl(tenantDatabaseUrl: string): string {
    const mainUrlRaw = process.env.DATABASE_MAIN_URL;
    if (!mainUrlRaw) {
      return tenantDatabaseUrl;
    }

    const tenantDbName = this.extractDatabaseName(tenantDatabaseUrl);
    if (!tenantDbName) {
      return tenantDatabaseUrl;
    }

    try {
      const migrationUrl = new URL(mainUrlRaw);
      migrationUrl.pathname = `/${tenantDbName}`;
      return migrationUrl.toString();
    } catch {
      return tenantDatabaseUrl;
    }
  }
}
