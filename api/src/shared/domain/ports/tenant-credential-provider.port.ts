/**
 * Puerto de dominio compartido para que consumidores (PrismaTenantService)
 * obtengan credenciales de conexion de un tenant sin depender de Identity BC.
 *
 * Interfaz mas simple que TenantCredentialPort: solo lectura de credenciales.
 * La implementacion concreta (en Identity) implementa ambos puertos.
 */
export interface TenantCredentialProvider {
  /**
   * Obtiene las credenciales de conexion a la BD de un tenant.
   * @param tenantId ID del tenant (UUID).
   * @returns Credenciales descifradas o null si no existen.
   */
  getConnectionCredentials(
    tenantId: string,
  ): Promise<{ username: string; password: string } | null>;
}

/** Token de inyeccion para el puerto TenantCredentialProvider (NestJS DI). */
export const TENANT_CREDENTIAL_PROVIDER = Symbol('TENANT_CREDENTIAL_PROVIDER');
