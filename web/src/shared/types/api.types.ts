/**
 * Tipos comunes de respuesta de la API.
 * Coinciden con el formato envelope del backend (ADR-010).
 */

/** Metadatos incluidos en cada respuesta exitosa. */
export interface ResponseMeta {
  timestamp: string;
  path: string;
}

/** Envelope de respuesta exitosa del backend. */
export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

/** Envelope de respuesta paginada del backend. */
export interface PaginatedApiResponse<T> {
  data: T[];
  meta: ResponseMeta & {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/** Parámetros de paginación para peticiones al backend. */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Parámetros de ordenación para peticiones al backend. */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
