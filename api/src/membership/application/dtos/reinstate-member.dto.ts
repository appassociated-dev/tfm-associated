import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de entrada para la rehabilitación de un socio (UC-013).
 * Requiere confirmación explícita del pago de deuda pendiente.
 */
export class ReinstateMemberDto {
  @ApiProperty({
    description: 'Confirmación de que se ha pagado la deuda pendiente (debe ser true)',
    example: true,
  })
  @IsBoolean({ message: 'paymentConfirmed debe ser un valor booleano.' })
  paymentConfirmed!: boolean;
}
