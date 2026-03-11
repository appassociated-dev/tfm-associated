/** Token de inyección para el puerto de consulta de socios (NestJS DI). */
export const MEMBER_QUERY_PORT = Symbol('MEMBER_QUERY_PORT');

/** DTO simplificado de socio para consultas cross-BC. */
export interface MemberDto {
  id: string;
  memberNumber: string;
  name: string;
  surnames: string;
  memberTypeId: string;
  currentStatus: string;
  active: boolean;
}

/**
 * Puerto anti-corrupción para consultar datos de socios desde BC-Treasury.
 * Permite acceder a datos de BC-Membership sin acoplar los dominios (ADR-008).
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface MemberQueryPort {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Busca un socio por su identificador. */
  findById(memberId: string): Promise<MemberDto | null>;

  /** Obtiene todos los socios activos. */
  findActiveMembers(): Promise<MemberDto[]>;
}
