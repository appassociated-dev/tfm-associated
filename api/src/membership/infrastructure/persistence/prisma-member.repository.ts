import { Injectable } from '@nestjs/common';
import { MemberRepository } from '../../domain/repositories/member.repository';
import { Member } from '../../domain/aggregates/member';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { OptimisticLockingError } from '../../domain/exceptions/optimistic-locking.exception';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { MemberPrismaMapper, PrismaRawMember } from './member-prisma.mapper';

/**
 * Implementación Prisma del repositorio de Member.
 * Opera contra la tabla `members` de la BD del tenant (ADR-002).
 * Requiere tenantId para obtener el PrismaClient correcto del pool.
 * Soporta optimistic locking via campo `version`.
 */
@Injectable()
export class PrismaMemberRepository implements MemberRepository {
  private tenantId!: string;

  constructor(private readonly prismaTenantService: PrismaTenantService) {}

  /** Establece el tenantId para obtener el PrismaClient correcto. */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /** Obtiene el PrismaClient del tenant actual. */
  private get prisma() {
    if (!this.tenantId) {
      throw new Error(
        'tenantId no establecido en PrismaMemberRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Busca un socio por su UUID. */
  async findById(id: MemberId): Promise<Member | null> {
    const raw = await this.prisma.member.findUnique({
      where: { id: id.toValue() },
    });

    return raw ? MemberPrismaMapper.toDomain(raw as unknown as PrismaRawMember) : null;
  }

  /**
   * Persiste un socio con optimistic locking.
   * - Si es nuevo (version 0 y no existe en BD): create
   * - Si existe: update verificando la versión previa de forma atómica
   * - Si la versión no coincide: lanza OptimisticLockingError
   */
  async save(member: Member): Promise<void> {
    const data = MemberPrismaMapper.toPersistence(member);
    const memberId = member.id.toValue();

    // Verificar si el registro existe en BD
    const existing = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!existing) {
      // Crear nuevo registro
      await this.prisma.member.create({ data });
    } else {
      // Optimistic locking: verificar versión previa ANTES de actualizar
      const expectedPreviousVersion = member.version - 1;

      if (existing.version !== expectedPreviousVersion) {
        throw new OptimisticLockingError(memberId);
      }

      try {
        await this.prisma.member.update({
          where: { id: memberId },
          data,
        });
      } catch (error: unknown) {
        // Prisma P2025: Record not found (eliminado concurrentemente)
        if (
          error instanceof Error &&
          'code' in error &&
          (error as { code: string }).code === 'P2025'
        ) {
          throw new OptimisticLockingError(memberId);
        }
        throw error;
      }
    }
  }

  /** Busca socios por estado. */
  async findByStatus(status: MemberStatus): Promise<Member[]> {
    const rawList = await this.prisma.member.findMany({
      where: { current_status: status.value },
    });

    return rawList.map((raw: unknown) => MemberPrismaMapper.toDomain(raw as PrismaRawMember));
  }

  /** Busca todos los socios activos. */
  async findActiveMembers(): Promise<Member[]> {
    return this.findByStatus(MemberStatus.ACTIVE);
  }

  /**
   * Busca socios con pagos vencidos hace más de daysOverdue días.
   * Placeholder MVP: retorna findActiveMembers().
   * La detección real de impagos viene con la integración de BC-Treasury.
   */
  async findMembersWithOverduePayments(_daysOverdue: number): Promise<Member[]> {
    // MVP: delegar a findActiveMembers() — la lógica real de detección
    // de impagos se implementará con la integración de BC-Treasury.
    return this.findActiveMembers();
  }
}
