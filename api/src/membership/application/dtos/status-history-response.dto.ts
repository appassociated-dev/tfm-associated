import { ApiProperty } from '@nestjs/swagger';
import { StatusHistoryEntryDto } from './status-history-entry.dto';

/**
 * DTO de salida para el historial completo de estados de un socio.
 */
export class StatusHistoryResponseDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiProperty({ description: 'Estado actual del socio' })
  currentStatus!: string;

  @ApiProperty({
    description: 'Entradas del historial de estados, ordenadas cronológicamente (DESC)',
    type: [StatusHistoryEntryDto],
  })
  entries!: StatusHistoryEntryDto[];
}
