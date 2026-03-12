import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Información del cargo de alta generado. */
export class RegistrationChargeInfoDto {
  @ApiProperty({ description: 'ID del cargo (UUID)' })
  chargeId!: string;

  @ApiProperty({ description: 'Importe en centavos' })
  amount!: number;

  @ApiProperty({ description: 'Concepto del cargo' })
  description!: string;

  @ApiProperty({ description: 'Estado del cargo (PENDING, PAID, CANCELLED)' })
  status!: string;
}

/**
 * DTO de respuesta para el alta simple de un socio (UC-011).
 * Incluye los datos básicos del socio creado y la información del cargo de alta.
 */
export class SimpleRegistrationResponseDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  memberId!: string;

  @ApiProperty({ description: 'Número de socio' })
  memberNumber!: string;

  @ApiProperty({ description: 'Estado del socio' })
  status!: string;

  @ApiProperty({ description: 'Nombre del tipo de socio' })
  memberTypeName!: string;

  @ApiProperty({ description: 'Fecha de registro' })
  registrationDate!: Date;

  @ApiPropertyOptional({
    description: 'Advertencia si el email ya existe en otro socio (no bloquea)',
  })
  emailWarning?: string;

  @ApiPropertyOptional({
    description: 'Información del cargo de alta generado',
    type: RegistrationChargeInfoDto,
    nullable: true,
  })
  registrationCharge!: RegistrationChargeInfoDto | null;

  /**
   * Construye el DTO de respuesta a partir de los datos del resultado de registro.
   */
  static fromResult(params: {
    memberId: string;
    memberNumber: string;
    status: string;
    memberTypeName: string;
    registrationDate: Date;
    emailWarning?: string;
    registrationCharge: {
      chargeId: string;
      amount: number;
      description: string;
      status: string;
    } | null;
  }): SimpleRegistrationResponseDto {
    const dto = new SimpleRegistrationResponseDto();
    dto.memberId = params.memberId;
    dto.memberNumber = params.memberNumber;
    dto.status = params.status;
    dto.memberTypeName = params.memberTypeName;
    dto.registrationDate = params.registrationDate;
    dto.emailWarning = params.emailWarning;

    if (params.registrationCharge) {
      const chargeDto = new RegistrationChargeInfoDto();
      chargeDto.chargeId = params.registrationCharge.chargeId;
      chargeDto.amount = params.registrationCharge.amount;
      chargeDto.description = params.registrationCharge.description;
      chargeDto.status = params.registrationCharge.status;
      dto.registrationCharge = chargeDto;
    } else {
      dto.registrationCharge = null;
    }

    return dto;
  }
}
