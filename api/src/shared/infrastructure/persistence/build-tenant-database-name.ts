/**
 * Fuente de verdad para la convención de nombres de bases de datos de tenant.
 * Formato: associated_{uuid_con_underscores}
 *
 * Usado por:
 * - Tenant.create() para generar el databaseName del aggregate.
 * - PrismaTenantService para resolver la conexión a la BD del tenant.
 *
 * NO valida UUID (OQ1): este es un boundary interno,
 * el UUID ya fue validado en el Value Object TenantId.
 */
export function buildTenantDatabaseName(tenantId: string): string {
  return `associated_${tenantId.replace(/-/g, '_')}`;
}
