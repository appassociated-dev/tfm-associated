import { Member, ReconstituteMemberProps } from '../../domain/aggregates/member';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberTypeId } from '../../domain/value-objects/member-type-id';
import { MemberStatus } from '../../domain/value-objects/member-status';

/**
 * Datos de un Member tal como los devuelve el Prisma Client.
 * El modelo Member en schema.prisma usa snake_case sin @map(),
 * por lo que el Prisma Client también usa snake_case.
 */
export interface PrismaRawMember {
  id: string;
  member_type_id: string;
  current_status: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y el aggregate de dominio Member.
 */
export class MemberPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a un aggregate Member.
   * Utiliza Member.reconstitute() para evitar emisión de eventos.
   */
  static toDomain(raw: PrismaRawMember): Member {
    return Member.reconstitute({
      id: MemberId.fromString(raw.id),
      memberTypeId: MemberTypeId.fromString(raw.member_type_id),
      currentStatus: MemberStatus.fromString(raw.current_status),
      statusHistory: [], // El historial se carga por separado via StatusHistoryRepository
      version: raw.version,
    } as ReconstituteMemberProps);
  }

  /**
   * Convierte un aggregate Member a un objeto plano para persistencia.
   * Usa snake_case como espera el Prisma Client (el schema no tiene @map en Member).
   */
  static toPersistence(member: Member): Record<string, unknown> {
    return {
      id: member.id.toValue(),
      member_type_id: member.memberTypeId.toValue(),
      current_status: member.getCurrentStatus().value,
      version: member.version,
    };
  }
}
