import { MemberAccount } from '../aggregates/member-account';
import { MemberAccountId } from '../value-objects/member-account-id';

/** Token de inyección para el repositorio de MemberAccount (NestJS DI). */
export const MEMBER_ACCOUNT_REPOSITORY = Symbol('MEMBER_ACCOUNT_REPOSITORY');

/**
 * Interfaz del repositorio de MemberAccount.
 * Define las operaciones de persistencia para el aggregate MemberAccount.
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface MemberAccountRepository {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Persiste una cuenta de socio (creación o actualización). */
  save(account: MemberAccount): Promise<void>;

  /** Busca una cuenta de socio por su identificador único. */
  findById(id: MemberAccountId): Promise<MemberAccount | null>;

  /** Busca una cuenta de socio por el identificador del socio asociado. */
  findByMemberId(memberId: string): Promise<MemberAccount | null>;

  /** Verifica si ya existe una cuenta de socio para el socio dado. */
  existsByMemberId(memberId: string): Promise<boolean>;
}
