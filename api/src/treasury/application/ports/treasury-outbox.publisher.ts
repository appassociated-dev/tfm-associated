import { DomainEvent } from '../../../shared/domain';

/** Token de inyección para el publisher de outbox de Treasury (NestJS DI). */
export const TREASURY_OUTBOX_PUBLISHER = Symbol('TREASURY_OUTBOX_PUBLISHER');

/**
 * Interfaz del publisher de outbox para el BC-Treasury.
 * Publica eventos de dominio al outbox transaccional para
 * comunicación asíncrona con otros BCs (ADR-008).
 */
export interface TreasuryOutboxPublisher {
  publish(tenantId: string, events: DomainEvent[]): Promise<void>;
}
