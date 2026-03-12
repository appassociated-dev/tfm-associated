import { MemberType } from '../aggregates/member-type';
import { MemberTypeId } from '../value-objects/member-type-id';
import { MemberTypeCode } from '../value-objects/member-type-code';

/** Token de inyección para el repositorio de MemberType (NestJS DI). */
export const MEMBER_TYPE_REPOSITORY = Symbol('MEMBER_TYPE_REPOSITORY');

/**
 * Interfaz del repositorio de MemberType.
 * Define las operaciones de persistencia para el aggregate MemberType.
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface MemberTypeRepository {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Persiste un tipo de socio (creación o actualización). */
  save(memberType: MemberType): Promise<void>;

  /** Busca un tipo de socio por su identificador único. */
  findById(id: MemberTypeId): Promise<MemberType | null>;

  /** Busca un tipo de socio por su código. */
  findByCode(code: MemberTypeCode): Promise<MemberType | null>;

  /** Obtiene todos los tipos de socio. */
  findAll(): Promise<MemberType[]>;

  /** Verifica si ya existe un tipo de socio con el código dado. */
  existsByCode(code: MemberTypeCode): Promise<boolean>;

  /** Verifica si un tipo de socio es destino de transición de otro. */
  existsAsTransitionTarget(id: MemberTypeId): Promise<boolean>;
}
