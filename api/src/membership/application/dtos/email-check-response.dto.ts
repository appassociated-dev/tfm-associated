import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta para la verificación de email (UC-011).
 * Indica si el email ya está registrado en el tenant.
 */
export class EmailCheckResponseDto {
  @ApiProperty({ description: 'Indica si el email ya existe en otro socio' })
  exists!: boolean;
}
