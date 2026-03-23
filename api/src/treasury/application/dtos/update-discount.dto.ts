import { IsNumber, IsNotEmpty, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para la actualización del descuento personal de una suscripción.
 * Validado con class-validator y documentado con Swagger.
 */
export class UpdateDiscountDto {
  @ApiProperty({
    description: 'Nuevo descuento personal (0 a 0.99)',
    example: 0.15,
  })
  @IsNumber({}, { message: 'El nuevo descuento personal debe ser un número.' })
  @Min(0, { message: 'El descuento personal no puede ser negativo.' })
  @Max(0.99, { message: 'El descuento personal no puede superar 0.99.' })
  newPersonalDiscount!: number;

  @ApiProperty({
    description: 'Motivo de la actualización del descuento',
    example: 'Revisión anual de descuentos por antigüedad',
  })
  @IsNotEmpty({ message: 'El motivo es obligatorio.' })
  @IsString({ message: 'El motivo debe ser una cadena de texto.' })
  reason!: string;

  @ApiPropertyOptional({
    description: 'Persona que aprobó el descuento',
    example: 'admin@asociacion.es',
  })
  @IsOptional()
  @IsString({ message: 'approvedBy debe ser una cadena de texto.' })
  approvedBy?: string;
}
