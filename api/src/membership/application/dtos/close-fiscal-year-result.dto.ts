import { ApiProperty } from '@nestjs/swagger';
import { FiscalYearResponseDto } from './fiscal-year-response.dto';

/**
 * DTO de resultado de la operación de cierre de ejercicio fiscal.
 * Incluye advertencias generadas durante la validación pre-cierre.
 */
export class CloseFiscalYearResultDto {
  @ApiProperty({ description: 'Datos del ejercicio fiscal cerrado' })
  fiscalYear!: FiscalYearResponseDto;

  @ApiProperty({
    description: 'Advertencias generadas durante el cierre',
    type: [String],
    example: [],
  })
  warnings!: string[];
}
