import { Injectable } from '@nestjs/common';
import { EventTracker } from '../../domain/ports/event-tracker.port';

/**
 * Implementación de EventTracker para desarrollo.
 * Usa console.log con formato JSON estructurado.
 * Es el adaptador por defecto cuando Sentry no está configurado.
 */
@Injectable()
export class ConsoleEventTracker implements EventTracker {
  /** Registra un evento de negocio con propiedades opcionales. */
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        level: 'info',
        type: 'business_event',
        timestamp: new Date().toISOString(),
        event: name,
        properties: properties ?? null,
      }),
    );
  }

  /** Registra una vista de página con propiedades opcionales. */
  trackPageView(path: string, properties?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        level: 'info',
        type: 'page_view',
        timestamp: new Date().toISOString(),
        path,
        properties: properties ?? null,
      }),
    );
  }
}
