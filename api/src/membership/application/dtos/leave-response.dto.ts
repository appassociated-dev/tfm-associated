import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para operaciones de baja de socio (UC-013).
 * Incluye los datos del resultado de la baja procesada.
 */
export class LeaveResponseDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiProperty({ description: 'Estado anterior del socio' })
  previousStatus!: string;

  @ApiProperty({ description: 'Nuevo estado del socio (tipo de baja)' })
  newStatus!: string;

  @ApiProperty({ description: 'Fecha efectiva de la baja' })
  effectiveDate!: Date;

  @ApiProperty({ description: 'Número de suscripciones canceladas' })
  subscriptionsClosed!: number;

  @ApiProperty({ description: 'Importe total de cargos pendientes en centavos' })
  pendingChargesAmount!: number;

  /**
   * Construye el DTO de respuesta a partir de los datos del resultado de baja.
   */
  static fromResult(params: {
    memberId: string;
    previousStatus: string;
    newStatus: string;
    effectiveDate: Date;
    subscriptionsClosed: number;
    pendingChargesAmount: number;
  }): LeaveResponseDto {
    const dto = new LeaveResponseDto();
    dto.memberId = params.memberId;
    dto.previousStatus = params.previousStatus;
    dto.newStatus = params.newStatus;
    dto.effectiveDate = params.effectiveDate;
    dto.subscriptionsClosed = params.subscriptionsClosed;
    dto.pendingChargesAmount = params.pendingChargesAmount;
    return dto;
  }
}
