/**
 * Error de dominio lanzado cuando un usuario intenta acceder a un tenant
 * en el que no tiene membresía activa.
 */
export class TenantAccessDeniedError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'AUTH.TENANT_ACCESS_DENIED';

  constructor(tenantId: string) {
    super(`Acceso denegado al tenant '${tenantId}'. El usuario no tiene membresía activa.`);
    this.name = 'TenantAccessDeniedError';
  }
}
