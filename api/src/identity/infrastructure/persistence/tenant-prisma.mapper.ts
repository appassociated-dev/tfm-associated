import { Tenant } from '../../domain/aggregates/tenant';
import { TenantId } from '../../domain/value-objects/tenant-id';
import { Cif } from '../../domain/value-objects/cif';
import { Slug } from '../../domain/value-objects/slug';
import { TenantStatus } from '../../domain/value-objects/tenant-status';
import { CollectivityType } from '../../domain/value-objects/collectivity-type';

/**
 * Datos de un tenant tal como los devuelve el Prisma Client (camelCase).
 * Prisma usa @map() para mapear camelCase → snake_case en la BD,
 * pero el modelo en el cliente siempre usa camelCase.
 */
export interface PrismaRawTenant {
  id: string;
  slug: string;
  name: string;
  cif: string;
  type: string;
  status: string;
  databaseName: string;
  contactEmail: string;
  createdAt: Date;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y el aggregate de dominio Tenant.
 * Prisma Client usa camelCase (definido en schema.prisma) en ambas direcciones.
 */
export class TenantPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a un aggregate Tenant.
   * Utiliza Tenant.reconstitute() para evitar emisión de eventos.
   */
  static toDomain(raw: PrismaRawTenant): Tenant {
    return Tenant.reconstitute({
      id: TenantId.fromString(raw.id),
      name: raw.name,
      slug: Slug.fromName(raw.name),
      cif: Cif.create(raw.cif),
      type: CollectivityType.fromString(raw.type),
      status: TenantStatus.fromString(raw.status),
      databaseName: raw.databaseName,
      contactEmail: raw.contactEmail,
      createdAt: raw.createdAt,
    });
  }

  /**
   * Convierte un aggregate Tenant a un objeto plano para persistencia.
   * Usa camelCase como espera el Prisma Client (el schema mapea a snake_case en BD).
   */
  static toPersistence(tenant: Tenant): Record<string, unknown> {
    return {
      id: tenant.id.toValue(),
      slug: tenant.slug.value,
      name: tenant.name,
      cif: tenant.cif.value,
      type: tenant.type.value,
      status: tenant.status.value,
      databaseName: tenant.databaseName,
      contactEmail: tenant.contactEmail,
      createdAt: tenant.createdAt,
    };
  }
}
