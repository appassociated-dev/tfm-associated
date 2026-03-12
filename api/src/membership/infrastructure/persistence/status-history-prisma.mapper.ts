import { StatusHistory } from '../../domain/entities/status-history';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { StatusChangeReason } from '../../domain/value-objects/status-change-reason';

/**
 * Datos de un StatusHistory tal como los devuelve el Prisma Client.
 * El modelo StatusHistory en schema.prisma usa snake_case sin @map(),
 * por lo que el Prisma Client también usa snake_case.
 */
export interface PrismaRawStatusHistory {
  id: string;
  member_id: string;
  previous_status: string;
  new_status: string;
  reason: string;
  changed_by: string;
  changed_at: Date;
}

/**
 * Mapper estático para convertir entre el modelo de persistencia Prisma
 * y la entidad de dominio StatusHistory.
 */
export class StatusHistoryPrismaMapper {
  /**
   * Convierte un registro del Prisma Client a una entidad StatusHistory.
   * Utiliza StatusHistory.reconstitute() para evitar validar invariantes.
   */
  static toDomain(raw: PrismaRawStatusHistory): StatusHistory {
    // Crear el StatusChangeReason; al reconstituir desde BD asumimos datos válidos
    const reasonResult = StatusChangeReason.create(raw.reason);
    if (!reasonResult.ok) {
      // Fallback: si el dato almacenado no cumple invariantes actuales,
      // usamos reconstitute directamente con un reason válido mínimo.
      throw new Error(
        `Dato corrupto en status_history.reason para id '${raw.id}': ${reasonResult.error.message}`,
      );
    }

    return StatusHistory.reconstitute({
      id: raw.id,
      memberId: MemberId.fromString(raw.member_id),
      previousStatus: MemberStatus.fromString(raw.previous_status),
      newStatus: MemberStatus.fromString(raw.new_status),
      reason: reasonResult.value,
      changedBy: raw.changed_by,
      changedAt: raw.changed_at,
    });
  }

  /**
   * Convierte una entidad StatusHistory a un objeto plano para persistencia (INSERT).
   * Usa snake_case como espera el Prisma Client.
   */
  static toPersistence(entry: StatusHistory): Record<string, unknown> {
    return {
      id: entry.id,
      member_id: entry.memberId.toValue(),
      previous_status: entry.previousStatus.value,
      new_status: entry.newStatus.value,
      reason: entry.reason.value,
      changed_by: entry.changedBy,
      changed_at: entry.changedAt,
    };
  }
}
