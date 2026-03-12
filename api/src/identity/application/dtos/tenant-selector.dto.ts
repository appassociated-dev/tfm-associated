import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO anidado que representa un tenant disponible para selección.
 */
class TenantOptionDto {
  @ApiProperty({ description: 'ID del tenant (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Nombre del tenant' })
  name!: string;

  @ApiProperty({ description: 'Slug del tenant' })
  slug!: string;

  @ApiProperty({ description: 'Rol del usuario en este tenant', example: 'ADMIN' })
  role!: string;
}

/**
 * DTO de respuesta cuando el usuario pertenece a múltiples tenants.
 * Indica que se requiere seleccionar un tenant antes de continuar.
 */
export class TenantSelectorDto {
  @ApiProperty({ description: 'Indica si el usuario debe seleccionar un tenant' })
  requiresTenantSelection!: boolean;

  @ApiProperty({
    description: 'Lista de tenants disponibles para el usuario',
    type: [TenantOptionDto],
  })
  tenants!: TenantOptionDto[];
}
