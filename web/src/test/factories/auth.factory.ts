// Factories de datos de autenticación.
// Producen objetos que pasan los Zod schemas de auth.schemas.ts.
// Defaults deterministas — sin faker — para reproducibilidad.
// UUIDs generados con formato v4 determinista basado en contador.

import type {
  UserInfo,
  TenantInfo,
  LoginResponse,
  TenantSelectorResponse,
  UserProfile,
  AuthTokens,
} from '@/features/auth/schemas/auth.schemas';

let userCounter = 0;
let tenantCounter = 0;

/**
 * Genera un UUID v4 determinista basado en un prefijo y contador.
 * Formato: xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx
 */
function deterministicUuid(prefix: string, counter: number): string {
  const hex = counter.toString(16).padStart(12, '0');
  const pfx = prefix.padEnd(8, '0').slice(0, 8);
  return `${pfx}-0000-4000-8000-${hex}`;
}

/**
 * Construye un UserInfo con defaults deterministas.
 * Cada llamada incrementa el counter para IDs únicos.
 */
export function buildUser(overrides?: Partial<UserInfo>): UserInfo {
  userCounter++;
  return {
    id: deterministicUuid('a0000001', userCounter),
    email: `user${userCounter}@club.es`,
    name: `User ${userCounter}`,
    ...overrides,
  };
}

/**
 * Construye un TenantInfo con defaults deterministas.
 */
export function buildTenant(overrides?: Partial<TenantInfo>): TenantInfo {
  tenantCounter++;
  return {
    id: deterministicUuid('b0000001', tenantCounter),
    name: `Club Test ${tenantCounter}`,
    slug: `club-test-${tenantCounter}`,
    ...overrides,
  };
}

/**
 * Construye AuthTokens.
 */
export function buildAuthTokens(overrides?: Partial<AuthTokens>): AuthTokens {
  return {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 3600,
    ...overrides,
  };
}

/**
 * Construye una LoginResponse (login directo, un solo tenant).
 */
export function buildLoginResponse(overrides?: Partial<LoginResponse>): LoginResponse {
  const user = buildUser();
  const tenant = buildTenant();
  return {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 3600,
    user,
    tenant,
    role: 'admin',
    ...overrides,
  };
}

/**
 * Construye una TenantSelectorResponse (login multi-tenant).
 */
export function buildTenantSelectorResponse(
  overrides?: Partial<TenantSelectorResponse>,
): TenantSelectorResponse {
  return {
    requiresTenantSelection: true as const,
    tenants: [
      { ...buildTenant(), role: 'admin' },
      { ...buildTenant(), role: 'member' },
    ],
    ...overrides,
  };
}

/**
 * Construye un UserProfile completo (respuesta de GET /v1/auth/me).
 */
export function buildUserProfile(overrides?: Partial<UserProfile>): UserProfile {
  const user = buildUser();
  const tenant = buildTenant();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    currentTenant: tenant,
    role: 'admin',
    permissions: ['*'],
    ...overrides,
  };
}

/**
 * Resetea los contadores de factories.
 * Útil en beforeEach si se necesitan IDs predecibles.
 */
export function resetAuthCounters(): void {
  userCounter = 0;
  tenantCounter = 0;
}
