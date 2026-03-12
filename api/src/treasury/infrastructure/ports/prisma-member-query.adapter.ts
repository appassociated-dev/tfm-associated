import { Injectable } from '@nestjs/common';
import { MemberQueryPort, MemberDto } from '../../domain/ports/member-query.port';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * Adapter Prisma del puerto anti-corrupción para consultar datos de socios (ADR-008).
 * Opera directamente contra la tabla `members` de la BD del tenant.
 * No importa nada de BC-Membership — accede a la tabla compartida en la misma BD de tenant.
 */
@Injectable()
export class PrismaMemberQueryAdapter implements MemberQueryPort {
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
        'tenantId no establecido en PrismaMemberQueryAdapter. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Busca un socio por su identificador. */
  async findById(memberId: string): Promise<MemberDto | null> {
    const raw = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        member_number: true,
        name: true,
        surnames: true,
        member_type_id: true,
        current_status: true,
      },
    });

    if (!raw) {
      return null;
    }

    return {
      id: raw.id,
      memberNumber: raw.member_number,
      name: raw.name,
      surnames: raw.surnames,
      memberTypeId: raw.member_type_id,
      currentStatus: raw.current_status,
      active: raw.current_status !== 'LEAVE',
    };
  }

  /** Obtiene todos los socios activos (cuyo estado no es LEAVE). */
  async findActiveMembers(): Promise<MemberDto[]> {
    const rawList = await this.prisma.member.findMany({
      where: { current_status: { not: 'LEAVE' } },
      select: {
        id: true,
        member_number: true,
        name: true,
        surnames: true,
        member_type_id: true,
        current_status: true,
      },
      orderBy: { created_at: 'asc' },
    });

    return rawList.map(
      (raw: {
        id: string;
        member_number: string;
        name: string;
        surnames: string;
        member_type_id: string;
        current_status: string;
      }) => ({
        id: raw.id,
        memberNumber: raw.member_number,
        name: raw.name,
        surnames: raw.surnames,
        memberTypeId: raw.member_type_id,
        currentStatus: raw.current_status,
        active: raw.current_status !== 'LEAVE',
      }),
    );
  }

  /**
   * Busca socios por nombre, apellidos, número de socio o DNI usando ILIKE.
   * Retorna coincidencias parciales para facilitar la búsqueda en el registro de cobros.
   */
  async searchMembers(query: string): Promise<MemberDto[]> {
    const rawList = await this.prisma.member.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { surnames: { contains: query, mode: 'insensitive' } },
          { member_number: { contains: query, mode: 'insensitive' } },
          { document_number: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        member_number: true,
        name: true,
        surnames: true,
        member_type_id: true,
        current_status: true,
        document_number: true,
      },
      take: 20, // Limitar resultados para rendimiento
      orderBy: { surnames: 'asc' },
    });

    return rawList.map(
      (raw: {
        id: string;
        member_number: string;
        name: string;
        surnames: string;
        member_type_id: string;
        current_status: string;
        document_number: string;
      }) => ({
        id: raw.id,
        memberNumber: raw.member_number,
        name: raw.name,
        surnames: raw.surnames,
        memberTypeId: raw.member_type_id,
        currentStatus: raw.current_status,
        active: raw.current_status !== 'LEAVE',
      }),
    );
  }
}
