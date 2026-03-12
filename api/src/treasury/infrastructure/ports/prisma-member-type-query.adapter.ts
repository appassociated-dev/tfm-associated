import { Injectable } from '@nestjs/common';
import { MemberTypeQueryPort, MemberTypeDto } from '../../domain/ports/member-type-query.port';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * Adapter Prisma del puerto anti-corrupción para consultar tipos de socio (ADR-008).
 * Opera directamente contra la tabla `member_types` de la BD del tenant.
 * No importa nada de BC-Membership — accede a la tabla compartida en la misma BD de tenant.
 */
@Injectable()
export class PrismaMemberTypeQueryAdapter implements MemberTypeQueryPort {
  private tenantId!: string;

  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  /** Establece el tenantId para obtener el PrismaClient correcto. */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /** Obtiene el PrismaClient del tenant actual. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get prisma(): any {
    if (!this.tenantId) {
      throw new Error(
        'tenantId no establecido en PrismaMemberTypeQueryAdapter. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Obtiene todos los tipos de socio activos del tenant. */
  async findAllActive(): Promise<MemberTypeDto[]> {
    const rawList = await this.prisma.memberType.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true, active: true },
      orderBy: { createdAt: 'asc' },
    });

    return rawList.map((raw: { id: string; code: string; name: string; active: boolean }) => ({
      id: raw.id,
      code: raw.code,
      name: raw.name,
      active: raw.active,
    }));
  }

  /** Busca un tipo de socio por su identificador. */
  async findById(id: string): Promise<MemberTypeDto | null> {
    const raw = await this.prisma.memberType.findUnique({
      where: { id },
      select: { id: true, code: true, name: true, active: true },
    });

    if (!raw) {
      return null;
    }

    return {
      id: raw.id,
      code: raw.code,
      name: raw.name,
      active: raw.active,
    };
  }
}
