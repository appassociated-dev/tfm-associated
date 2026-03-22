// Handlers MSW para endpoints de autenticación (/v1/auth/*).
// Coinciden con las funciones de auth.api.ts y las URLs reales
// que httpClient (baseURL: /api) construye.

import { http, HttpResponse } from 'msw';
import {
  buildLoginResponse,
  buildAuthTokens,
  buildUserProfile,
} from '../../factories/auth.factory';
import { apiResponse } from '../utils';
import type { LoginResponse, UserProfile, AuthTokens } from '@/features/auth/schemas/auth.schemas';

// === Configuración de handlers ===

export interface AuthHandlerConfig {
  /** Respuesta de login. Si no se da, usa buildLoginResponse(). */
  loginResponse?: LoginResponse;
  /** Respuesta de select-tenant. Si no se da, usa buildLoginResponse(). */
  selectTenantResponse?: LoginResponse;
  /** Respuesta de switch-tenant. Si no se da, usa buildLoginResponse(). */
  switchTenantResponse?: LoginResponse;
  /** Respuesta de refresh. Si no se da, usa buildAuthTokens(). */
  refreshResponse?: AuthTokens;
  /** Respuesta de me. Si no se da, usa buildUserProfile(). */
  meResponse?: UserProfile;
}

/**
 * Crea handlers MSW para todos los endpoints de auth.
 * Los handlers devuelven respuestas happy-path por defecto.
 * Configurable via AuthHandlerConfig.
 */
export function createAuthHandlers(config: AuthHandlerConfig = {}) {
  return [
    // POST /api/v1/auth/login
    http.post('*/v1/auth/login', () => {
      const data = config.loginResponse ?? buildLoginResponse();
      return HttpResponse.json(apiResponse(data));
    }),

    // POST /api/v1/auth/select-tenant
    http.post('*/v1/auth/select-tenant', () => {
      const data = config.selectTenantResponse ?? buildLoginResponse();
      return HttpResponse.json(apiResponse(data));
    }),

    // POST /api/v1/auth/switch-tenant
    http.post('*/v1/auth/switch-tenant', () => {
      const data = config.switchTenantResponse ?? buildLoginResponse();
      return HttpResponse.json(apiResponse(data));
    }),

    // POST /api/v1/auth/refresh
    http.post('*/v1/auth/refresh', () => {
      const data = config.refreshResponse ?? buildAuthTokens();
      return HttpResponse.json(apiResponse(data));
    }),

    // POST /api/v1/auth/logout
    http.post('*/v1/auth/logout', () => {
      return new HttpResponse(null, { status: 204 });
    }),

    // GET /api/v1/auth/me
    http.get('*/v1/auth/me', () => {
      const data = config.meResponse ?? buildUserProfile();
      return HttpResponse.json(apiResponse(data));
    }),

    // GET /api/v1/auth/me/tenants
    http.get('*/v1/auth/me/tenants', () => {
      return HttpResponse.json(
        apiResponse([
          { id: 'tenant-uuid-001', name: 'Club Test 1', slug: 'club-test-1', role: 'admin' },
          { id: 'tenant-uuid-002', name: 'Club Test 2', slug: 'club-test-2', role: 'member' },
        ]),
      );
    }),
  ];
}
