import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({
    description: 'Lista de errores de precondición',
    type: [String],
  })
  errors!: string[];
}
