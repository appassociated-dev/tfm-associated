import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para la rehabilitación exitosa de un socio (UC-013).
 * Incluye los datos del resultado de la rehabilitación.
 */
export class ReinstatementResponseDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiProperty({ description: 'Nuevo estado del socio (ACTIVE)' })
  newStatus!: string;

  @ApiProperty({ description: 'Importe de deuda pagada en centavos' })
  debtPaid!: number;

  @ApiProperty({ description: 'Si se recuperó la antigüedad original' })
  seniorityRecovered!: boolean;

  @ApiProperty({ description: 'Fecha de registro (original si conserva antigüedad, nueva si no)' })
  registrationDate!: Date;

  /**
   * Construye el DTO de respuesta a partir de los datos del resultado de rehabilitación.
   */
  static fromResult(params: {
    memberId: string;
    newStatus: string;
    debtPaid: number;
    seniorityRecovered: boolean;
    registrationDate: Date;
  }): ReinstatementResponseDto {
    const dto = new ReinstatementResponseDto();
    dto.memberId = params.memberId;
    dto.newStatus = params.newStatus;
    dto.debtPaid = params.debtPaid;
    dto.seniorityRecovered = params.seniorityRecovered;
    dto.registrationDate = params.registrationDate;
    return dto;
  }
}
