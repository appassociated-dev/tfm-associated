import { Injectable } from '@nestjs/common';
import { ErrorReporter } from '../../domain/ports/error-reporter.port';

/**
 * Implementación de ErrorReporter para desarrollo.
 * Usa console.error/console.warn con formato JSON estructurado.
 * Es el adaptador por defecto cuando Sentry no está configurado.
 */
@Injectable()
export class ConsoleErrorReporter implements ErrorReporter {
  /** Captura una excepción y la imprime en consola con contexto. */
  captureException(error: Error, context?: Record<string, unknown>): void {
    console.error(
      JSON.stringify({
        level: 'error',
        type: 'exception',
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        context: context ?? null,
      }),
    );
  }

  /** Captura un mensaje con nivel de severidad. */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void {
    const logMethod = level === 'error' ? console.error : console.warn;

    logMethod(
      JSON.stringify({
        level,
        type: 'message',
        timestamp: new Date().toISOString(),
        message,
        context: context ?? null,
      }),
    );
  }

  /** Establece el usuario activo para las capturas subsiguientes. */
  setUser(userId: string, email: string, tenantId?: string): void {
    console.warn(
      JSON.stringify({
        level: 'info',
        type: 'set_user',
        timestamp: new Date().toISOString(),
        user: { userId, email, tenantId: tenantId ?? null },
      }),
    );
  }

  /** Establece datos de contexto adicionales. */
  setContext(key: string, data: Record<string, unknown>): void {
    console.warn(
      JSON.stringify({
        level: 'info',
        type: 'set_context',
        timestamp: new Date().toISOString(),
        contextKey: key,
        data,
      }),
    );
  }
}
