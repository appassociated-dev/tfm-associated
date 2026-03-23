import { Injectable } from '@nestjs/common';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { Tenant } from '../../domain/aggregates/tenant';
import { TenantId } from '../../domain/value-objects/tenant-id';
import { Cif } from '../../domain/value-objects/cif';
import { Slug } from '../../domain/value-objects/slug';
import { PrismaMainService } from '../../../shared/infrastructure/persistence/prisma-main.service';
import { TenantPrismaMapper } from './tenant-prisma.mapper';

/**
 * Implementación Prisma del repositorio de Tenant.
 * Opera contra la tabla `tenants` de la BD principal (DB-Main).
 */
@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaMainService) {}

  /** Persiste un tenant en la BD principal usando upsert. */
  async save(tenant: Tenant): Promise<void> {
    const data = TenantPrismaMapper.toPersistence(tenant);

    await this.prisma.tenant.upsert({
      where: { id: tenant.id.toValue() },
      create: data,
      update: data,
    });
  }

  /** Busca un tenant por su UUID. */
  async findById(id: TenantId): Promise<Tenant | null> {
    const raw = await this.prisma.tenant.findUnique({
      where: { id: id.toValue() },
    });

    return raw ? TenantPrismaMapper.toDomain(raw) : null;
  }

  /** Busca un tenant por su CIF. */
  async findByCif(cif: Cif): Promise<Tenant | null> {
    const raw = await this.prisma.tenant.findUnique({
      where: { cif: cif.value },
    });

    return raw ? TenantPrismaMapper.toDomain(raw) : null;
  }

  /** Busca un tenant por su slug. */
  async findBySlug(slug: Slug): Promise<Tenant | null> {
    const raw = await this.prisma.tenant.findFirst({
      where: { slug: slug.value },
    });

    return raw ? TenantPrismaMapper.toDomain(raw) : null;
  }

  /** Verifica si ya existe un tenant con el CIF dado. */
  async existsByCif(cif: Cif): Promise<boolean> {
    const raw = await this.prisma.tenant.findUnique({
      where: { cif: cif.value },
    });

    return !!raw;
  }

  /** Elimina un tenant por su UUID (compensación de saga). */
  async deleteById(id: string): Promise<void> {
    await this.prisma.tenant.deleteMany({ where: { id } });
  }
}
