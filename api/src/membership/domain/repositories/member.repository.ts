import { Member } from '../aggregates/member';
import { MemberId } from '../value-objects/member-id';
import { MemberStatus } from '../value-objects/member-status';

/** Token de inyección para el repositorio de Member (NestJS DI). */
export const MEMBER_REPOSITORY = Symbol('MEMBER_REPOSITORY');

/**
 * Interfaz del repositorio de Member.
 * Define las operaciones de persistencia para el aggregate Member.
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface MemberRepository {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Busca un socio por su identificador único. */
  findById(id: MemberId): Promise<Member | null>;

  /** Persiste un socio (creación o actualización con optimistic locking). */
  save(member: Member): Promise<void>;

  /** Busca socios por estado. */
  findByStatus(status: MemberStatus): Promise<Member[]>;

  /** Busca todos los socios activos. */
  findActiveMembers(): Promise<Member[]>;

  /** Busca socios con pagos vencidos hace más de daysOverdue días (para DelinquencyManager). */
  findMembersWithOverduePayments(daysOverdue: number): Promise<Member[]>;
}
