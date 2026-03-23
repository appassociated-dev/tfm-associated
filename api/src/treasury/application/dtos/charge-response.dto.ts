import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Charge } from '../../domain/entities/charge';

/**
 * DTO de respuesta para un cargo individual.
 * Representa la vista pública de la entidad Charge.
 */
export class ChargeResponseDto {
  @ApiProperty({ description: 'ID del cargo (UUID)' })
  id!: string;

  @ApiPropertyOptional({ description: 'ID de la suscripción origen (UUID), null si cargo manual' })
  subscriptionId!: string | null;

  @ApiProperty({ description: 'Descripción del cargo' })
  description!: string;

  @ApiProperty({ description: 'Importe base en centavos (antes de prorrateo)' })
  baseAmount!: number;

  @ApiProperty({ description: 'Importe final en centavos (efectivo a cobrar)' })
  finalAmount!: number;

  @ApiProperty({ description: 'Importe final formateado en euros (e.g., "50.00 EUR")' })
  finalAmountFormatted!: string;

  @ApiPropertyOptional({ description: 'Mes de facturación (1-12), null para cargos únicos' })
  billingMonth!: number | null;

  @ApiProperty({ description: 'Año de facturación' })
  billingYear!: number;

  @ApiProperty({ description: 'Fecha de emisión del cargo' })
  issueDate!: Date;

  @ApiProperty({ description: 'Fecha de vencimiento del cargo' })
  dueDate!: Date;

  @ApiProperty({
    description: 'Estado del cargo (PENDING, PAID, PARTIALLY_PAID, RETURNED, CANCELLED)',
  })
  status!: string;

  @ApiProperty({ description: 'Importe pagado en centavos' })
  paidAmount!: number;

  @ApiProperty({ description: 'Importe pagado formateado en euros' })
  paidAmountFormatted!: string;

  @ApiProperty({ description: 'Indica si el cargo fue prorrateado por alta a mitad de ejercicio' })
  isProrated!: boolean;

  @ApiProperty({ description: 'Indica si el cargo fue creado manualmente' })
  isManual!: boolean;

  @ApiPropertyOptional({ description: 'Nombre del plan de cuota asociado' })
  feePlanName?: string;

  /**
   * Construye un DTO de respuesta a partir de la entidad de dominio.
   * Opcionalmente enriquece con el nombre del plan.
   */
  static fromDomain(charge: Charge, feePlanName?: string): ChargeResponseDto {
    const dto = new ChargeResponseDto();
    dto.id = charge.id.toValue();
    dto.subscriptionId = charge.subscriptionId?.toValue() ?? null;
    dto.description = charge.description.description;
    dto.baseAmount = charge.baseAmount.amount;
    dto.finalAmount = charge.finalAmount.amount;
    dto.finalAmountFormatted = `${charge.finalAmount.toUnits().toFixed(2)} ${charge.finalAmount.currency}`;
    dto.billingMonth = charge.billingMonth;
    dto.billingYear = charge.billingYear;
    dto.issueDate = charge.issueDate;
    dto.dueDate = charge.dueDate;
    dto.status = charge.status.value;
    dto.paidAmount = charge.paidAmount.amount;
    dto.paidAmountFormatted = `${charge.paidAmount.toUnits().toFixed(2)} ${charge.paidAmount.currency}`;
    dto.isProrated = charge.isProrated;
    dto.isManual = charge.isManual;
    dto.feePlanName = feePlanName;
    return dto;
  }
}
