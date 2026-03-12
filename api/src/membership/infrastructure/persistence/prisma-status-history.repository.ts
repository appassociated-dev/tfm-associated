import { Injectable } from '@nestjs/common';
import { StatusHistoryRepository } from '../../domain/repositories/status-history.repository';
import { StatusHistory } from '../../domain/entities/status-history';
import { MemberId } from '../../domain/value-objects/member-id';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { StatusHistoryPrismaMapper, PrismaRawStatusHistory } from './status-history-prisma.mapper';

/**
 * Implementación Prisma del repositorio de StatusHistory.
 * Opera contra la tabla `status_history` de la BD del tenant (ADR-002).
 * Solo operaciones INSERT y SELECT (nunca UPDATE ni DELETE).
 */
@Injectable()
export class PrismaStatusHistoryRepository implements StatusHistoryRepository {
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
        'tenantId no establecido en PrismaStatusHistoryRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Persiste una entrada de historial de estado (INSERT-only). */
  async save(entry: StatusHistory): Promise<void> {
    const data = StatusHistoryPrismaMapper.toPersistence(entry);

    await this.prisma.statusHistory.create({ data });
  }

  /** Busca el historial de estados de un socio, ordenado por changed_at DESC. */
  async findByMemberId(memberId: MemberId): Promise<StatusHistory[]> {
    const rawList = await this.prisma.statusHistory.findMany({
      where: { member_id: memberId.toValue() },
      orderBy: { changed_at: 'desc' },
    });

    return rawList.map((raw: unknown) =>
      StatusHistoryPrismaMapper.toDomain(raw as PrismaRawStatusHistory),
    );
  }
}
