// Esquemas Zod y tipos para errores de la API
import { z } from 'zod';

// Schema de error de API (ADR-010)
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiErrorType = z.infer<typeof apiErrorSchema>;

// Comprueba si un error de Axios es un error de API conocido
export function isApiError(error: unknown): error is { response: { data: ApiErrorType } } {
  if (!error || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;
  if (!e.response || typeof e.response !== 'object') return false;
  const r = e.response as Record<string, unknown>;
  return apiErrorSchema.safeParse(r.data).success;
}
