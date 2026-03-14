import { z } from 'zod';
import { httpClient } from '@/shared/api/http-client';
import {
  authTokensSchema,
  loginResponseSchema,
  tenantInfoSchema,
  tenantSelectorResponseSchema,
  userProfileSchema,
  type LoginRequest,
  type LoginResponse,
  type LoginApiResponse,
  type AuthTokens,
  type TenantInfo,
  type UserProfile,
} from '../schemas/auth.schemas';

const AUTH_BASE = '/v1/auth';

/**
 * Autentica usuario con email y password.
 * Puede devolver tokens directos (1 tenant) o selector de tenants (múltiples).
 */
export async function login(credentials: LoginRequest): Promise<LoginApiResponse> {
  const { data } = await httpClient.post(`${AUTH_BASE}/login`, credentials);

  const payload = data.data ?? data;

  // Intentar parsear como login directo primero
  const directResult = loginResponseSchema.safeParse(payload);
  if (directResult.success) return directResult.data;

  // Si no, intentar como selector de tenant
  const selectorResult = tenantSelectorResponseSchema.safeParse(payload);
  if (selectorResult.success) return selectorResult.data;

  // Si ninguno coincide, lanzar error con detalle
  throw new Error(
    `Respuesta de login no coincide con ningún schema esperado: ${JSON.stringify(directResult.error.issues)}`,
  );
}

/**
 * Selecciona tenant tras login multi-tenant.
 */
export async function selectTenant(tenantId: string): Promise<LoginResponse> {
  const { data } = await httpClient.post(`${AUTH_BASE}/select-tenant`, {
    tenantId,
  });
  return loginResponseSchema.parse(data.data ?? data);
}

/**
 * Renueva tokens usando refresh token.
 */
export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const { data } = await httpClient.post(`${AUTH_BASE}/refresh`, {
    refreshToken,
  });
  return authTokensSchema.parse(data.data ?? data);
}

/**
 * Cierra sesión invalidando refresh token.
 */
export async function logout(refreshToken: string): Promise<void> {
  await httpClient.post(`${AUTH_BASE}/logout`, { refreshToken });
}

/**
 * Cambia de tenant sin re-autenticación.
 */
export async function switchTenant(tenantId: string): Promise<LoginResponse> {
  const { data } = await httpClient.post(`${AUTH_BASE}/switch-tenant`, {
    tenantId,
  });
  return loginResponseSchema.parse(data.data ?? data);
}

/**
 * Obtiene perfil del usuario autenticado.
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const { data } = await httpClient.get(`${AUTH_BASE}/me`);
  return userProfileSchema.parse(data.data ?? data);
}

/** Schema para la respuesta de tenants del usuario con rol. */
const myTenantsSchema = z.array(tenantInfoSchema.extend({ role: z.string() }));

/**
 * Obtiene la lista de colectividades a las que pertenece el usuario.
 * Usado en el modal de cambio de tenant.
 */
export async function getMyTenants(): Promise<Array<TenantInfo & { role: string }>> {
  const { data } = await httpClient.get(`${AUTH_BASE}/me/tenants`);
  return myTenantsSchema.parse(data.data ?? data);
}
