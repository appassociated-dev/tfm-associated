// Puerto de observabilidad para tracking de eventos — abstracción sobre Sentry/Console
export const EVENT_TRACKER = Symbol('EVENT_TRACKER');

export interface EventTracker {
  // Registra un evento de negocio o analítica con propiedades opcionales
  trackEvent(name: string, properties?: Record<string, unknown>): void;

  // Registra una vista de página con propiedades opcionales
  trackPageView(path: string, properties?: Record<string, unknown>): void;
}
