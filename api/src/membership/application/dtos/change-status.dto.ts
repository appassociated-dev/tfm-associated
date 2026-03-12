import { IsIn, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Valores válidos para el estado del socio. */
const MEMBER_STATUS_VALUES = [
  'ACTIVE',
  'PENDING_PAYMENT',
  'SUSPENDED',
  'APPLICANT',
  'VOLUNTARY_LEAVE',
  'NONPAYMENT_LEAVE',
  'DISCIPLINARY_LEAVE',
  'DECEASED',
] as const;

/**
 * DTO de entrada para cambiar el estado de un socio.
 * Validado con class-validator y documentado con Swagger.
 */
export class ChangeStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del socio',
    enum: MEMBER_STATUS_VALUES,
    example: 'SUSPENDED',
  })
  @IsIn(MEMBER_STATUS_VALUES, {
    message: `El estado debe ser uno de: ${MEMBER_STATUS_VALUES.join(', ')}.`,
  })
  newStatus!: string;

  @ApiProperty({
    description: 'Motivo del cambio de estado (3-500 caracteres)',
    example: 'Impago de cuotas durante más de 90 días',
    minLength: 3,
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'El motivo es obligatorio.' })
  @IsString({ message: 'El motivo debe ser una cadena de texto.' })
  @MinLength(3, { message: 'El motivo debe tener al menos 3 caracteres.' })
  @MaxLength(500, { message: 'El motivo no puede exceder 500 caracteres.' })
  reason!: string;
}
