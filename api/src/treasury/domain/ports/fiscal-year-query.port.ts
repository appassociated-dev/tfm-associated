/** Token de inyección para el puerto de consulta de ejercicios fiscales (NestJS DI). */
export const FISCAL_YEAR_QUERY_PORT = Symbol('FISCAL_YEAR_QUERY_PORT');

/** DTO simplificado de ejercicio fiscal para consultas cross-BC. */
export interface FiscalYearDto {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string; // 'OPEN' | 'CLOSED'
}

/**
 * Puerto anti-corrupción para consultar datos de ejercicios fiscales
 * desde BC-Treasury hacia BC-Membership.
 * Permite acceder a datos del ejercicio sin acoplar los dominios (ADR-008).
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface FiscalYearQueryPort {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Busca el ejercicio fiscal activo (estado OPEN). */
  findActive(): Promise<FiscalYearDto | null>;

  /** Busca un ejercicio fiscal por su identificador. */
  findById(fiscalYearId: string): Promise<FiscalYearDto | null>;
}
