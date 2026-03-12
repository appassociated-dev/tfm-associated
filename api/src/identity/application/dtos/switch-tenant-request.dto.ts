import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de entrada para el cambio de tenant activo.
 */
export class SwitchTenantRequestDto {
  @ApiProperty({
    description: 'ID del tenant al que se desea cambiar (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4', { message: 'El ID del tenant debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID del tenant es obligatorio.' })
  tenantId!: string;
}
