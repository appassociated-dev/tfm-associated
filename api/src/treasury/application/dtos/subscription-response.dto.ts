import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeeSubscription } from '../../domain/entities/fee-subscription';

/**
 * DTO de respuesta para una suscripción de cuota.
 * Representa la vista pública de la entidad FeeSubscription.
 */
export class SubscriptionResponseDto {
  @ApiProperty({ description: 'ID de la suscripción (UUID)' })
  id!: string;

  @ApiProperty({ description: 'ID del plan de cuota asociado (UUID)' })
  feePlanId!: string;

  @ApiPropertyOptional({ description: 'Nombre del plan de cuota' })
  feePlanName?: string;

  @ApiPropertyOptional({ description: 'Código del plan de cuota' })
  feePlanCode?: string;

  @ApiProperty({ description: 'Fecha de alta de la suscripción' })
  registrationDate!: Date;

  @ApiPropertyOptional({ description: 'Fecha de baja de la suscripción' })
  leaveDate!: Date | null;

  @ApiProperty({ description: 'Descuento por tipo de socio (0 a 0.99)' })
  typeDiscount!: number;

  @ApiProperty({ description: 'Descuento personal (0 a 0.99)' })
  personalDiscount!: number;

  @ApiPropertyOptional({
    description: 'Motivo del descuento personalizado (auditabilidad RNFT-025)',
  })
  personalDiscountReason!: string | null;

  @ApiProperty({ description: 'Importe efectivo en centavos tras aplicar descuentos' })
  effectiveAmount!: number;

  @ApiProperty({ description: 'Importe efectivo formateado (e.g., "95.00 EUR")' })
  effectiveAmountFormatted!: string;

  @ApiPropertyOptional({ description: 'Motivo de cancelación' })
  cancelReason!: string | null;

  @ApiProperty({ description: 'Indica si la suscripción está activa' })
  isActive!: boolean;

  @ApiProperty({ description: 'Fecha de creación del registro' })
  createdAt!: Date;

  /**
   * Construye un DTO de respuesta a partir de la entidad de dominio.
   * Opcionalmente enriquece con nombre y código del plan.
   */
  static fromDomain(
    subscription: FeeSubscription,
    feePlan?: { name: string; code: string },
  ): SubscriptionResponseDto {
    const dto = new SubscriptionResponseDto();
    dto.id = subscription.id.toValue();
    dto.feePlanId = subscription.feePlanId.toValue();
    dto.feePlanName = feePlan?.name;
    dto.feePlanCode = feePlan?.code;
    dto.registrationDate = subscription.registrationDate;
    dto.leaveDate = subscription.leaveDate;
    dto.typeDiscount = subscription.discount.typeDiscount;
    dto.personalDiscount = subscription.discount.personalDiscount;
    dto.personalDiscountReason = subscription.personalDiscountReason;
    dto.effectiveAmount = subscription.effectiveAmount.amount;
    dto.effectiveAmountFormatted = `${subscription.effectiveAmount.toUnits().toFixed(2)} ${subscription.effectiveAmount.currency}`;
    dto.cancelReason = subscription.cancelReason?.value ?? null;
    dto.isActive = subscription.isActive();
    dto.createdAt = subscription.createdAt;
    return dto;
  }
}
