// Adaptador de observabilidad para producción — usa @sentry/react
import * as Sentry from '@sentry/react';
import type { ErrorReporter } from './error-reporter.port';

export class SentryErrorReporter implements ErrorReporter {
  constructor(dsn: string) {
    // Inicializar Sentry solo si hay DSN configurado
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
    });
  }

  captureException(error: Error, context?: Record<string, unknown>): void {
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context);
      Sentry.captureException(error);
    });
  }

  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void {
    Sentry.withScope((scope) => {
      if (context) scope.setExtras(context);
      Sentry.captureMessage(message, level);
    });
  }

  setUser(userId: string, email: string, tenantId?: string): void {
    Sentry.setUser({ id: userId, email, tenantId });
  }

  setContext(key: string, data: Record<string, unknown>): void {
    Sentry.setContext(key, data);
  }
}
