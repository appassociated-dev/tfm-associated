import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de entrada para la generación masiva de cargos mensuales.
 * Validado con class-validator y documentado con Swagger.
 */
export class GenerateMonthlyChargesDto {
  @ApiProperty({
    description: 'Mes de facturación (1-12)',
    example: 4,
    minimum: 1,
    maximum: 12,
  })
  @IsInt({ message: 'El mes debe ser un número entero.' })
  @Min(1, { message: 'El mes debe ser al menos 1.' })
  @Max(12, { message: 'El mes no puede ser mayor que 12.' })
  month!: number;

  @ApiProperty({
    description: 'Año de facturación',
    example: 2025,
    minimum: 2020,
  })
  @IsInt({ message: 'El año debe ser un número entero.' })
  @Min(2020, { message: 'El año debe ser al menos 2020.' })
  year!: number;
}
