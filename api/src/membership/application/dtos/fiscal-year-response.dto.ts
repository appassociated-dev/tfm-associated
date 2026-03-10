import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FiscalYear } from '../../domain/aggregates/fiscal-year';

/**
 * DTO de respuesta para un ejercicio fiscal.
 * Representa la vista pública del aggregate FiscalYear.
 */
export class FiscalYearResponseDto {
  @ApiProperty({ description: 'ID del ejercicio fiscal (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Nombre del ejercicio fiscal' })
  name!: string;

  @ApiProperty({
    description: 'Tipo de ejercicio fiscal',
    enum: ['NATURAL_YEAR', 'SPORTS_SEASON', 'CONFRATERNITY', 'CUSTOM'],
  })
  type!: string;

  @ApiProperty({
    description: 'Estado del ejercicio fiscal',
    enum: ['PREPARATION', 'OPEN', 'CLOSED'],
  })
  status!: string;

  @ApiProperty({ description: 'Fecha de inicio del ejercicio fiscal' })
  startDate!: Date;

  @ApiProperty({ description: 'Fecha de fin del ejercicio fiscal' })
  endDate!: Date;

  @ApiPropertyOptional({ description: 'ID del ejercicio fiscal anterior (UUID)' })
  previousFiscalYearId!: string | null;

  @ApiProperty({ description: 'Número de socios al inicio del ejercicio' })
  membersAtStart!: number;

  @ApiPropertyOptional({ description: 'Número de socios al final del ejercicio' })
  membersAtEnd!: number | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiPropertyOptional({ description: 'Fecha de cierre del ejercicio fiscal' })
  closedAt!: Date | null;

  /**
   * Construye un DTO de respuesta a partir del aggregate de dominio.
   */
  static fromDomain(fiscalYear: FiscalYear): FiscalYearResponseDto {
    const dto = new FiscalYearResponseDto();
    dto.id = fiscalYear.id.toValue();
    dto.name = fiscalYear.name;
    dto.type = fiscalYear.type.value;
    dto.status = fiscalYear.status.value;
    dto.startDate = fiscalYear.period.startDate;
    dto.endDate = fiscalYear.period.endDate;
    dto.previousFiscalYearId = fiscalYear.previousFiscalYearId
      ? fiscalYear.previousFiscalYearId.toValue()
      : null;
    dto.membersAtStart = fiscalYear.membersAtStart;
    dto.membersAtEnd = fiscalYear.membersAtEnd;
    dto.createdAt = fiscalYear.createdAt;
    dto.closedAt = fiscalYear.closedAt;
    return dto;
  }
}
