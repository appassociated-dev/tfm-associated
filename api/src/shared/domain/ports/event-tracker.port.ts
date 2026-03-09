/**
 * Puerto de salida para tracking de eventos de analítica.
 * Abstrae el proveedor de analítica (Mixpanel, PostHog, etc.).
 */
export interface EventTracker {
  /** Registra un evento con propiedades opcionales. */
  trackEvent(name: string, properties?: Record<string, unknown>): void;

  /** Registra una vista de página con propiedades opcionales. */
  trackPageView(path: string, properties?: Record<string, unknown>): void;
}

/** Token de inyección para el puerto EventTracker. */
export const EVENT_TRACKER = Symbol('EVENT_TRACKER');
