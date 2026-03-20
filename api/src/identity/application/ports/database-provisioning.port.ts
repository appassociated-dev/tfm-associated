/** Parámetros para la creación del usuario administrador en una BD de tenant. */
export interface CreateAdminUserParams {
  databaseUrl: string;
  email: string;
  name: string;
  passwordHash: string;
  roleId: string;
}

/**
 * Puerto de salida para el servicio de provisión de bases de datos de tenant.
 * Abstrae las operaciones DDL de PostgreSQL (CREATE DATABASE, CREATE USER, migrations, etc.).
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface DatabaseProvisioningPort {
  /** Crea una nueva base de datos para el tenant. */
  createDatabase(databaseName: string): Promise<void>;

  /** Crea un usuario de PostgreSQL específico para el tenant. */
  createDatabaseUser(
    databaseName: string,
    tenantId: string,
  ): Promise<{ username: string; password: string }>;

  /** Otorga permisos al usuario del tenant sobre su base de datos. */
  grantPermissions(databaseName: string, username: string): Promise<void>;

  /**
   * Otorga permisos a nivel de schema al usuario del tenant sobre las tablas
   * ya existentes en su BD. Debe ejecutarse DESPUÉS de runMigrations para que
   * las tablas creadas por las migraciones sean accesibles.
   */
  grantSchemaPermissions(databaseName: string, username: string): Promise<void>;

  /** Ejecuta las migraciones del schema tenant en la base de datos indicada. */
  runMigrations(databaseUrl: string): Promise<void>;

  /** Seedea los roles predefinidos (Presidente, Secretario, etc.) en la BD del tenant. */
  seedRoles(databaseUrl: string): Promise<void>;

  /** Crea el usuario administrador inicial en la BD del tenant. Retorna el userId creado. */
  createAdminUser(params: CreateAdminUserParams): Promise<string>;

  /** Ejecuta rollback: elimina BD y usuario del tenant en caso de fallo. */
  rollback(databaseName: string, username?: string): Promise<void>;

  /** Construye la URL de conexión a la base de datos del tenant. */
  buildDatabaseUrl(databaseName: string, username: string, password: string): string;
}

/** Token de inyección para el puerto DatabaseProvisioningPort (NestJS DI). */
export const DATABASE_PROVISIONING_PORT = Symbol('DATABASE_PROVISIONING_PORT');
