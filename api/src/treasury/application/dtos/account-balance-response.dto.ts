import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de respuesta para el balance pendiente de una cuenta de socio.
 */
export class AccountBalanceResponseDto {
  @ApiProperty({ description: 'ID de la cuenta de socio (UUID)' })
  memberAccountId!: string;

  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiProperty({ description: 'Nombre completo del socio' })
  memberName!: string;

  @ApiProperty({ description: 'Número de socio' })
  memberNumber!: string;

  @ApiProperty({ description: 'Importe total pendiente en centavos' })
  totalPending!: number;

  @ApiProperty({ description: 'Importe total pendiente formateado en euros (e.g., "150.00 EUR")' })
  totalPendingFormatted!: string;

  @ApiProperty({ description: 'Número de cargos pendientes' })
  chargeCount!: number;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento más antigua de los cargos pendientes' })
  oldestDueDate!: Date | null;
}
