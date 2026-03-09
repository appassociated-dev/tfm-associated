import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { EventTracker } from '../../domain/ports/event-tracker.port';

/**
 * Implementación de EventTracker usando Sentry.
 * Se activa cuando la variable de entorno SENTRY_DSN está definida.
 * Registra eventos de negocio como breadcrumbs en Sentry.
 */
@Injectable()
export class SentryEventTracker implements EventTracker {
  /** Registra un evento de negocio como breadcrumb en Sentry. */
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
      category: 'business_event',
      message: name,
      level: 'info',
      data: properties,
    });
  }

  /** Registra una vista de página como breadcrumb en Sentry. */
  trackPageView(path: string, properties?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
      category: 'page_view',
      message: path,
      level: 'info',
      data: properties,
    });
  }
}
