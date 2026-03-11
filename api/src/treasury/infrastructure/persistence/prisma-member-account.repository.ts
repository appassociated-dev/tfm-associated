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
  private get prisma(): any {
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

    // Persistir la cuenta de socio (upsert)
    await this.prisma.memberAccount.upsert({
      where: { id: account.id.toValue() },
      create: accountData,
      update: accountData,
    });

    // Persistir suscripciones (upsert individual)
    for (const subscription of account.subscriptions) {
      const subData = FeeSubscriptionPrismaMapper.toPersistence(subscription);
      await this.prisma.feeSubscription.upsert({
        where: { id: subscription.id.toValue() },
        create: { ...subData, memberAccountId: account.id.toValue() },
        update: subData,
      });
    }
  }

  /** Busca una cuenta de socio por su identificador único, incluyendo suscripciones. */
  async findById(id: MemberAccountId): Promise<MemberAccount | null> {
    const raw = await this.prisma.memberAccount.findUnique({
      where: { id: id.toValue() },
      include: { subscriptions: true },
    });

    return raw
      ? MemberAccountPrismaMapper.toDomain(raw as unknown as PrismaRawMemberAccount, this.tenantId)
      : null;
  }

  /** Busca una cuenta de socio por el identificador del socio asociado. */
  async findByMemberId(memberId: string): Promise<MemberAccount | null> {
    const raw = await this.prisma.memberAccount.findUnique({
      where: { memberId },
      include: { subscriptions: true },
    });

    return raw
      ? MemberAccountPrismaMapper.toDomain(raw as unknown as PrismaRawMemberAccount, this.tenantId)
      : null;
  }

  /** Verifica si ya existe una cuenta de socio para el socio dado. */
  async existsByMemberId(memberId: string): Promise<boolean> {
    const raw = await this.prisma.memberAccount.findUnique({
      where: { memberId },
    });

    return !!raw;
  }
}
