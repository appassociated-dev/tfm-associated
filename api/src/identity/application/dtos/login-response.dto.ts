import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO anidado que representa la información básica del usuario autenticado.
 */
class LoginUserDto {
  @ApiProperty({ description: 'ID del usuario (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Email del usuario' })
  email!: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  name!: string;
}

/**
 * DTO anidado que representa el tenant activo del usuario.
 */
class LoginTenantDto {
  @ApiProperty({ description: 'ID del tenant (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Nombre del tenant' })
  name!: string;

  @ApiProperty({ description: 'Slug del tenant' })
  slug!: string;
}

/**
 * DTO de respuesta tras un inicio de sesión exitoso.
 * Contiene tokens, datos del usuario, tenant activo y rol.
 */
export class LoginResponseDto {
  @ApiProperty({ description: 'Token de acceso JWT' })
  accessToken!: string;

  @ApiProperty({ description: 'Token de refresco para renovar el acceso' })
  refreshToken!: string;

  @ApiProperty({ description: 'Tiempo de expiración del access token en segundos', example: 900 })
  expiresIn!: number;

  @ApiProperty({ description: 'Datos del usuario autenticado', type: LoginUserDto })
  user!: LoginUserDto;

  @ApiProperty({ description: 'Tenant activo del usuario', type: LoginTenantDto })
  tenant!: LoginTenantDto;

  @ApiProperty({ description: 'Rol del usuario en el tenant activo', example: 'ADMIN' })
  role!: string;
}
