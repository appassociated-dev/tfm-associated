import { z } from 'zod';

// === Schemas base reutilizables ===

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export const userInfoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
});

export const tenantInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
});

// === Schemas de request ===

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// === Schemas de respuesta ===

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: userInfoSchema,
  tenant: tenantInfoSchema,
  role: z.string(),
});

export const tenantSelectorResponseSchema = z.object({
  requiresTenantSelection: z.literal(true),
  tenants: z.array(tenantInfoSchema.extend({ role: z.string() })),
});

export const userProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  currentTenant: tenantInfoSchema,
  role: z.string(),
  permissions: z.array(z.string()),
});

// === Tipos inferidos ===

export type AuthTokens = z.infer<typeof authTokensSchema>;
export type UserInfo = z.infer<typeof userInfoSchema>;
export type TenantInfo = z.infer<typeof tenantInfoSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type TenantSelectorResponse = z.infer<typeof tenantSelectorResponseSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;

// === Union type para respuesta de login ===
export type LoginApiResponse = LoginResponse | TenantSelectorResponse;

// === Type guard ===
export function isTenantSelectorResponse(
  response: LoginApiResponse,
): response is TenantSelectorResponse {
  return 'requiresTenantSelection' in response && response.requiresTenantSelection === true;
}
