import { Tenant } from '../aggregates/tenant';
import { TenantId } from '../value-objects/tenant-id';
import { Cif } from '../value-objects/cif';
import { Slug } from '../value-objects/slug';

/** Token de inyección para el repositorio de Tenant (NestJS DI). */
export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');

/**
 * Interfaz del repositorio de Tenant.
 * Define las operaciones de persistencia para el aggregate Tenant.
 * La implementación concreta reside en la capa de infraestructura.
 */
export interface TenantRepository {
  /** Persiste un tenant (creación o actualización). */
  save(tenant: Tenant): Promise<void>;

  /** Busca un tenant por su identificador único. */
  findById(id: TenantId): Promise<Tenant | null>;

  /** Busca un tenant por su CIF. */
  findByCif(cif: Cif): Promise<Tenant | null>;

  /** Busca un tenant por su slug. */
  findBySlug(slug: Slug): Promise<Tenant | null>;

  /** Verifica si ya existe un tenant con el CIF dado. */
  existsByCif(cif: Cif): Promise<boolean>;
}
