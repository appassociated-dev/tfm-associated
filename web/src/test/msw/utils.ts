// Utilidades para construir respuestas MSW que coincidan con el
// envelope estándar del backend (ADR-010).
// httpClient extrae data.data ?? data, así que envolvemos en { data: T }.

/**
 * Envuelve datos en el envelope estándar de respuesta de la API.
 * El backend devuelve { data: T } y httpClient accede con data.data ?? data.
 */
export function apiResponse<T>(data: T): { data: T } {
  return { data };
}

/**
 * Construye respuesta paginada siguiendo el formato del backend.
 * Usado para endpoints que devuelven listas con total.
 */
export function paginatedResponse<T>(items: T[], total: number): { data: T[]; total: number } {
  return { data: items, total };
}
