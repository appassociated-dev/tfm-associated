import { ApiProperty } from '@nestjs/swagger';
import { Charge } from '../../domain/entities/charge';

/**
 * DTO de respuesta para un cargo pendiente de cobro.
 * Incluye cálculos de importe restante e indicador de morosidad.
 */
export class PendingChargeResponseDto {
  @ApiProperty({ description: 'ID del cargo (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Descripción del cargo' })
  description!: string;

  @ApiProperty({ description: 'Importe final en centavos (efectivo a cobrar)' })
  finalAmount!: number;

  @ApiProperty({ description: 'Importe final formateado en euros (e.g., "50.00 EUR")' })
  finalAmountFormatted!: string;

  @ApiProperty({ description: 'Importe pagado en centavos' })
  paidAmount!: number;

  @ApiProperty({ description: 'Importe pagado formateado en euros' })
  paidAmountFormatted!: string;

  @ApiProperty({ description: 'Importe pendiente en centavos' })
  remainingAmount!: number;

  @ApiProperty({ description: 'Importe pendiente formateado en euros' })
  remainingAmountFormatted!: string;

  @ApiProperty({
    description: 'Mes de facturación (1-12), null para cargos únicos',
    nullable: true,
  })
  billingMonth!: number | null;

  @ApiProperty({ description: 'Año de facturación' })
  billingYear!: number;

  @ApiProperty({ description: 'Fecha de vencimiento del cargo' })
  dueDate!: Date;

  @ApiProperty({ description: 'Estado del cargo (PENDING, PARTIALLY_PAID)' })
  status!: string;

  @ApiProperty({ description: 'Indica si el cargo está vencido (morosidad)' })
  isOverdue!: boolean;

  /**
   * Construye un DTO de respuesta a partir de la entidad de dominio Charge.
   */
  static fromDomain(charge: Charge): PendingChargeResponseDto {
    const dto = new PendingChargeResponseDto();
    const remaining = charge.remainingAmount();

    dto.id = charge.id.toValue();
    dto.description = charge.description.description;
    dto.finalAmount = charge.finalAmount.amount;
    dto.finalAmountFormatted = `${charge.finalAmount.toUnits().toFixed(2)} ${charge.finalAmount.currency}`;
    dto.paidAmount = charge.paidAmount.amount;
    dto.paidAmountFormatted = `${charge.paidAmount.toUnits().toFixed(2)} ${charge.paidAmount.currency}`;
    dto.remainingAmount = remaining.amount;
    dto.remainingAmountFormatted = `${remaining.toUnits().toFixed(2)} ${remaining.currency}`;
    dto.billingMonth = charge.billingMonth;
    dto.billingYear = charge.billingYear;
    dto.dueDate = charge.dueDate;
    dto.status = charge.status.value;
    dto.isOverdue = charge.dueDate < new Date();
    return dto;
  }
}
