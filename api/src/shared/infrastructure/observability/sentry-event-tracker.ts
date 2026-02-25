// Adaptador de event tracking para producción — usa Sentry
import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { type EventTracker } from '../../domain/ports/event-tracker.port';

@Injectable()
export class SentryEventTracker implements EventTracker {
  // Registra un evento de negocio o analítica como breadcrumb en Sentry
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
      category: 'business_event',
      message: name,
      data: properties,
      level: 'info',
    });
  }

  // Registra una vista de página como breadcrumb de navegación en Sentry
  trackPageView(path: string, properties?: Record<string, unknown>): void {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: path,
      data: properties,
      level: 'info',
    });
  }
}
