import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de respuesta tras una provisión de tenant exitosa.
 */
export class TenantProvisionedResponseDto {
  @ApiProperty({ description: 'ID del tenant creado (UUID)' })
  tenantId!: string;

  @ApiProperty({ description: 'Slug del tenant (derivado del nombre)' })
  slug!: string;

  @ApiProperty({ description: 'ID del usuario administrador creado (UUID)' })
  adminUserId!: string;

  constructor(tenantId: string, slug: string, adminUserId: string) {
    this.tenantId = tenantId;
    this.slug = slug;
    this.adminUserId = adminUserId;
  }
}
