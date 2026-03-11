import { IsUUID, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para el cambio de plan de cuota de una suscripción activa.
 * Validado con class-validator y documentado con Swagger.
 */
export class ChangePlanDto {
  @ApiProperty({
    description: 'ID del nuevo plan de cuota (UUID v4)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'El newFeePlanId debe ser un UUID v4 válido.' })
  newFeePlanId!: string;

  @ApiProperty({
    description: 'Fecha efectiva del cambio de plan (ISO 8601)',
    example: '2026-04-01',
  })
  @IsDateString(
    {},
    { message: 'La fecha efectiva debe ser una cadena de fecha válida (ISO 8601).' },
  )
  effectiveDate!: string;

  @ApiPropertyOptional({
    description: 'Indica si se mantiene el descuento actual en la nueva suscripción',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'maintainDiscount debe ser un valor booleano.' })
  maintainDiscount?: boolean;
}
