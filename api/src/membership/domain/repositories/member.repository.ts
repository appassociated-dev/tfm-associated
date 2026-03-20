import { Member } from '../aggregates/member';
import { MemberId } from '../value-objects/member-id';
import { MemberStatus } from '../value-objects/member-status';
import { IdentityDocument } from '../value-objects/identity-document';

/** Token de inyección para el repositorio de Member (NestJS DI). */
export const MEMBER_REPOSITORY = Symbol('MEMBER_REPOSITORY');

/** Filtro para búsqueda de socios. */
export interface MemberFilter {
  /** Filtrar por estado del socio. */
  status?: string;
  /** Filtrar por tipo de socio (UUID). */
  memberTypeId?: string;
  /** Búsqueda textual por nombre, apellidos o email. */
  search?: string;
}

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

  /**
   * Persiste un socio (creación o actualización con optimistic locking).
   * @param member Aggregate a persistir.
   * @param tx Cliente transaccional opcional para garantizar atomicidad con otras operaciones.
   */
  save(member: Member, tx?: unknown): Promise<void>;

  /** Busca socios por estado. */
  findByStatus(status: MemberStatus): Promise<Member[]>;

  /** Busca todos los socios activos. */
  findActiveMembers(): Promise<Member[]>;

  /** Busca socios con pagos vencidos hace más de daysOverdue días (para DelinquencyManager). */
  findMembersWithOverduePayments(daysOverdue: number): Promise<Member[]>;

  /** Busca un socio por su documento de identidad. */
  findByIdentityDocument(document: IdentityDocument): Promise<Member | null>;

  /** Busca un socio por su email. */
  findByEmail(email: string): Promise<Member | null>;

  /** Busca socios con filtros opcionales. */
  findAll(filter?: MemberFilter): Promise<Member[]>;

  /** Verifica si ya existe un socio con el documento de identidad dado. */
  existsByIdentityDocument(document: IdentityDocument): Promise<boolean>;

  /** Verifica si ya existe un socio con el email dado. */
  existsByEmail(email: string): Promise<boolean>;

  /** Obtiene el siguiente número secuencial para asignar a un nuevo socio. */
  getNextMemberNumber(): Promise<number>;
}
