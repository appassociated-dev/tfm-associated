// Tipos comunes de respuesta API — alineados con el formato ADR-010
export interface PaginatedMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
  } & Partial<PaginatedMeta>;
}
