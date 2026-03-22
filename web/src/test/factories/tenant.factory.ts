// Factory de tenant — re-exporta desde auth.factory para mantener
// la API pública documentada en el diseño (import desde factories/tenant).
// Los tenants son parte del dominio de auth en el schema real.

export { buildTenant } from './auth.factory';
