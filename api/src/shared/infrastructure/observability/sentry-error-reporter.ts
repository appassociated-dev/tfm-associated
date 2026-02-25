// Adaptador de observabilidad para producción — usa Sentry
import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { type ErrorReporter } from '../../domain/ports/error-reporter.port';

@Injectable()
export class SentryErrorReporter implements ErrorReporter {
  // Captura una excepción y la envía a Sentry con contexto adicional
  captureException(error: Error, context?: Record<string, unknown>): void {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      Sentry.captureException(error);
    });
  }

  // Captura un mensaje con nivel de severidad y lo envía a Sentry
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error',
    context?: Record<string, unknown>,
  ): void {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('additional', context);
      }
      // Mapea el nivel de la aplicación al nivel de Sentry
      const sentryLevel = level === 'warning' ? 'warning' : level;
      Sentry.captureMessage(message, sentryLevel);
    });
  }

  // Establece el usuario actual en el scope de Sentry para todos los eventos posteriores
  setUser(userId: string, email: string, tenantId?: string): void {
    Sentry.setUser({
      id: userId,
      email,
      ...(tenantId ? { tenant_id: tenantId } : {}),
    });
  }

  // Establece datos de contexto adicionales en el scope de Sentry
  setContext(key: string, data: Record<string, unknown>): void {
    Sentry.setContext(key, data);
  }
}
