import { IsUUID, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para la creación de una suscripción a un plan de cuota.
 * Validado con class-validator y documentado con Swagger.
 */
export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'ID del plan de cuota al que suscribirse (UUID v4)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'El feePlanId debe ser un UUID v4 válido.' })
  feePlanId!: string;

  @ApiProperty({
    description: 'Descuento por tipo de socio (0 a 0.99)',
    example: 0,
    default: 0,
  })
  @IsNumber({}, { message: 'El descuento por tipo debe ser un número.' })
  @Min(0, { message: 'El descuento por tipo no puede ser negativo.' })
  @Max(0.99, { message: 'El descuento por tipo no puede superar 0.99.' })
  typeDiscount: number = 0;

  @ApiPropertyOptional({
    description: 'Descuento personal (0 a 0.99)',
    example: 0.1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El descuento personal debe ser un número.' })
  @Min(0, { message: 'El descuento personal no puede ser negativo.' })
  @Max(0.99, { message: 'El descuento personal no puede superar 0.99.' })
  personalDiscount?: number;

  @ApiPropertyOptional({
    description: 'Motivo del descuento personal',
    example: 'Descuento por familia numerosa',
  })
  @IsOptional()
  @IsString({ message: 'El motivo del descuento debe ser una cadena de texto.' })
  personalDiscountReason?: string;
}
