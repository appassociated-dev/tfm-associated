import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeePlan } from '../../domain/aggregates/fee-plan';

/**
 * DTO de una vinculación de tipo de socio a un plan de cuota.
 * Incluye datos del tipo de socio y la configuración de la vinculación.
 */
export class LinkedMemberTypeDto {
  @ApiProperty({ description: 'ID del tipo de socio (UUID)' })
  memberTypeId!: string;

  @ApiProperty({ description: 'Nombre del tipo de socio' })
  memberTypeName!: string;

  @ApiProperty({ description: 'ID del plan de cuota (UUID)' })
  feePlanId!: string;

  @ApiProperty({ description: 'Si esta vinculación es la predeterminada' })
  isDefault!: boolean;

  @ApiProperty({ description: 'Orden de presentación' })
  order!: number;

  @ApiProperty({ description: 'Estado activo de la vinculación' })
  active!: boolean;
}

/**
 * DTO de respuesta para un plan de cuota.
 * Representa la vista pública del aggregate FeePlan.
 */
export class FeePlanResponseDto {
  @ApiProperty({ description: 'ID del plan de cuota (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Código único del plan de cuota' })
  code!: string;

  @ApiProperty({ description: 'Nombre del plan de cuota' })
  name!: string;

  @ApiPropertyOptional({ description: 'Descripción del plan de cuota' })
  description!: string | null;

  @ApiProperty({ description: 'Tipo de plan: ONE_TIME o RECURRING' })
  type!: string;

  @ApiProperty({ description: 'Frecuencia de cobro' })
  frequency!: string;

  @ApiProperty({ description: 'Importe en centavos' })
  amount!: number;

  @ApiProperty({ description: 'Importe formateado en unidades (e.g., "120.00 EUR")' })
  amountFormatted!: string;

  @ApiProperty({ description: 'Código de divisa ISO 4217' })
  currency!: string;

  @ApiProperty({ description: 'Meses de facturación (1-12)', type: [Number] })
  billingMonths!: number[];

  @ApiProperty({ description: 'Estado activo' })
  active!: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'Tipos de socio vinculados (solo en detalle individual)',
    type: [LinkedMemberTypeDto],
  })
  linkedMemberTypes?: LinkedMemberTypeDto[];

  /**
   * Construye un DTO de respuesta a partir del aggregate de dominio.
   */
  static fromDomain(feePlan: FeePlan): FeePlanResponseDto {
    const dto = new FeePlanResponseDto();
    dto.id = feePlan.id.toValue();
    dto.code = feePlan.code.value;
    dto.name = feePlan.name;
    dto.description = feePlan.description;
    dto.type = feePlan.type.value;
    dto.frequency = feePlan.frequency.value;
    dto.amount = feePlan.amount.amount;
    dto.amountFormatted = `${feePlan.amount.toUnits().toFixed(2)} ${feePlan.amount.currency}`;
    dto.currency = feePlan.amount.currency;
    dto.billingMonths = [...feePlan.billingMonths.months];
    dto.active = feePlan.active;
    dto.createdAt = feePlan.createdAt;
    dto.updatedAt = feePlan.updatedAt;
    return dto;
  }
}
