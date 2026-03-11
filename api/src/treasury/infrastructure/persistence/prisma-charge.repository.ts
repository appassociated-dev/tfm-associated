import { Injectable } from '@nestjs/common';
import { ChargeRepository } from '../../domain/repositories/charge.repository';
import { Charge } from '../../domain/entities/charge';
import { ExistingChargeKey } from '../../domain/services/charge-generator';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { SubscriptionId } from '../../domain/value-objects/subscription-id';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';

/**
 * Implementación Prisma del repositorio de Charge.
 * Opera contra la tabla `charges` de la BD del tenant (ADR-002).
 * Requiere tenantId para obtener el PrismaClient correcto del pool.
 */
@Injectable()
export class PrismaChargeRepository implements ChargeRepository {
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
        'tenantId no establecido en PrismaChargeRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /**
   * Persiste múltiples cargos en una sola operación (generación masiva).
   * Usa createMany con skipDuplicates para idempotencia (FE-4).
   *
   * Resuelve memberAccountId desde la tabla fee_subscriptions ya que
   * la entidad Charge no lleva esa referencia (pertenece al aggregate MemberAccount).
   */
  async saveMany(charges: Charge[]): Promise<void> {
    if (charges.length === 0) return;

    // Obtener los subscriptionIds únicos para resolver memberAccountId
    const subscriptionIds = [
      ...new Set(
        charges.filter((c) => c.subscriptionId !== null).map((c) => c.subscriptionId!.toValue()),
      ),
    ];

    // Consultar memberAccountId para cada suscripción
    const subscriptionMap = new Map<string, string>();
    if (subscriptionIds.length > 0) {
      const subscriptions = await this.prisma.feeSubscription.findMany({
        where: { id: { in: subscriptionIds } },
        select: { id: true, memberAccountId: true },
      });
      for (const sub of subscriptions) {
        subscriptionMap.set(sub.id, sub.memberAccountId);
      }
    }

    const data = charges.map((charge) => {
      const subId = charge.subscriptionId?.toValue() ?? null;
      const memberAccountId = subId ? subscriptionMap.get(subId) : null;

      if (!memberAccountId) {
        throw new Error(
          `No se pudo resolver memberAccountId para la suscripción ${subId}. Verificar integridad de datos.`,
        );
      }

      return {
        id: charge.id.toValue(),
        memberAccountId,
        feeSubscriptionId: subId,
        baseAmount: charge.baseAmount.amount,
        finalAmount: charge.finalAmount.amount,
        description: charge.description.description,
        fiscalYearId: charge.description.fiscalYearId ?? null,
        billingMonth: charge.billingMonth,
        billingYear: charge.billingYear,
        issueDate: charge.issueDate,
        dueDate: charge.dueDate,
        status: charge.status.value,
        paidAmount: charge.paidAmount.amount,
        isProrated: charge.isProrated,
        isManual: charge.isManual,
        createdAt: charge.createdAt,
      };
    });

    await this.prisma.charge.createMany({
      data,
      skipDuplicates: true, // Prevención de duplicados por constraint UNIQUE (FE-4)
    });
  }

  /** Busca un cargo por suscripción y periodo de facturación. */
  async findBySubscriptionAndPeriod(
    subscriptionId: SubscriptionId,
    billingMonth: number,
    billingYear: number,
  ): Promise<Charge | null> {
    const raw = await this.prisma.charge.findFirst({
      where: {
        feeSubscriptionId: subscriptionId.toValue(),
        billingMonth,
        billingYear,
      },
    });

    return raw ? this.toDomain(raw) : null;
  }

  /**
   * Obtiene las claves de cargos existentes para un conjunto de suscripciones y periodo.
   * Usado para prevenir duplicados en la generación masiva.
   */
  async findExistingKeys(
    subscriptionIds: string[],
    billingMonth: number,
    billingYear: number,
  ): Promise<ExistingChargeKey[]> {
    const rawList = await this.prisma.charge.findMany({
      where: {
        feeSubscriptionId: { in: subscriptionIds },
        billingMonth,
        billingYear,
      },
      select: {
        feeSubscriptionId: true,
        billingMonth: true,
        billingYear: true,
      },
    });

    return rawList.map(
      (raw: { feeSubscriptionId: string; billingMonth: number; billingYear: number }) => ({
        subscriptionId: raw.feeSubscriptionId,
        billingMonth: raw.billingMonth,
        billingYear: raw.billingYear,
      }),
    );
  }

  /** Busca todos los cargos de una cuenta de socio. */
  async findByMemberAccountId(memberAccountId: MemberAccountId): Promise<Charge[]> {
    const rawList = await this.prisma.charge.findMany({
      where: { memberAccountId: memberAccountId.toValue() },
      orderBy: [{ billingYear: 'desc' }, { billingMonth: 'desc' }, { createdAt: 'desc' }],
    });

    return rawList.map((raw: PrismaRawCharge) => this.toDomain(raw));
  }

  /** Busca los cargos pendientes de una cuenta de socio. */
  async findPendingByMemberAccountId(memberAccountId: MemberAccountId): Promise<Charge[]> {
    const rawList = await this.prisma.charge.findMany({
      where: {
        memberAccountId: memberAccountId.toValue(),
        status: 'PENDING',
      },
      orderBy: [{ billingYear: 'asc' }, { billingMonth: 'asc' }],
    });

    return rawList.map((raw: PrismaRawCharge) => this.toDomain(raw));
  }

  /**
   * Reconstituye una entidad Charge a partir de los datos de Prisma.
   */
  private toDomain(raw: PrismaRawCharge): Charge {
    return Charge.reconstitute({
      id: raw.id,
      subscriptionId: raw.feeSubscriptionId,
      baseAmount: raw.baseAmount,
      finalAmount: raw.finalAmount,
      description: raw.description,
      fiscalYearId: raw.fiscalYearId,
      billingMonth: raw.billingMonth,
      billingYear: raw.billingYear,
      issueDate: raw.issueDate,
      dueDate: raw.dueDate,
      status: raw.status,
      paidAmount: raw.paidAmount,
      isProrated: raw.isProrated,
      isManual: raw.isManual,
      createdAt: raw.createdAt,
    });
  }
}

/** Tipo auxiliar para los datos crudos de Prisma. */
interface PrismaRawCharge {
  id: string;
  memberAccountId: string;
  feeSubscriptionId: string | null;
  baseAmount: number;
  finalAmount: number;
  description: string;
  fiscalYearId: string | null;
  billingMonth: number | null;
  billingYear: number;
  issueDate: Date;
  dueDate: Date;
  status: string;
  paidAmount: number;
  isProrated: boolean;
  isManual: boolean;
  createdAt: Date;
}
