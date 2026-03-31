/**
 * Claves centralizadas de localStorage.
 * Fuente unica de verdad — prohibido usar literales string en el resto del codigo.
 */
export const STORAGE_KEYS = {
  REFRESH_TOKEN: 'associated_refresh_token',
  TENANT_ID: 'associated_tenant_id',
  LAST_TENANT: 'associated_last_tenant',
} as const;
