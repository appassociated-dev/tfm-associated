/**
 * Puerto de aplicación para persistir y recuperar credenciales de BD de tenant.
 * Identity BC es propietario del ciclo de vida de las credenciales.
 *
 * Las credenciales se cifran con AES-256-GCM antes de almacenarse (RNF-006).
 * Cada tenant tiene su propio usuario y contraseña de BD (RNF-004, ADR-002).
 */
export interface TenantCredentialPort {
  /**
   * Cifra la contraseña y persiste username + contraseña cifrada en DB-Main.
   * @param tenantId ID del tenant (UUID).
   * @param username Nombre de usuario de PostgreSQL del tenant.
   * @param password Contraseña en texto plano (será cifrada antes de persistir).
   */
  persistCredentials(tenantId: string, username: string, password: string): Promise<void>;

  /**
   * Recupera y descifra las credenciales de BD de un tenant.
   * @param tenantId ID del tenant (UUID).
   * @returns Credenciales descifradas o null si no existen.
   */
  getCredentials(tenantId: string): Promise<{ username: string; password: string } | null>;
}

/** Token de inyeccion para el puerto TenantCredentialPort (NestJS DI). */
export const TENANT_CREDENTIAL_PORT = Symbol('TENANT_CREDENTIAL_PORT');
