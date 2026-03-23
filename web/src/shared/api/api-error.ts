import { z } from 'zod';

/**
 * Schema Zod para el formato de error del backend (ADR-010).
 * Coincide con la estructura devuelta por DomainExceptionFilter.
 */
export const apiErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).nullable(),
});

/** Schema del envelope de error completo del backend. */
export const apiErrorResponseSchema = z.object({
  error: apiErrorDetailSchema,
});

/** Tipo de detalle de error de la API. */
export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;

/** Tipo de respuesta de error de la API. */
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/**
 * Error personalizado para errores de la API.
 * Encapsula el código de error, mensaje y detalles del backend.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown> | null;

  constructor(status: number, errorDetail: ApiErrorDetail) {
    super(errorDetail.message);
    this.name = 'ApiError';
    this.code = errorDetail.code;
    this.status = status;
    this.details = errorDetail.details;
  }

  /** Indica si el error es de autenticación (401). */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Indica si el error es de permisos (403). */
  get isForbidden(): boolean {
    return this.status === 403;
  }

  /** Indica si el error es de recurso no encontrado (404). */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}
