import { Injectable } from '@nestjs/common';
import { FiscalYearQueryPort, FiscalYearDto } from '../../domain/ports/fiscal-year-query.port';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * Adapter Prisma del puerto anti-corrupción para consultar datos de ejercicios fiscales (ADR-008).
 * Opera directamente contra la tabla `fiscal_years` de la BD del tenant.
 * No importa nada de BC-Membership — accede a la tabla compartida en la misma BD de tenant.
 */
@Injectable()
export class PrismaFiscalYearQueryAdapter implements FiscalYearQueryPort {
  private tenantId!: string;

  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  /** Establece el tenantId para obtener el PrismaClient correcto. */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /** Obtiene el PrismaClient del tenant actual. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getPrisma(): Promise<any> {
    if (!this.tenantId) {
      throw new Error(
        'tenantId no establecido en PrismaFiscalYearQueryAdapter. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Busca el ejercicio fiscal activo (estado OPEN). */
  async findActive(): Promise<FiscalYearDto | null> {
    const raw = await (
      await this.getPrisma()
    ).fiscalYear.findFirst({
      where: { status: 'OPEN' },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (!raw) return null;

    return {
      id: raw.id,
      name: raw.name,
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: raw.status,
    };
  }

  /** Busca un ejercicio fiscal por su identificador. */
  async findById(fiscalYearId: string): Promise<FiscalYearDto | null> {
    const raw = await (
      await this.getPrisma()
    ).fiscalYear.findUnique({
      where: { id: fiscalYearId },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        status: true,
      },
    });

    if (!raw) return null;

    return {
      id: raw.id,
      name: raw.name,
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: raw.status,
    };
  }
}
