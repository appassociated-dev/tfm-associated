import { Injectable } from '@nestjs/common';
import { MemberTypeFeePlanRepository } from '../../domain/repositories/member-type-fee-plan.repository';
import { MemberTypeFeePlan } from '../../domain/entities/member-type-fee-plan';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import {
  MemberTypeFeePlanPrismaMapper,
  PrismaRawMemberTypeFeePlan,
} from './member-type-fee-plan-prisma.mapper';

/**
 * Implementación Prisma del repositorio de MemberTypeFeePlan.
 * Opera contra la tabla `member_type_fee_plans` de la BD del tenant (ADR-002).
 * Requiere tenantId para obtener el PrismaClient correcto del pool.
 */
@Injectable()
export class PrismaMemberTypeFeePlanRepository implements MemberTypeFeePlanRepository {
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
        'tenantId no establecido en PrismaMemberTypeFeePlanRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Persiste una asignación de plan a tipo de socio usando upsert (PK compuesta). */
  async save(assignment: MemberTypeFeePlan): Promise<void> {
    const data = MemberTypeFeePlanPrismaMapper.toPersistence(assignment);

    await this.prisma.memberTypeFeePlan.upsert({
      where: {
        memberTypeId_feePlanId: {
          memberTypeId: assignment.memberTypeId,
          feePlanId: assignment.feePlanId,
        },
      },
      create: data,
      update: data,
    });
  }

  /** Persiste múltiples asignaciones de forma atómica usando una transacción. */
  async saveMany(assignments: MemberTypeFeePlan[]): Promise<void> {
    if (assignments.length === 0) {
      return;
    }

    const operations = assignments.map((assignment) => {
      const data = MemberTypeFeePlanPrismaMapper.toPersistence(assignment);

      return this.prisma.memberTypeFeePlan.upsert({
        where: {
          memberTypeId_feePlanId: {
            memberTypeId: assignment.memberTypeId,
            feePlanId: assignment.feePlanId,
          },
        },
        create: data,
        update: data,
      });
    });

    await this.prisma.$transaction(operations);
  }

  /** Busca todas las asignaciones de un plan de cuota. */
  async findByFeePlanId(feePlanId: FeePlanId): Promise<MemberTypeFeePlan[]> {
    const rawList = await this.prisma.memberTypeFeePlan.findMany({
      where: { feePlanId: feePlanId.toValue() },
      orderBy: { displayOrder: 'asc' },
    });

    return rawList.map((raw: unknown) =>
      MemberTypeFeePlanPrismaMapper.toDomain(raw as PrismaRawMemberTypeFeePlan),
    );
  }

  /** Busca todas las asignaciones de un tipo de socio. */
  async findByMemberTypeId(memberTypeId: string): Promise<MemberTypeFeePlan[]> {
    const rawList = await this.prisma.memberTypeFeePlan.findMany({
      where: { memberTypeId },
      orderBy: { displayOrder: 'asc' },
    });

    return rawList.map((raw: unknown) =>
      MemberTypeFeePlanPrismaMapper.toDomain(raw as PrismaRawMemberTypeFeePlan),
    );
  }

  /** Busca la asignación por defecto de un tipo de socio. */
  async findDefault(memberTypeId: string): Promise<MemberTypeFeePlan | null> {
    const raw = await this.prisma.memberTypeFeePlan.findFirst({
      where: { memberTypeId, isDefault: true, active: true },
    });

    return raw
      ? MemberTypeFeePlanPrismaMapper.toDomain(raw as unknown as PrismaRawMemberTypeFeePlan)
      : null;
  }

  /** Elimina todas las asignaciones de un plan de cuota. */
  async deleteByFeePlanId(feePlanId: FeePlanId): Promise<void> {
    await this.prisma.memberTypeFeePlan.deleteMany({
      where: { feePlanId: feePlanId.toValue() },
    });
  }
}
