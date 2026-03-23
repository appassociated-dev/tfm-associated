import { Injectable } from '@nestjs/common';
import { MemberAccountRepository } from '../../domain/repositories/member-account.repository';
import { MemberAccount } from '../../domain/aggregates/member-account';
import { MemberAccountId } from '../../domain/value-objects/member-account-id';
import { PrismaTenantService } from '../../../shared/infrastructure/persistence/prisma-tenant.service';
import { MemberAccountPrismaMapper, PrismaRawMemberAccount } from './member-account-prisma.mapper';
import { FeeSubscriptionPrismaMapper } from './fee-subscription-prisma.mapper';

/**
 * Implementación Prisma del repositorio de MemberAccount.
 * Opera contra las tablas `member_accounts` y `fee_subscriptions` de la BD del tenant (ADR-002).
 * Requiere tenantId para obtener el PrismaClient correcto del pool.
 */
@Injectable()
export class PrismaMemberAccountRepository implements MemberAccountRepository {
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
        'tenantId no establecido en PrismaMemberAccountRepository. Llamar setTenantId() primero.',
      );
    }
    return this.prismaTenantService.getClient(this.tenantId);
  }

  /**
   * Persiste una cuenta de socio y todas sus suscripciones.
   * Usa upsert para la cuenta y upsert individual para cada suscripción.
   */
  async save(account: MemberAccount): Promise<void> {
    const accountData = MemberAccountPrismaMapper.toPersistence(account);

    await (
      await this.getPrisma()
    ).$transaction(
      async (tx: {
        [model: string]: { upsert: (args: Record<string, unknown>) => Promise<unknown> };
      }) => {
        await tx.memberAccount.upsert({
          where: { id: account.id.toValue() },
          create: {
            id: accountData.id,
            memberId: accountData.memberId,
            createdAt: accountData.createdAt,
          },
          update: {
            memberId: accountData.memberId,
          },
        });

        for (const subscription of account.subscriptions) {
          const subData = FeeSubscriptionPrismaMapper.toPersistence(subscription);
          await tx.feeSubscription.upsert({
            where: { id: subscription.id.toValue() },
            create: { ...subData, memberAccountId: account.id.toValue() },
            update: subData,
          });
        }

        for (const charge of account.charges) {
          const chargeData = {
            id: charge.id.toValue(),
            memberAccountId: account.id.toValue(),
            feeSubscriptionId: charge.subscriptionId?.toValue() ?? null,
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

          await tx.charge.upsert({
            where: { id: charge.id.toValue() },
            create: chargeData,
            update: chargeData,
          });
        }

        for (const payment of account.payments) {
          const paymentData = {
            id: payment.id.toValue(),
            memberAccountId: account.id.toValue(),
            chargeId: payment.chargeId.toValue(),
            amount: payment.amount.amount,
            paymentMethod: payment.paymentMethod.value,
            paymentDate: payment.paymentDate,
            paymentReference: payment.paymentReference.value,
            receiptNumber: payment.receiptNumber?.value ?? null,
            notes: payment.notes,
            registeredBy: payment.registeredBy,
            status: payment.status.value,
            createdAt: payment.createdAt,
          };

          await tx.payment.upsert({
            where: { id: payment.id.toValue() },
            create: paymentData,
            update: paymentData,
          });
        }
      },
    );
  }

  /** Busca una cuenta de socio por su identificador único, incluyendo suscripciones. */
  async findById(id: MemberAccountId): Promise<MemberAccount | null> {
    const raw = await (
      await this.getPrisma()
    ).memberAccount.findUnique({
      where: { id: id.toValue() },
      include: { subscriptions: true, charges: true, payments: true },
    });

    return raw
      ? MemberAccountPrismaMapper.toDomain(raw as unknown as PrismaRawMemberAccount, this.tenantId)
      : null;
  }

  /** Busca una cuenta de socio por el identificador del socio asociado. */
  async findByMemberId(memberId: string): Promise<MemberAccount | null> {
    const raw = await (
      await this.getPrisma()
    ).memberAccount.findUnique({
      where: { memberId },
      include: { subscriptions: true, charges: true, payments: true },
    });

    return raw
      ? MemberAccountPrismaMapper.toDomain(raw as unknown as PrismaRawMemberAccount, this.tenantId)
      : null;
  }

  /** Verifica si ya existe una cuenta de socio para el socio dado. */
  async existsByMemberId(memberId: string): Promise<boolean> {
    const raw = await (
      await this.getPrisma()
    ).memberAccount.findUnique({
      where: { memberId },
    });

    return !!raw;
  }

  /**
   * Obtiene todas las cuentas de socio que tienen al menos una suscripción activa.
   * Incluye las suscripciones para poder evaluar las activas en el dominio.
   */
  async findAllWithActiveSubscriptions(): Promise<MemberAccount[]> {
    const rawList = await (
      await this.getPrisma()
    ).memberAccount.findMany({
      where: {
        subscriptions: {
          some: { status: 'ACTIVE' },
        },
      },
      include: { subscriptions: true, charges: true, payments: true },
    });

    return rawList.map((raw: unknown) =>
      MemberAccountPrismaMapper.toDomain(raw as PrismaRawMemberAccount, this.tenantId),
    );
  }
}
