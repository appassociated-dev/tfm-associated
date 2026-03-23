/**
 * Puerto de salida para reporte de errores en el frontend.
 * Misma interfaz que el backend para consistencia cross-stack.
 * Abstrae el proveedor de observabilidad (Sentry, consola, etc.).
 */
export interface ErrorReporter {
  /** Captura una excepción con contexto opcional. */
  captureException(error: Error, context?: Record<string, unknown>): void;

  /** Captura un mensaje con nivel de severidad y contexto opcional. */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void;

  /** Establece el usuario activo para las capturas subsiguientes. */
  setUser(userId: string, email: string, tenantId?: string): void;

  /** Establece datos de contexto adicionales bajo una clave específica. */
  setContext(key: string, data: Record<string, unknown>): void;
}
