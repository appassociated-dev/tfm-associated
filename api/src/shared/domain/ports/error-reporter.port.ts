// Puerto de observabilidad para reporte de errores — abstracción sobre Sentry/Console
export const ERROR_REPORTER = Symbol('ERROR_REPORTER');

export interface ErrorReporter {
  // Captura una excepción con contexto opcional para enriquecer el reporte
  captureException(error: Error, context?: Record<string, unknown>): void;

  // Captura un mensaje con nivel de severidad y contexto opcional
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void;

  // Establece el contexto del usuario actual para todos los reportes posteriores
  setUser(userId: string, email: string, tenantId?: string): void;

  // Establece datos de contexto adicionales agrupados por clave
  setContext(key: string, data: Record<string, unknown>): void;
}
