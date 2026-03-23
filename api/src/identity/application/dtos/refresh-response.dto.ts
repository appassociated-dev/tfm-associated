import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta tras una renovación de tokens exitosa.
 */
export class RefreshResponseDto {
  @ApiProperty({ description: 'Nuevo token de acceso JWT' })
  accessToken!: string;

  @ApiProperty({ description: 'Nuevo token de refresco' })
  refreshToken!: string;

  @ApiProperty({ description: 'Tiempo de expiración del access token en segundos', example: 900 })
  expiresIn!: number;
}
