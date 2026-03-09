/**
 * Puerto de salida para reporte de errores.
 * Abstrae el proveedor de observabilidad de errores (Sentry, Bugsnag, etc.).
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

/** Token de inyección para el puerto ErrorReporter. */
export const ERROR_REPORTER = Symbol('ERROR_REPORTER');
