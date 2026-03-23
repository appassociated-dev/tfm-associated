import axios, { type InternalAxiosRequestConfig } from 'axios';
import i18n from '@/i18n/i18n';
import { ApiError, apiErrorResponseSchema } from './api-error';
import { getAccessToken, setTokens } from '@/features/auth/context/auth.provider';

/** URL base del API, configurable via variable de entorno. */
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Instancia de Axios preconfigurada para comunicacion con el backend.
 * Incluye interceptores para autenticacion, multi-tenant y manejo de errores
 * con refresh automatico de tokens y cola de peticiones concurrentes.
 */
export const httpClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// === Request Interceptor ===

/**
 * Interceptor de peticiones: inyecta el token Bearer desde memoria
 * (AuthProvider state) y el header X-Tenant-Id desde localStorage.
 */
httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // X-Tenant-Id: se lee de localStorage (se setea cuando el usuario selecciona tenant)
  const tenantId = localStorage.getItem('associated_tenant_id');
  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }

  return config;
});

// === Response Interceptor — Refresh Token Queue ===

/** Flag para indicar si hay un refresh de tokens en curso. */
let isRefreshing = false;

/** Cola de peticiones que fallaron con 401 mientras se hace refresh. */
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Procesa la cola de peticiones pendientes.
 * Si el refresh fue exitoso, resuelve con el nuevo token.
 * Si fallo, rechaza todas las peticiones encoladas.
 */
function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

/**
 * Interceptor de respuestas: maneja refresh automatico de tokens en 401
 * con cola para peticiones concurrentes, y transforma errores del backend
 * en ApiError tipados.
 */
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // --- Refresh logic para 401 ---
    // Solo si es 401, no es un retry, y no es un endpoint de auth (evita loop infinito
    // y permite que errores de login/refresh se propaguen al caller)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        // Ya hay un refresh en curso — encolar esta peticion y esperar
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(httpClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('associated_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Import dinamico para evitar dependencia circular (http-client -> auth.api -> http-client)
        const { refreshTokens } = await import('@/features/auth/api/auth.api');
        const tokens = await refreshTokens(refreshToken);

        // Actualizar tokens en AuthProvider (estado en memoria)
        setTokens(tokens);
        localStorage.setItem('associated_refresh_token', tokens.refreshToken);

        // Procesar cola con nuevo token — desbloquea peticiones encoladas
        processQueue(null, tokens.accessToken);

        // Reintentar peticion original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return httpClient(originalRequest);
      } catch (refreshError) {
        // Refresh fallo — rechazar todas las peticiones encoladas
        processQueue(refreshError, null);

        // Limpiar estado de autenticacion completo
        setTokens(null);
        localStorage.removeItem('associated_refresh_token');
        localStorage.removeItem('associated_tenant_id');

        // Redirigir a login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // --- Reporte de errores 5xx y errores de red ---
    if (error.response?.status >= 500 || !error.response) {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
      });
    }

    // --- Transformacion de errores del backend a ApiError ---
    if (!axios.isAxiosError(error) || !error.response) {
      return Promise.reject(
        new ApiError(0, {
          code: 'NETWORK_ERROR',
          message: i18n.t('errors:networkError'),
          details: null,
        }),
      );
    }

    const { status, data } = error.response;

    // Intentar parsear el error con el formato estandar del backend
    const parsed = apiErrorResponseSchema.safeParse(data);

    if (parsed.success) {
      return Promise.reject(new ApiError(status, parsed.data.error));
    }

    // Formato de error no estandar — crear ApiError generico
    return Promise.reject(
      new ApiError(status, {
        code: 'UNKNOWN_ERROR',
        message:
          typeof data?.message === 'string' ? data.message : i18n.t('errors:unknownServerError'),
        details: null,
      }),
    );
  },
);
