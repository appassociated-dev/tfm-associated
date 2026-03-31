import { FeePlan } from '../aggregates/fee-plan';
import { FeePlanId } from '../value-objects/fee-plan-id';
import { FeePlanCode } from '../value-objects/fee-plan-code';

/** Token de inyección para el repositorio de FeePlan (NestJS DI). */
export const FEE_PLAN_REPOSITORY = Symbol('FEE_PLAN_REPOSITORY');

/**
 * Interfaz del repositorio de FeePlan.
 * Define las operaciones de persistencia para el aggregate FeePlan.
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface FeePlanRepository {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Persiste un plan de cuota (creación o actualización). */
  save(feePlan: FeePlan): Promise<void>;

  /** Busca un plan de cuota por su identificador único. */
  findById(id: FeePlanId): Promise<FeePlan | null>;

  /** Busca un plan de cuota por su código. */
  findByCode(code: FeePlanCode): Promise<FeePlan | null>;

  /** Obtiene todos los planes de cuota. */
  findAll(): Promise<FeePlan[]>;

  /**
   * Obtiene todos los planes de cuota junto con su conteo de suscripciones activas.
   * Las suscripciones activas son las que tienen status ACTIVE (AD-1).
   */
  findAllWithCount(): Promise<{ feePlan: FeePlan; activeSubscriptionsCount: number }[]>;

  /** Verifica si ya existe un plan de cuota con el código dado. */
  existsByCode(code: FeePlanCode): Promise<boolean>;

  /** Verifica si un plan de cuota tiene suscripciones activas. */
  hasActiveSubscriptions(id: FeePlanId): Promise<boolean>;
}
