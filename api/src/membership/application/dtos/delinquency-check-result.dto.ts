import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de salida con el resultado del proceso de verificación de morosidad.
 */
export class DelinquencyCheckResultDto {
  @ApiProperty({ description: 'Número total de socios procesados' })
  processedCount!: number;

  @ApiProperty({ description: 'Número de socios transicionados a PENDING_PAYMENT' })
  transitionedCount!: number;

  @ApiProperty({
    description: 'Errores ocurridos durante el procesamiento',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        memberId: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  errors!: Array<{ memberId: string; error: string }>;
}
