import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de respuesta para la verificación de DNI (UC-011).
 * Indica si el documento de identidad ya existe en el tenant
 * y, en caso afirmativo, devuelve datos básicos del socio.
 */
export class DniCheckResponseDto {
  @ApiProperty({ description: 'Indica si el documento ya existe' })
  exists!: boolean;

  @ApiPropertyOptional({ description: 'Nombre completo del socio existente' })
  memberName?: string;

  @ApiPropertyOptional({ description: 'Número de socio existente' })
  memberNumber?: string;
}
