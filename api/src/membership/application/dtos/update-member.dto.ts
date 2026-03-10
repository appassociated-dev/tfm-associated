import { IsOptional, IsString, IsEmail, IsObject, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para la actualización de un socio (UC-006).
 * Todos los campos son opcionales. No incluye documentType ni documentNumber (inmutables).
 */
export class UpdateMemberDto {
  @ApiPropertyOptional({
    description: 'Nombre del socio',
    example: 'Juan Carlos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Apellidos del socio',
    example: 'García López',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Los apellidos no pueden exceder 200 caracteres.' })
  surnames?: string;

  @ApiPropertyOptional({
    description: 'Email del socio',
    example: 'juancarlos.garcia@ejemplo.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del socio',
    example: '+34666123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres.' })
  phone?: string | null;

  @ApiPropertyOptional({
    description: 'Dirección del socio',
    example: 'Calle Mayor 1, 2ºA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'La dirección no puede exceder 300 caracteres.' })
  address?: string | null;

  @ApiPropertyOptional({
    description: 'Código postal',
    example: '28001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, { message: 'El código postal no puede exceder 10 caracteres.' })
  postalCode?: string | null;

  @ApiPropertyOptional({
    description: 'Ciudad',
    example: 'Madrid',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'La ciudad no puede exceder 100 caracteres.' })
  city?: string | null;

  @ApiPropertyOptional({
    description: 'IBAN del socio',
    example: 'ES9121000418450200051332',
  })
  @IsOptional()
  @IsString()
  iban?: string | null;

  @ApiPropertyOptional({
    description: 'Campos personalizados según tipo de colectividad',
    example: {},
  })
  @IsOptional()
  @IsObject({ message: 'customFields debe ser un objeto.' })
  customFields?: Record<string, unknown>;
}
