import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para el proceso de verificación de morosidad.
 */
export class DelinquencyCheckDto {
  @ApiPropertyOptional({
    description: 'Días de retraso en el pago para considerar morosidad',
    default: 90,
    example: 90,
  })
  @IsOptional()
  @IsInt({ message: 'daysOverdue debe ser un número entero.' })
  @Min(1, { message: 'daysOverdue debe ser al menos 1.' })
  daysOverdue?: number;
}
