import type { DomainEvent } from '../../domain/domain-event.base';

/**
 * Token de inyección para el puerto IntegrationEventPublisher.
 * Implementado por PrismaIntegrationEventPublisher en la capa de infraestructura.
 */
export const INTEGRATION_EVENT_PUBLISHER = Symbol('INTEGRATION_EVENT_PUBLISHER');

/**
 * Puerto de salida para publicar Integration Events en el outbox de DB-Main.
 * Escribe eventos en la tabla outbox_events para su procesamiento asíncrono (GAP-001).
 * tenantId es nullable para soportar eventos de BC-Identity (sin contexto de tenant).
 */
export interface IntegrationEventPublisher {
  publish(tenantId: string | null, events: DomainEvent[]): Promise<void>;
}
