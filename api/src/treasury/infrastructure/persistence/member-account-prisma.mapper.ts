import { MemberAccount } from '../../domain/aggregates/member-account';
import {
  FeeSubscriptionPrismaMapper,
  PrismaRawFeeSubscription,
} from './fee-subscription-prisma.mapper';

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

    return MemberAccount.reconstitute({
      id: raw.id,
      memberId: raw.memberId,
      tenantId,
      subscriptions,
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
    };
  }
}
