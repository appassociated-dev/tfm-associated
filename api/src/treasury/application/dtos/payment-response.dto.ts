import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Payment } from '../../domain/entities/payment';
import { PaymentMethod } from '../../domain/value-objects/payment-method';

/**
 * DTO de respuesta para un pago registrado.
 * Representa la vista pública de la entidad Payment.
 */
export class PaymentResponseDto {
  @ApiProperty({ description: 'ID del pago (UUID)' })
  id!: string;

  @ApiProperty({ description: 'ID del cargo asociado (UUID)' })
  chargeId!: string;

  @ApiPropertyOptional({ description: 'Descripción del cargo asociado' })
  chargeDescription?: string;

  @ApiProperty({ description: 'Importe del pago en centavos' })
  amount!: number;

  @ApiProperty({ description: 'Importe formateado en euros (e.g., "24.50 EUR")' })
  amountFormatted!: string;

  @ApiProperty({
    description: 'Método de pago (CASH, TRANSFER, BIZUM, SEPA_DIRECT_DEBIT, CARD_TPV)',
  })
  paymentMethod!: string;

  @ApiProperty({ description: 'Etiqueta legible del método de pago (e.g., "Efectivo")' })
  paymentMethodLabel!: string;

  @ApiProperty({ description: 'Fecha del pago' })
  paymentDate!: Date;

  @ApiProperty({ description: 'Referencia de pago (e.g., "EF-2025-00042")' })
  paymentReference!: string;

  @ApiPropertyOptional({ description: 'Número de recibo (e.g., "REC-2025-00042")' })
  receiptNumber!: string | null;

  @ApiPropertyOptional({ description: 'Observaciones del pago' })
  notes!: string | null;

  @ApiProperty({ description: 'ID del usuario que registró el cobro' })
  registeredBy!: string;

  @ApiProperty({ description: 'Estado del pago (CONFIRMED, ANNULLED)' })
  status!: string;

  @ApiProperty({ description: 'Fecha de creación del registro' })
  createdAt!: Date;

  /**
   * Construye un DTO de respuesta a partir de la entidad de dominio.
   * Opcionalmente enriquece con la descripción del cargo.
   */
  static fromDomain(payment: Payment, chargeDescription?: string): PaymentResponseDto {
    const dto = new PaymentResponseDto();
    dto.id = payment.id.toValue();
    dto.chargeId = payment.chargeId.toValue();
    dto.chargeDescription = chargeDescription;
    dto.amount = payment.amount.amount;
    dto.amountFormatted = `${payment.amount.toUnits().toFixed(2)} ${payment.amount.currency}`;
    dto.paymentMethod = payment.paymentMethod.value;
    dto.paymentMethodLabel = PaymentMethod.toLabel(payment.paymentMethod);
    dto.paymentDate = payment.paymentDate;
    dto.paymentReference = payment.paymentReference.value;
    dto.receiptNumber = payment.receiptNumber?.value ?? null;
    dto.notes = payment.notes;
    dto.registeredBy = payment.registeredBy;
    dto.status = payment.status.value;
    dto.createdAt = payment.createdAt;
    return dto;
  }
}
