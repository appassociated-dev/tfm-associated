import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para el resumen previo a la rehabilitación de un socio (UC-013).
 * Proporciona toda la información necesaria para que el usuario tome la decisión de rehabilitar.
 */
export class ReinstatementSummaryResponseDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiProperty({ description: 'Nombre completo del socio' })
  memberName!: string;

  @ApiProperty({ description: 'Fecha de baja del socio' })
  leaveDate!: Date;

  @ApiProperty({ description: 'Tipo de baja (VOLUNTARY_LEAVE, NONPAYMENT_LEAVE)' })
  leaveType!: string;

  @ApiProperty({ description: 'Deuda pendiente en centavos' })
  pendingDebt!: number;

  @ApiProperty({ description: 'Penalización por rehabilitación en centavos (0 si no aplica)' })
  penalty!: number;

  @ApiProperty({ description: 'Cuota de nueva inscripción en centavos (0 si mantiene antigüedad)' })
  newRegistrationFee!: number;

  @ApiProperty({ description: 'Total a pagar para rehabilitar en centavos' })
  totalToPay!: number;

  @ApiProperty({ description: 'Si se conserva la antigüedad del socio' })
  keepSeniority!: boolean;

  /**
   * Construye el DTO de respuesta a partir de los datos del resumen.
   */
  static fromResult(params: {
    memberId: string;
    memberName: string;
    leaveDate: Date;
    leaveType: string;
    pendingDebt: number;
    penalty: number;
    newRegistrationFee: number;
    totalToPay: number;
    keepSeniority: boolean;
  }): ReinstatementSummaryResponseDto {
    const dto = new ReinstatementSummaryResponseDto();
    dto.memberId = params.memberId;
    dto.memberName = params.memberName;
    dto.leaveDate = params.leaveDate;
    dto.leaveType = params.leaveType;
    dto.pendingDebt = params.pendingDebt;
    dto.penalty = params.penalty;
    dto.newRegistrationFee = params.newRegistrationFee;
    dto.totalToPay = params.totalToPay;
    dto.keepSeniority = params.keepSeniority;
    return dto;
  }
}
