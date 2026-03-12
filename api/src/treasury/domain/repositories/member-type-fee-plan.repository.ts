import { MemberTypeFeePlan } from '../entities/member-type-fee-plan';
import { FeePlanId } from '../value-objects/fee-plan-id';

/** Token de inyección para el repositorio de MemberTypeFeePlan (NestJS DI). */
export const MEMBER_TYPE_FEE_PLAN_REPOSITORY = Symbol('MEMBER_TYPE_FEE_PLAN_REPOSITORY');

/**
 * Interfaz del repositorio de MemberTypeFeePlan.
 * Define las operaciones de persistencia para la entidad MemberTypeFeePlan.
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface MemberTypeFeePlanRepository {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Persiste una asignación de plan a tipo de socio. */
  save(assignment: MemberTypeFeePlan): Promise<void>;

  /** Persiste múltiples asignaciones de forma atómica. */
  saveMany(assignments: MemberTypeFeePlan[]): Promise<void>;

  /** Busca todas las asignaciones de un plan de cuota. */
  findByFeePlanId(feePlanId: FeePlanId): Promise<MemberTypeFeePlan[]>;

  /** Busca todas las asignaciones de un tipo de socio. */
  findByMemberTypeId(memberTypeId: string): Promise<MemberTypeFeePlan[]>;

  /** Busca la asignación por defecto de un tipo de socio. */
  findDefault(memberTypeId: string): Promise<MemberTypeFeePlan | null>;

  /** Elimina todas las asignaciones de un plan de cuota. */
  deleteByFeePlanId(feePlanId: FeePlanId): Promise<void>;
}
