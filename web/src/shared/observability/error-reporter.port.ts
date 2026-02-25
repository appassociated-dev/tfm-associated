// Puerto de observabilidad para reporte de errores (frontend)
export interface ErrorReporter {
  captureException(error: Error, context?: Record<string, unknown>): void;
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void;
  setUser(userId: string, email: string, tenantId?: string): void;
  setContext(key: string, data: Record<string, unknown>): void;
}
