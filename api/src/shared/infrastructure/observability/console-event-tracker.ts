// Adaptador de event tracking para desarrollo — usa console
import { Injectable } from '@nestjs/common';
import { type EventTracker } from '../../domain/ports/event-tracker.port';

@Injectable()
export class ConsoleEventTracker implements EventTracker {
  // Registra un evento de negocio o analítica con formato JSON estructurado
  trackEvent(name: string, properties?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        type: 'track_event',
        name,
        properties,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  // Registra una vista de página con formato JSON estructurado
  trackPageView(path: string, properties?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        type: 'track_page_view',
        path,
        properties,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
