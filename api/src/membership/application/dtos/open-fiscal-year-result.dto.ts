import { ApiProperty } from '@nestjs/swagger';
import { FiscalYearResponseDto } from './fiscal-year-response.dto';

/**
 * DTO de resultado de la operación de apertura de ejercicio fiscal.
 * Incluye información sobre socios trasladados y transiciones aplicadas.
 */
export class OpenFiscalYearResultDto {
  @ApiProperty({ description: 'Datos del ejercicio fiscal creado' })
  fiscalYear!: FiscalYearResponseDto;

  @ApiProperty({
    description: 'Número de socios trasladados del ejercicio anterior',
    example: 0,
  })
  carriedOverMembers!: number;

  @ApiProperty({
    description: 'Transiciones automáticas de tipo de socio aplicadas',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        memberId: { type: 'string' },
        previousType: { type: 'string' },
        newType: { type: 'string' },
      },
    },
    example: [],
  })
  appliedTransitions!: Array<{
    memberId: string;
    previousType: string;
    newType: string;
  }>;
}
