import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de respuesta para una plantilla de plan de cuota.
 * Representa una plantilla predefinida que puede importarse.
 */
export class FeePlanTemplateResponseDto {
  @ApiProperty({ description: 'Código de la plantilla' })
  code!: string;

  @ApiProperty({ description: 'Nombre del plan de cuota' })
  name!: string;

  @ApiPropertyOptional({ description: 'Descripción del plan de cuota' })
  description!: string | null;

  @ApiProperty({ description: 'Tipo de plan: ONE_TIME o RECURRING' })
  type!: string;

  @ApiProperty({ description: 'Frecuencia de cobro' })
  frequency!: string;

  @ApiProperty({ description: 'Importe en centavos' })
  amount!: number;

  @ApiProperty({ description: 'Importe formateado en unidades (e.g., "120.00 EUR")' })
  amountFormatted!: string;

  @ApiProperty({ description: 'Meses de facturación (1-12)', type: [Number] })
  billingMonths!: number[];

  @ApiProperty({ description: 'Tipo de colectividad para el que aplica' })
  collectivityType!: string;
}
