import { StatusHistory } from '../entities/status-history';
import { MemberId } from '../value-objects/member-id';

/** Token de inyección para el repositorio de StatusHistory (NestJS DI). */
export const STATUS_HISTORY_REPOSITORY = Symbol('STATUS_HISTORY_REPOSITORY');

/**
 * Interfaz del repositorio de StatusHistory.
 * Define las operaciones de persistencia para la entidad StatusHistory.
 * Solo operaciones INSERT y SELECT (nunca UPDATE/DELETE).
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface StatusHistoryRepository {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Persiste una entrada de historial de estado (INSERT-only). */
  save(entry: StatusHistory): Promise<void>;

  /** Busca el historial de estados de un socio, ordenado por changedAt DESC. */
  findByMemberId(memberId: MemberId): Promise<StatusHistory[]>;
}
