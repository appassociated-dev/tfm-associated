import { ApiProperty } from '@nestjs/swagger';
import { EffectiveDateOption } from '../../domain/services/effective-date-calculator';
import {
  SubscriptionSummary,
  PendingChargeSummary,
} from '../../domain/ports/subscription-query.port';

/** Opción de fecha efectiva serializada para la respuesta. */
export class EffectiveDateOptionDto {
  @ApiProperty({ description: 'Tipo de cálculo de fecha efectiva' })
  type!: string;

  @ApiProperty({ description: 'Fecha efectiva calculada' })
  effectiveDate!: Date;

  @ApiProperty({ description: 'Descripción legible para el usuario' })
  label!: string;
}

/** Resumen de suscripción activa serializado para la respuesta. */
export class ActiveSubscriptionDto {
  @ApiProperty({ description: 'ID de la suscripción (UUID)' })
  subscriptionId!: string;

  @ApiProperty({ description: 'Código del plan de cuota' })
  feePlanCode!: string;

  @ApiProperty({ description: 'Nombre del plan de cuota' })
  feePlanName!: string;

  @ApiProperty({ description: 'Importe periódico en centavos' })
  amount!: number;

  @ApiProperty({ description: 'Fecha de inicio de la suscripción' })
  startDate!: Date;
}

/** Resumen de cargo pendiente serializado para la respuesta. */
export class PendingChargeDto {
  @ApiProperty({ description: 'ID del cargo (UUID)' })
  chargeId!: string;

  @ApiProperty({ description: 'Concepto del cargo' })
  concept!: string;

  @ApiProperty({ description: 'Importe en centavos' })
  amount!: number;

  @ApiProperty({ description: 'Fecha de emisión' })
  issueDate!: Date;

  @ApiProperty({ description: 'Fecha de vencimiento' })
  dueDate!: Date;
}

/**
 * DTO de respuesta para el resumen previo a la baja de un socio (UC-013).
 * Proporciona toda la información necesaria para que el usuario tome la decisión de baja.
 */
export class LeaveSummaryResponseDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiProperty({ description: 'Nombre completo del socio' })
  memberName!: string;

  @ApiProperty({ description: 'Número de socio' })
  memberNumber!: string;

  @ApiProperty({ description: 'Estado actual del socio' })
  currentStatus!: string;

  @ApiProperty({
    description: 'Opciones de fecha efectiva de baja',
    type: [EffectiveDateOptionDto],
  })
  effectiveDateOptions!: EffectiveDateOptionDto[];

  @ApiProperty({
    description: 'Suscripciones activas que se cancelarán',
    type: [ActiveSubscriptionDto],
  })
  activeSubscriptions!: ActiveSubscriptionDto[];

  @ApiProperty({ description: 'Cargos pendientes de pago', type: [PendingChargeDto] })
  pendingCharges!: PendingChargeDto[];

  @ApiProperty({ description: 'Total de deuda pendiente en centavos' })
  totalPendingDebt!: number;

  /**
   * Construye el DTO de respuesta a partir de los datos del resumen.
   */
  static fromResult(params: {
    memberId: string;
    memberName: string;
    memberNumber: string;
    currentStatus: string;
    effectiveDateOptions: EffectiveDateOption[];
    activeSubscriptions: SubscriptionSummary[];
    pendingCharges: PendingChargeSummary[];
    totalPendingDebt: number;
  }): LeaveSummaryResponseDto {
    const dto = new LeaveSummaryResponseDto();
    dto.memberId = params.memberId;
    dto.memberName = params.memberName;
    dto.memberNumber = params.memberNumber;
    dto.currentStatus = params.currentStatus;
    dto.totalPendingDebt = params.totalPendingDebt;

    dto.effectiveDateOptions = params.effectiveDateOptions.map((opt) => {
      const optDto = new EffectiveDateOptionDto();
      optDto.type = opt.type;
      optDto.effectiveDate = opt.effectiveDate;
      optDto.label = opt.label;
      return optDto;
    });

    dto.activeSubscriptions = params.activeSubscriptions.map((sub) => {
      const subDto = new ActiveSubscriptionDto();
      subDto.subscriptionId = sub.subscriptionId;
      subDto.feePlanCode = sub.feePlanCode;
      subDto.feePlanName = sub.feePlanName;
      subDto.amount = sub.amount;
      subDto.startDate = sub.startDate;
      return subDto;
    });

    dto.pendingCharges = params.pendingCharges.map((charge) => {
      const chargeDto = new PendingChargeDto();
      chargeDto.chargeId = charge.chargeId;
      chargeDto.concept = charge.concept;
      chargeDto.amount = charge.amount;
      chargeDto.issueDate = charge.issueDate;
      chargeDto.dueDate = charge.dueDate;
      return chargeDto;
    });

    return dto;
  }
}
