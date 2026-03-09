import axios from 'axios';
import { ApiError, apiErrorResponseSchema } from './api-error';

/** URL base del API, configurable via variable de entorno. */
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

/**
 * Instancia de Axios preconfigurada para comunicación con el backend.
 * Incluye interceptores para autenticación, multi-tenant y manejo de errores.
 */
export const httpClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de peticiones: inyecta el token Bearer y el header X-Tenant-Id.
 * Lee ambos valores del localStorage.
 */
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const tenantId = localStorage.getItem('tenant_id');
  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }

  return config;
});

/**
 * Interceptor de respuestas: transforma errores del backend en ApiError.
 * Redirige a /login en caso de 401 (sesión expirada).
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!axios.isAxiosError(error) || !error.response) {
      // Error de red u otro error no HTTP
      return Promise.reject(
        new ApiError(0, {
          code: 'NETWORK_ERROR',
          message: 'Error de conexión con el servidor.',
          details: null,
        }),
      );
    }

    const { status, data } = error.response;

    // Redirigir a login si la sesión ha expirado
    if (status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }

    // Intentar parsear el error con el formato estándar del backend
    const parsed = apiErrorResponseSchema.safeParse(data);

    if (parsed.success) {
      return Promise.reject(new ApiError(status, parsed.data.error));
    }

    // Formato de error no estándar — crear ApiError genérico
    return Promise.reject(
      new ApiError(status, {
        code: 'UNKNOWN_ERROR',
        message:
          typeof data?.message === 'string'
            ? data.message
            : 'Error desconocido del servidor.',
        details: null,
      }),
    );
  },
);
