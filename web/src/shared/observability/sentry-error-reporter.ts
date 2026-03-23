import * as Sentry from '@sentry/react';
import type { ErrorReporter } from './error-reporter.port';

/**
 * Implementación de ErrorReporter usando Sentry React SDK.
 * Se activa cuando la variable de entorno VITE_SENTRY_DSN está definida.
 */
export class SentryErrorReporter implements ErrorReporter {
  /** Captura una excepción y la envía a Sentry con contexto opcional. */
  captureException(error: Error, context?: Record<string, unknown>): void {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  }

  /** Captura un mensaje con nivel de severidad y lo envía a Sentry. */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureMessage(message, level);
    });
  }

  /** Establece el usuario activo en Sentry para las capturas subsiguientes. */
  setUser(userId: string, email: string, tenantId?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      ...(tenantId ? { tenantId } : {}),
    });
  }

  /** Establece datos de contexto adicionales en Sentry. */
  setContext(key: string, data: Record<string, unknown>): void {
    Sentry.setContext(key, data);
  }
}
