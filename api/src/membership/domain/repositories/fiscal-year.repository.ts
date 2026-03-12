import { FiscalYear } from '../aggregates/fiscal-year';
import { FiscalYearId } from '../value-objects/fiscal-year-id';
import { FiscalYearPeriod } from '../value-objects/fiscal-year-period';

/** Token de inyección para el repositorio de FiscalYear (NestJS DI). */
export const FISCAL_YEAR_REPOSITORY = Symbol('FISCAL_YEAR_REPOSITORY');

/**
 * Interfaz del repositorio de FiscalYear.
 * Define las operaciones de persistencia para el aggregate FiscalYear.
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface FiscalYearRepository {
  /** Establece el tenantId para operar sobre la BD del tenant correcto (ADR-002). */
  setTenantId(tenantId: string): void;

  /** Persiste un ejercicio fiscal (creación o actualización). */
  save(fiscalYear: FiscalYear): Promise<void>;

  /** Busca un ejercicio fiscal por su identificador único. */
  findById(id: FiscalYearId): Promise<FiscalYear | null>;

  /** Busca el ejercicio fiscal activo (estado OPEN). */
  findActive(): Promise<FiscalYear | null>;

  /** Obtiene todos los ejercicios fiscales. */
  findAll(): Promise<FiscalYear[]>;

  /** Busca un ejercicio fiscal por su nombre. */
  findByName(name: string): Promise<FiscalYear | null>;

  /** Verifica si existe un ejercicio fiscal abierto. */
  existsOpenFiscalYear(): Promise<boolean>;

  /** Busca ejercicios fiscales cuyo periodo se solapa con el dado. */
  findOverlapping(period: FiscalYearPeriod): Promise<FiscalYear[]>;
}
