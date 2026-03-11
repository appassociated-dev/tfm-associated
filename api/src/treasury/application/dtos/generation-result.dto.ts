import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Detalle de un error ocurrido durante la generación de cargos.
 */
export class GenerationErrorDetail {
  @ApiProperty({ description: 'ID de la suscripción que provocó el error' })
  subscriptionId!: string;

  @ApiProperty({ description: 'Mensaje de error descriptivo' })
  error!: string;
}

/**
 * DTO de salida con el resultado de la generación masiva de cargos.
 * Incluye contadores de éxito, duplicados y errores.
 */
export class GenerationResultDto {
  @ApiProperty({ description: 'ID del tenant procesado' })
  tenantId!: string;

  @ApiProperty({ description: 'Mes de facturación procesado (1-12)' })
  month!: number;

  @ApiProperty({ description: 'Año de facturación procesado' })
  year!: number;

  @ApiProperty({ description: 'Total de suscripciones evaluadas' })
  subscriptionsEvaluated!: number;

  @ApiProperty({ description: 'Total de cargos generados exitosamente' })
  chargesGenerated!: number;

  @ApiProperty({ description: 'Importe total generado en centavos' })
  totalAmount!: number;

  @ApiProperty({ description: 'Importe total formateado en euros (e.g., "150.00 EUR")' })
  totalAmountFormatted!: string;

  @ApiProperty({ description: 'Suscripciones omitidas por cargo duplicado' })
  duplicatesSkipped!: number;

  @ApiProperty({ description: 'Total de errores ocurridos' })
  errorsCount!: number;

  @ApiPropertyOptional({
    description: 'Detalle de errores por suscripción',
    type: [GenerationErrorDetail],
  })
  errors!: GenerationErrorDetail[];

  @ApiProperty({ description: 'Duración del proceso en milisegundos' })
  durationMs!: number;

  /**
   * Construye un GenerationResultDto con los valores dados.
   */
  static create(params: {
    tenantId: string;
    month: number;
    year: number;
    subscriptionsEvaluated: number;
    chargesGenerated: number;
    totalAmount: number;
    duplicatesSkipped: number;
    errorsCount: number;
    errors: Array<{ subscriptionId: string; error: string }>;
    durationMs: number;
  }): GenerationResultDto {
    const dto = new GenerationResultDto();
    dto.tenantId = params.tenantId;
    dto.month = params.month;
    dto.year = params.year;
    dto.subscriptionsEvaluated = params.subscriptionsEvaluated;
    dto.chargesGenerated = params.chargesGenerated;
    dto.totalAmount = params.totalAmount;
    dto.totalAmountFormatted = `${(params.totalAmount / 100).toFixed(2)} EUR`;
    dto.duplicatesSkipped = params.duplicatesSkipped;
    dto.errorsCount = params.errorsCount;
    dto.errors = params.errors;
    dto.durationMs = params.durationMs;
    return dto;
  }
}
