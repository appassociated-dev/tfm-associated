import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de resultado de la comparación entre ejercicios fiscales.
 * Presenta estadísticas de socios para cada ejercicio comparado.
 */
export class FiscalYearComparisonDto {
  @ApiProperty({
    description: 'Datos comparativos de cada ejercicio fiscal',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fiscalYearId: { type: 'string' },
        name: { type: 'string' },
        activeMembers: { type: 'number' },
        newMembers: { type: 'number' },
        leavingMembers: { type: 'number' },
        retentionRate: { type: 'number' },
      },
    },
  })
  years!: Array<{
    fiscalYearId: string;
    name: string;
    activeMembers: number;
    newMembers: number;
    leavingMembers: number;
    retentionRate: number;
  }>;
}
