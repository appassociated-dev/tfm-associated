import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de entrada para la renovación de tokens.
 */
export class RefreshRequestDto {
  @ApiProperty({ description: 'Token de refresco válido' })
  @IsNotEmpty({ message: 'El refresh token es obligatorio.' })
  refreshToken!: string;
}
