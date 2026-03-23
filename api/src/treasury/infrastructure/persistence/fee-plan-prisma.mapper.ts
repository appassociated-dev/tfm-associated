import { FeePlan } from '../../domain/aggregates/fee-plan';

/**
 * Datos de un FeePlan tal como los devuelve el Prisma Client (camelCase).
 * Prisma usa @map() para mapear camelCase → snake_case en la BD,
 * pero el modelo en el cliente siempre usa camelCase.
 */
export interface PrismaRawFeePlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: string;
  amount: number;
  frequency: string;
  billingMonths: number[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y el aggregate de dominio FeePlan.
 */
export class FeePlanPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a un aggregate FeePlan.
   * Utiliza FeePlan.reconstitute() para evitar emisión de eventos.
   */
  static toDomain(raw: PrismaRawFeePlan): FeePlan {
    return FeePlan.reconstitute({
      id: raw.id,
      code: raw.code,
      name: raw.name,
      description: raw.description,
      type: raw.type,
      frequency: raw.frequency,
      amount: raw.amount,
      billingMonths: raw.billingMonths,
      active: raw.active,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Convierte un aggregate FeePlan a un objeto plano para persistencia.
   * Usa camelCase como espera el Prisma Client (el schema mapea a snake_case en BD).
   */
  static toPersistence(feePlan: FeePlan): Record<string, unknown> {
    return {
      id: feePlan.id.toValue(),
      code: feePlan.code.value,
      name: feePlan.name,
      description: feePlan.description,
      type: feePlan.type.value,
      frequency: feePlan.frequency.value,
      amount: feePlan.amount.amount,
      billingMonths: [...feePlan.billingMonths.months],
      active: feePlan.active,
      createdAt: feePlan.createdAt,
      updatedAt: feePlan.updatedAt,
    };
  }
}
