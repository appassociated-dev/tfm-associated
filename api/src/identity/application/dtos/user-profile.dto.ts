import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO anidado que representa el tenant activo en el perfil del usuario.
 */
class CurrentTenantDto {
  @ApiProperty({ description: 'ID del tenant (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Nombre del tenant' })
  name!: string;

  @ApiProperty({ description: 'Slug del tenant' })
  slug!: string;
}

/**
 * DTO de respuesta con el perfil completo del usuario autenticado.
 * Incluye tenant activo, rol y permisos resueltos.
 */
export class UserProfileDto {
  @ApiProperty({ description: 'ID del usuario (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Email del usuario' })
  email!: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  name!: string;

  @ApiProperty({ description: 'Tenant activo del usuario', type: CurrentTenantDto })
  currentTenant!: CurrentTenantDto;

  @ApiProperty({ description: 'Rol del usuario en el tenant activo', example: 'ADMIN' })
  role!: string;

  @ApiProperty({
    description: 'Permisos resueltos del usuario',
    type: [String],
    example: ['read:members', 'write:members'],
  })
  permissions!: string[];
}
