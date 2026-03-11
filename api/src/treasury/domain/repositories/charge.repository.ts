import { Charge } from '../entities/charge';
import { ExistingChargeKey } from '../services/charge-generator';
import { MemberAccountId } from '../value-objects/member-account-id';
import { SubscriptionId } from '../value-objects/subscription-id';

/** Token de inyección para el repositorio de Charge (NestJS DI). */
export const CHARGE_REPOSITORY = Symbol('CHARGE_REPOSITORY');

/**
 * Interfaz del repositorio de Charge.
 * Define las operaciones de persistencia para la entidad Charge.
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface ChargeRepository {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Persiste múltiples cargos en una sola operación (generación masiva). */
  saveMany(charges: Charge[]): Promise<void>;

  /** Busca un cargo por suscripción y periodo de facturación. */
  findBySubscriptionAndPeriod(
    subscriptionId: SubscriptionId,
    billingMonth: number,
    billingYear: number,
  ): Promise<Charge | null>;

  /**
   * Obtiene las claves de cargos existentes para un conjunto de suscripciones y periodo.
   * Usado para prevenir duplicados en la generación masiva.
   */
  findExistingKeys(
    subscriptionIds: string[],
    billingMonth: number,
    billingYear: number,
  ): Promise<ExistingChargeKey[]>;

  /** Busca todos los cargos de una cuenta de socio. */
  findByMemberAccountId(memberAccountId: MemberAccountId): Promise<Charge[]>;

  /** Busca los cargos pendientes de una cuenta de socio. */
  findPendingByMemberAccountId(memberAccountId: MemberAccountId): Promise<Charge[]>;
}
