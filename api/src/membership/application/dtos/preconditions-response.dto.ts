import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Información básica del plan de alta para mostrar en el frontend.
 */
export class RegistrationPlanInfoDto {
  @ApiProperty({ description: 'ID del plan de alta' })
  feePlanId!: string;

  @ApiProperty({ description: 'Nombre del plan de alta' })
  name!: string;

  @ApiProperty({ description: 'Importe en centavos' })
  amount!: number;
}

/**
 * DTO de respuesta para la validación de precondiciones del alta (UC-011).
 * Indica el estado de cada precondición necesaria para registrar un socio.
 */
export class PreconditionsResponseDto {
  @ApiProperty({ description: 'Indica si existe un ejercicio fiscal abierto' })
  hasFiscalYear!: boolean;

  @ApiProperty({ description: 'Indica si existen tipos de socio activos' })
  hasMemberTypes!: boolean;

  @ApiProperty({ description: 'Indica si existe un plan de alta activo (ONE_TIME)' })
  hasRegistrationPlan!: boolean;

  @ApiPropertyOptional({
    description: 'Información del plan de alta activo (si existe)',
    type: RegistrationPlanInfoDto,
  })
  registrationPlan?: RegistrationPlanInfoDto;

  @ApiProperty({
    description: 'Lista de errores de precondición',
    type: [String],
  })
  errors!: string[];
}
