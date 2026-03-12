/**
 * Error de dominio lanzado cuando falla el proceso de provisión de un tenant.
 * Almacena el paso donde ocurrió el fallo y la causa original.
 */
export class TenantProvisioningFailedError extends Error {
  /** Código identificador del error para manejo programático. */
  readonly code = 'TENANT.PROVISIONING_FAILED';

  /** Paso de la saga donde ocurrió el fallo. */
  readonly step: string;

  /** Error original que causó el fallo. */
  override readonly cause: Error;

  constructor(step: string, cause: Error) {
    super(`Tenant provisioning failed at step '${step}': ${cause.message}`);
    this.name = 'TenantProvisioningFailedError';
    this.step = step;
    this.cause = cause;
  }
}
