import { IsUUID, IsInt, IsString, IsDateString, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para el registro de un cobro individual.
 * Validado con class-validator y documentado con Swagger.
 */
export class RecordPaymentDto {
  @ApiProperty({
    description: 'ID del cargo al que se aplica el pago (UUID v4)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'El chargeId debe ser un UUID v4 válido.' })
  chargeId!: string;

  @ApiProperty({
    description: 'Importe del pago en centavos (entero positivo)',
    example: 2450,
  })
  @IsInt({ message: 'El importe debe ser un número entero (centavos).' })
  @Min(1, { message: 'El importe debe ser al menos 1 centavo.' })
  amount!: number;

  @ApiProperty({
    description: 'Método de pago (CASH, TRANSFER, BIZUM, SEPA_DIRECT_DEBIT, CARD_TPV)',
    example: 'CASH',
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
    example: 'Pago en efectivo en oficina',
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser una cadena de texto.' })
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres.' })
  notes?: string;
}
