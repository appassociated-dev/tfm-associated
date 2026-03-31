import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO de entrada para el cierre de sesión.
 * Permite a Swagger generar el esquema correcto del cuerpo de la petición.
 */
export class LogoutRequestDto {
  @ApiProperty({
    description: 'Refresh token a invalidar',
    example: '3ef714aa-fe8d-4574-9337-10e26b122c3d',
  })
  @IsString()
  @IsNotEmpty({ message: 'El refresh token es obligatorio.' })
  refreshToken!: string;
}
