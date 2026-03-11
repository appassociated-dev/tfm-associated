/** Token de inyección para el puerto de consulta de tipos de socio (NestJS DI). */
export const MEMBER_TYPE_QUERY_PORT = Symbol('MEMBER_TYPE_QUERY_PORT');

/** DTO simplificado de tipo de socio para consultas cross-BC. */
export interface MemberTypeDto {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

/**
 * Puerto anti-corrupción para consultar tipos de socio desde BC-Treasury.
 * Permite acceder a datos de BC-Membership sin acoplar los dominios (ADR-008).
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface MemberTypeQueryPort {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Obtiene todos los tipos de socio activos. */
  findAllActive(): Promise<MemberTypeDto[]>;

  /** Busca un tipo de socio por su identificador. */
  findById(id: string): Promise<MemberTypeDto | null>;
}
