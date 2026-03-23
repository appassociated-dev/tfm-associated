import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de respuesta para el resultado de búsqueda de socios en el contexto de cobros.
 * Incluye datos del socio y su balance pendiente.
 */
export class MemberSearchResultDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiPropertyOptional({ description: 'ID de la cuenta de socio (UUID), null si no tiene cuenta' })
  memberAccountId!: string | null;

  @ApiProperty({ description: 'Número de socio' })
  memberNumber!: string;

  @ApiProperty({ description: 'Nombre del socio' })
  name!: string;

  @ApiProperty({ description: 'Apellidos del socio' })
  surnames!: string;

  @ApiPropertyOptional({ description: 'DNI del socio' })
  dni?: string;

  @ApiProperty({ description: 'Balance pendiente en centavos' })
  pendingBalance!: number;

  @ApiProperty({ description: 'Balance pendiente formateado en euros (e.g., "150.00 EUR")' })
  pendingBalanceFormatted!: string;

  @ApiProperty({ description: 'Número de cargos pendientes' })
  pendingCharges!: number;
}
