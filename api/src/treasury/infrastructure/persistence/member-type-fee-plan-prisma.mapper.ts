import { MemberTypeFeePlan } from '../../domain/entities/member-type-fee-plan';

/**
 * Datos de un MemberTypeFeePlan tal como los devuelve el Prisma Client (camelCase).
 * La PK compuesta es (memberTypeId, feePlanId).
 * El campo displayOrder en Prisma corresponde a order en dominio.
 */
export interface PrismaRawMemberTypeFeePlan {
  memberTypeId: string;
  feePlanId: string;
  isDefault: boolean;
  displayOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y la entidad de dominio MemberTypeFeePlan.
 */
export class MemberTypeFeePlanPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a una entidad MemberTypeFeePlan.
   * Utiliza MemberTypeFeePlan.reconstitute() para evitar validación.
   * Nota: displayOrder en Prisma se mapea a order en dominio.
   */
  static toDomain(raw: PrismaRawMemberTypeFeePlan): MemberTypeFeePlan {
    return MemberTypeFeePlan.reconstitute({
      memberTypeId: raw.memberTypeId,
      feePlanId: raw.feePlanId,
      isDefault: raw.isDefault,
      order: raw.displayOrder,
      active: raw.active,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Convierte una entidad MemberTypeFeePlan a un objeto plano para persistencia.
   * Nota: order en dominio se mapea a displayOrder en Prisma.
   */
  static toPersistence(entity: MemberTypeFeePlan): Record<string, unknown> {
    return {
      memberTypeId: entity.memberTypeId,
      feePlanId: entity.feePlanId,
      isDefault: entity.isDefault,
      displayOrder: entity.order,
      active: entity.active,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
