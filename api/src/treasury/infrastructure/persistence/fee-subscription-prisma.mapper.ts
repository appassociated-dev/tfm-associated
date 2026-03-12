import { FeeSubscription } from '../../domain/entities/fee-subscription';

/**
 * Datos de una FeeSubscription tal como los devuelve el Prisma Client (camelCase).
 * Prisma usa @map() para mapear camelCase → snake_case en la BD,
 * pero el modelo en el cliente siempre usa camelCase.
 *
 * Los campos Decimal de Prisma (typeDiscount, personalDiscount) se reciben
 * como objetos Decimal del runtime de Prisma. Se convierten a number con Number().
 */
export interface PrismaRawFeeSubscription {
  id: string;
  memberAccountId: string;
  feePlanId: string;
  registrationDate: Date;
  leaveDate: Date | null;
  cancelReason: string | null;
  typeDiscount: { toNumber(): number } | number;
  personalDiscount: { toNumber(): number } | number;
  personalDiscountReason: string | null;
  effectiveAmount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y la entidad de dominio FeeSubscription.
 */
export class FeeSubscriptionPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a una entidad FeeSubscription.
   * Utiliza FeeSubscription.reconstitute() para evitar emisión de eventos.
   * Los campos Decimal de Prisma se convierten a number con Number().
   */
  static toDomain(raw: PrismaRawFeeSubscription): FeeSubscription {
    return FeeSubscription.reconstitute({
      id: raw.id,
      feePlanId: raw.feePlanId,
      registrationDate: raw.registrationDate,
      leaveDate: raw.leaveDate,
      typeDiscount: Number(raw.typeDiscount),
      personalDiscount: Number(raw.personalDiscount),
      effectiveAmount: raw.effectiveAmount,
      personalDiscountReason: raw.personalDiscountReason,
      cancelReason: raw.cancelReason,
      createdAt: raw.createdAt,
    });
  }

  /**
   * Convierte una entidad FeeSubscription a un objeto plano para persistencia.
   * Usa camelCase como espera el Prisma Client (el schema mapea a snake_case en BD).
   */
  static toPersistence(subscription: FeeSubscription): Record<string, unknown> {
    return {
      id: subscription.id.toValue(),
      feePlanId: subscription.feePlanId.toValue(),
      registrationDate: subscription.registrationDate,
      leaveDate: subscription.leaveDate,
      cancelReason: subscription.cancelReason?.value ?? null,
      typeDiscount: subscription.discount.typeDiscount,
      personalDiscount: subscription.discount.personalDiscount,
      personalDiscountReason: subscription.personalDiscountReason,
      effectiveAmount: subscription.effectiveAmount.amount,
      status: subscription.isActive() ? 'ACTIVE' : 'CLOSED',
      createdAt: subscription.createdAt,
    };
  }
}
