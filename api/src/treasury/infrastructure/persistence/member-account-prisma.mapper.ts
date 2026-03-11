import { MemberAccount } from '../../domain/aggregates/member-account';
import { Charge } from '../../domain/entities/charge';
import { Payment } from '../../domain/entities/payment';
import {
  FeeSubscriptionPrismaMapper,
  PrismaRawFeeSubscription,
} from './fee-subscription-prisma.mapper';
import { PrismaRawPayment, PaymentPrismaMapper } from './payment-prisma.mapper';

/**
 * Datos de un MemberAccount tal como los devuelve el Prisma Client (camelCase).
 * Prisma usa @map() para mapear camelCase → snake_case en la BD,
 * pero el modelo en el cliente siempre usa camelCase.
 */
export interface PrismaRawMemberAccount {
  id: string;
  memberId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  subscriptions?: PrismaRawFeeSubscription[];
  charges?: PrismaRawCharge[];
  payments?: PrismaRawPayment[];
}

export interface PrismaRawCharge {
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

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y el aggregate de dominio MemberAccount.
 */
export class MemberAccountPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a un aggregate MemberAccount.
   * Utiliza MemberAccount.reconstitute() para evitar emisión de eventos.
   * Mapea las suscripciones incluidas usando FeeSubscriptionPrismaMapper.
   */
  static toDomain(raw: PrismaRawMemberAccount, tenantId: string): MemberAccount {
    const subscriptions = (raw.subscriptions ?? []).map((sub) =>
      FeeSubscriptionPrismaMapper.toDomain(sub),
    );
    const charges = (raw.charges ?? []).map((charge) =>
      MemberAccountPrismaMapper.chargeToDomain(charge),
    );
    const payments = (raw.payments ?? []).map((payment) => PaymentPrismaMapper.toDomain(payment));

    return MemberAccount.reconstitute({
      id: raw.id,
      memberId: raw.memberId,
      tenantId,
      subscriptions,
      charges,
      payments,
      createdAt: raw.createdAt,
    });
  }

  /**
   * Convierte un aggregate MemberAccount a un objeto plano para persistencia.
   * No incluye suscripciones — se gestionan por separado en el repositorio.
   * Usa camelCase como espera el Prisma Client (el schema mapea a snake_case en BD).
   */
  static toPersistence(account: MemberAccount): Record<string, unknown> {
    return {
      id: account.id.toValue(),
      memberId: account.memberId,
      createdAt: account.createdAt,
      charges: account.charges.map((charge) =>
        MemberAccountPrismaMapper.chargeToPersistence(charge),
      ),
      payments: account.payments.map((payment) =>
        PaymentPrismaMapper.toPersistence(payment, account.id.toValue()),
      ),
    };
  }

  private static chargeToDomain(raw: PrismaRawCharge): Charge {
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

  private static chargeToPersistence(charge: Charge): Record<string, unknown> {
    return {
      id: charge.id.toValue(),
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
  }
}
