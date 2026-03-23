import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsEnum,
  Min,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para la creación de un plan de cuota.
 * Validado con class-validator y documentado con Swagger.
 */
export class CreateFeePlanDto {
  @ApiProperty({
    description: 'Código único del plan de cuota (2-20 caracteres [A-Z0-9_-])',
    example: 'CUOTA-ANUAL',
  })
  @IsNotEmpty({ message: 'El código es obligatorio.' })
  @IsString()
  @MaxLength(20, { message: 'El código no puede exceder 20 caracteres.' })
  code!: string;

  @ApiProperty({
    description: 'Nombre del plan de cuota',
    example: 'Cuota Anual Socio Numerario',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Descripción del plan de cuota',
    example: 'Plan de cuota anual para socios numerarios',
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({
    description: 'Tipo de plan: ONE_TIME o RECURRING',
    example: 'RECURRING',
    enum: ['ONE_TIME', 'RECURRING'],
  })
  @IsNotEmpty({ message: 'El tipo de plan es obligatorio.' })
  @IsEnum(['ONE_TIME', 'RECURRING'], {
    message: 'El tipo de plan debe ser ONE_TIME o RECURRING.',
  })
  type!: string;

  @ApiPropertyOptional({
    description:
      'Frecuencia de cobro: MONTHLY, QUARTERLY, BIANNUAL, ANNUAL, CUSTOM. Obligatoria para RECURRING, ignorada para ONE_TIME',
    example: 'ANNUAL',
    enum: ['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'],
  })
  @IsOptional()
  @IsEnum(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'], {
    message: 'La frecuencia debe ser MONTHLY, QUARTERLY, BIANNUAL, ANNUAL o CUSTOM.',
  })
  frequency?: string | null;

  @ApiProperty({
    description: 'Importe en centavos (entero >= 0)',
    example: 12000,
  })
  @IsInt({ message: 'El importe debe ser un número entero (centavos).' })
  @Min(0, { message: 'El importe no puede ser negativo.' })
  amount!: number;

  @ApiProperty({
    description: 'Meses de facturación (1-12). Obligatorio para RECURRING, vacío para ONE_TIME',
    example: [1, 7],
    type: [Number],
  })
  @IsArray({ message: 'billingMonths debe ser un array.' })
  @IsInt({ each: true, message: 'Cada mes debe ser un número entero.' })
  @Min(1, { each: true, message: 'Cada mes debe estar entre 1 y 12.' })
  @ArrayMaxSize(12, { message: 'No puede haber más de 12 meses de facturación.' })
  billingMonths!: number[];
}
