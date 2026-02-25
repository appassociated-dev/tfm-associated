// Cliente HTTP configurado con interceptores de autenticación y manejo de errores
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// Tipo de respuesta API estándar (ADR-010)
export interface ApiResponse<T = unknown> {
  data: T;
  meta: {
    timestamp: string;
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

// Tipo de error API estándar (ADR-010)
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Función para obtener el token desde el almacenamiento local
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Función para obtener el tenant actual
const getCurrentTenantId = (): string | null => {
  return localStorage.getItem('tenant_id');
};

// Instancia Axios configurada
export const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor de petición — inyecta token JWT y X-Tenant-Id
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  const tenantId = getCurrentTenantId();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    config.headers['X-Tenant-Id'] = tenantId;
  }

  return config;
});

// Interceptor de respuesta — manejo de 401 y parseo de errores
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Limpiar credenciales y redirigir al login
      localStorage.removeItem('access_token');
      localStorage.removeItem('tenant_id');
      window.location.href = '/';
    }
    return Promise.reject(error as unknown);
  },
);
