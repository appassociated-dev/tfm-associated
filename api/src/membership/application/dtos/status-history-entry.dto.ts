import { ApiProperty } from '@nestjs/swagger';
import { StatusHistory } from '../../domain/entities/status-history';

/**
 * DTO de salida para una entrada individual del historial de estados de un socio.
 */
export class StatusHistoryEntryDto {
  @ApiProperty({ description: 'ID de la entrada de historial (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Estado anterior del socio' })
  previousStatus!: string;

  @ApiProperty({ description: 'Nuevo estado del socio' })
  newStatus!: string;

  @ApiProperty({ description: 'Motivo del cambio de estado' })
  reason!: string;

  @ApiProperty({ description: 'ID del usuario que ejecutó el cambio (o SYSTEM)' })
  changedBy!: string;

  @ApiProperty({ description: 'Fecha y hora del cambio de estado' })
  changedAt!: Date;

  /**
   * Construye un DTO a partir de la entidad de dominio StatusHistory.
   */
  static fromDomain(entry: StatusHistory): StatusHistoryEntryDto {
    const dto = new StatusHistoryEntryDto();
    dto.id = entry.id;
    dto.previousStatus = entry.previousStatus.value;
    dto.newStatus = entry.newStatus.value;
    dto.reason = entry.reason.value;
    dto.changedBy = entry.changedBy;
    dto.changedAt = entry.changedAt;
    return dto;
  }
}
