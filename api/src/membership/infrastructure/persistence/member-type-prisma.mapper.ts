import { MemberType } from '../../domain/aggregates/member-type';

/**
 * Datos de un MemberType tal como los devuelve el Prisma Client (camelCase).
 * Prisma usa @map() para mapear camelCase → snake_case en la BD,
 * pero el modelo en el cliente siempre usa camelCase.
 */
export interface PrismaRawMemberType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  ageRangeMin: number | null;
  ageRangeMax: number | null;
  votingRight: boolean;
  eligibleForOffice: boolean;
  minimumSeniorityForVoting: number;
  minimumSeniorityForOffice: number;
  automaticTransitionTargetId: string | null;
  rulesConfig: unknown;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y el aggregate de dominio MemberType.
 */
export class MemberTypePrismaMapper {
  /**
   * Convierte un registro del Prisma Client a un aggregate MemberType.
   * Utiliza MemberType.reconstitute() para evitar emisión de eventos.
   *
   * NOTA: collectivityType no se almacena en la BD de tenant porque es
   * implícito al tenant. Se usa un valor por defecto para la reconstitución.
   */
  static toDomain(raw: PrismaRawMemberType, collectivityType = 'PENA'): MemberType {
    return MemberType.reconstitute({
      id: raw.id,
      code: raw.code,
      name: raw.name,
      description: raw.description ?? '',
      ageRangeMin: raw.ageRangeMin,
      ageRangeMax: raw.ageRangeMax,
      votingRight: raw.votingRight,
      eligibleForOffice: raw.eligibleForOffice,
      minimumSeniorityForVoting: raw.minimumSeniorityForVoting,
      minimumSeniorityForOffice: raw.minimumSeniorityForOffice,
      automaticTransitionTargetId: raw.automaticTransitionTargetId,
      rulesConfig: (raw.rulesConfig as object) ?? {},
      collectivityType,
      active: raw.active,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Convierte un aggregate MemberType a un objeto plano para persistencia.
   * Usa camelCase como espera el Prisma Client (el schema mapea a snake_case en BD).
   */
  static toPersistence(memberType: MemberType): Record<string, unknown> {
    return {
      id: memberType.id.toValue(),
      code: memberType.code.value,
      name: memberType.name,
      description: memberType.description,
      ageRangeMin: memberType.ageRange.min,
      ageRangeMax: memberType.ageRange.max,
      votingRight: memberType.votingRight,
      eligibleForOffice: memberType.eligibleForOffice,
      minimumSeniorityForVoting: memberType.minimumSeniorityForVoting,
      minimumSeniorityForOffice: memberType.minimumSeniorityForOffice,
      automaticTransitionTargetId: memberType.automaticTransitionTargetId
        ? memberType.automaticTransitionTargetId.toValue()
        : null,
      rulesConfig: memberType.rulesConfig.getRaw(),
      active: memberType.active,
      createdAt: memberType.createdAt,
      updatedAt: memberType.updatedAt,
    };
  }
}
