import { IsNotEmpty, IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EffectiveDateType } from '../../domain/value-objects/effective-date-type';

/**
 * DTO de entrada para la baja voluntaria de un socio (UC-013).
 * Validado con class-validator y documentado con Swagger.
 */
export class VoluntaryLeaveDto {
  @ApiProperty({
    description: 'Tipo de cálculo de fecha efectiva de baja',
    enum: EffectiveDateType,
    example: 'IMMEDIATE',
  })
  @IsEnum(EffectiveDateType, {
    message:
      'effectiveDateType debe ser IMMEDIATE, END_OF_FISCAL_YEAR, END_OF_NEXT_MONTH o NOTICE_PERIOD.',
  })
  effectiveDateType!: EffectiveDateType;

  @ApiProperty({
    description: 'Motivo de la baja voluntaria',
    example: 'Traslado a otra ciudad',
    minLength: 3,
    maxLength: 500,
  })
  @IsNotEmpty({ message: 'El motivo de la baja es obligatorio.' })
  @IsString()
  @MinLength(3, { message: 'El motivo debe tener al menos 3 caracteres.' })
  @MaxLength(500, { message: 'El motivo no puede exceder 500 caracteres.' })
  reason!: string;
}
