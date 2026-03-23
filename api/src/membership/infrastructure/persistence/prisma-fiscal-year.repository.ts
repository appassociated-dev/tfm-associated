import { Injectable } from '@nestjs/common';
import { FiscalYearRepository } from '../../domain/repositories/fiscal-year.repository';
import { FiscalYear } from '../../domain/aggregates/fiscal-year';
import { FiscalYearId } from '../../domain/value-objects/fiscal-year-id';
import { FiscalYearPeriod } from '../../domain/value-objects/fiscal-year-period';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { FiscalYearPrismaMapper, PrismaRawFiscalYear } from './fiscal-year-prisma.mapper';

/**
 * Implementación Prisma del repositorio de FiscalYear.
 * Opera contra la tabla `fiscal_years` de la BD del tenant (ADR-002).
 * Requiere tenantId para obtener el PrismaClient correcto del pool.
 */
@Injectable()
export class PrismaFiscalYearRepository implements FiscalYearRepository {
  private tenantId!: string;

  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  /** Establece el tenantId para obtener el PrismaClient correcto. */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /** Obtiene el PrismaClient del tenant actual. */
  private async getPrisma() {
    if (!this.tenantId) {
      throw new Error(
        'tenantId no establecido en PrismaFiscalYearRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Persiste un ejercicio fiscal usando upsert. */
  async save(fiscalYear: FiscalYear): Promise<void> {
    const data = FiscalYearPrismaMapper.toPersistence(fiscalYear);

    await (
      await this.getPrisma()
    ).fiscalYear.upsert({
      where: { id: fiscalYear.id.toValue() },
      create: data,
      update: data,
    });
  }

  /** Busca un ejercicio fiscal por su UUID. */
  async findById(id: FiscalYearId): Promise<FiscalYear | null> {
    const raw = await (
      await this.getPrisma()
    ).fiscalYear.findUnique({
      where: { id: id.toValue() },
    });

    return raw ? FiscalYearPrismaMapper.toDomain(raw as unknown as PrismaRawFiscalYear) : null;
  }

  /** Busca el ejercicio fiscal actualmente abierto (status = 'OPEN'). */
  async findActive(): Promise<FiscalYear | null> {
    const raw = await (
      await this.getPrisma()
    ).fiscalYear.findFirst({
      where: { status: 'OPEN' },
    });

    return raw ? FiscalYearPrismaMapper.toDomain(raw as unknown as PrismaRawFiscalYear) : null;
  }

  /** Obtiene todos los ejercicios fiscales del tenant ordenados por fecha de creación descendente. */
  async findAll(): Promise<FiscalYear[]> {
    const rawList = await (
      await this.getPrisma()
    ).fiscalYear.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return rawList.map((raw: unknown) =>
      FiscalYearPrismaMapper.toDomain(raw as PrismaRawFiscalYear),
    );
  }

  /** Busca un ejercicio fiscal por su nombre. */
  async findByName(name: string): Promise<FiscalYear | null> {
    const raw = await (
      await this.getPrisma()
    ).fiscalYear.findUnique({
      where: { name },
    });

    return raw ? FiscalYearPrismaMapper.toDomain(raw as unknown as PrismaRawFiscalYear) : null;
  }

  /** Verifica si existe algún ejercicio fiscal con status 'OPEN'. */
  async existsOpenFiscalYear(): Promise<boolean> {
    const count = await (
      await this.getPrisma()
    ).fiscalYear.count({
      where: { status: 'OPEN' },
    });

    return count > 0;
  }

  /** Busca ejercicios fiscales cuyo período se solape con el dado. */
  async findOverlapping(period: FiscalYearPeriod): Promise<FiscalYear[]> {
    const rawList = await (
      await this.getPrisma()
    ).fiscalYear.findMany({
      where: {
        startDate: { lte: period.endDate },
        endDate: { gte: period.startDate },
      },
    });

    return rawList.map((raw: unknown) =>
      FiscalYearPrismaMapper.toDomain(raw as PrismaRawFiscalYear),
    );
  }
}
