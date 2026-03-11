import { IsArray, IsUUID, IsString, IsDateString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para el registro de cobro sobre múltiples cargos.
 * Validado con class-validator y documentado con Swagger.
 */
export class RecordMultiChargePaymentDto {
  @ApiProperty({
    description: 'IDs de los cargos a pagar (UUIDs v4)',
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b1c2d3e4-f5a6-7890-bcde-f12345678901'],
  })
  @IsArray({ message: 'Los chargeIds deben ser un array.' })
  @IsUUID('4', { each: true, message: 'Cada chargeId debe ser un UUID v4 válido.' })
  chargeIds!: string[];

  @ApiProperty({
    description: 'Método de pago (CASH, TRANSFER, BIZUM, SEPA_DIRECT_DEBIT, CARD_TPV)',
    example: 'TRANSFER',
  })
  @IsString({ message: 'El método de pago debe ser una cadena de texto.' })
  paymentMethod!: string;

  @ApiProperty({
    description: 'Fecha del pago en formato ISO (YYYY-MM-DD)',
    example: '2025-03-15',
  })
  @IsDateString({}, { message: 'La fecha de pago debe ser una fecha válida en formato ISO.' })
  paymentDate!: string;

  @ApiPropertyOptional({
    description: 'Observaciones del pago (máximo 500 caracteres)',
    example: 'Pago conjunto por transferencia bancaria',
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto.' })
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres.' })
  notes?: string;
}
