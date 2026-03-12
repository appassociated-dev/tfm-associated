import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de entrada para el inicio de sesión.
 * Validado con class-validator y documentado con Swagger.
 */
export class LoginRequestDto {
  @ApiProperty({ description: 'Email del usuario', example: 'admin@pena.es' })
  @IsEmail({}, { message: 'Debe proporcionar un email válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  email!: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'SecurePass123' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(1, { message: 'La contraseña no puede estar vacía.' })
  password!: string;
}
