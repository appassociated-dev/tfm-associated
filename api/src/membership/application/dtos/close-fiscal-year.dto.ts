import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de entrada para el cierre de un ejercicio fiscal.
 * Validado con class-validator y documentado con Swagger.
 */
export class CloseFiscalYearDto {
  @ApiProperty({
    description: 'Forzar el cierre ignorando advertencias pendientes',
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'force debe ser un booleano.' })
  force!: boolean;
}
