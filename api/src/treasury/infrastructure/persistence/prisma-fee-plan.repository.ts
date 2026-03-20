import { Injectable } from '@nestjs/common';
import { FeePlanRepository } from '../../domain/repositories/fee-plan.repository';
import { FeePlan } from '../../domain/aggregates/fee-plan';
import { FeePlanId } from '../../domain/value-objects/fee-plan-id';
import { FeePlanCode } from '../../domain/value-objects/fee-plan-code';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { FeePlanPrismaMapper, PrismaRawFeePlan } from './fee-plan-prisma.mapper';

/**
 * Implementación Prisma del repositorio de FeePlan.
 * Opera contra la tabla `fee_plans` de la BD del tenant (ADR-002).
 * Requiere tenantId para obtener el PrismaClient correcto del pool.
 */
@Injectable()
export class PrismaFeePlanRepository implements FeePlanRepository {
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
        'tenantId no establecido en PrismaFeePlanRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /** Persiste un plan de cuota usando upsert. */
  async save(feePlan: FeePlan): Promise<void> {
    const data = FeePlanPrismaMapper.toPersistence(feePlan);

    await (
      await this.getPrisma()
    ).feePlan.upsert({
      where: { id: feePlan.id.toValue() },
      create: data,
      update: data,
    });
  }

  /** Busca un plan de cuota por su identificador único. */
  async findById(id: FeePlanId): Promise<FeePlan | null> {
    const raw = await (
      await this.getPrisma()
    ).feePlan.findUnique({
      where: { id: id.toValue() },
    });

    return raw ? FeePlanPrismaMapper.toDomain(raw as unknown as PrismaRawFeePlan) : null;
  }

  /** Busca un plan de cuota por su código. */
  async findByCode(code: FeePlanCode): Promise<FeePlan | null> {
    const raw = await (
      await this.getPrisma()
    ).feePlan.findUnique({
      where: { code: code.value },
    });

    return raw ? FeePlanPrismaMapper.toDomain(raw as unknown as PrismaRawFeePlan) : null;
  }

  /** Obtiene todos los planes de cuota del tenant. */
  async findAll(): Promise<FeePlan[]> {
    const rawList = await (
      await this.getPrisma()
    ).feePlan.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return rawList.map((raw: unknown) => FeePlanPrismaMapper.toDomain(raw as PrismaRawFeePlan));
  }

  /** Verifica si ya existe un plan de cuota con el código dado. */
  async existsByCode(code: FeePlanCode): Promise<boolean> {
    const raw = await (
      await this.getPrisma()
    ).feePlan.findUnique({
      where: { code: code.value },
    });

    return !!raw;
  }

  /**
   * Verifica si un plan de cuota tiene suscripciones activas.
   * Consulta la tabla fee_subscriptions con status distinto de COMPLETED y CANCELLED.
   */
  async hasActiveSubscriptions(id: FeePlanId): Promise<boolean> {
    const count = await (
      await this.getPrisma()
    ).feeSubscription.count({
      where: {
        feePlanId: id.toValue(),
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    return count > 0;
  }
}
