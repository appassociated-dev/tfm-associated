import { IsNotEmpty, IsEmail, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Valores válidos para el tipo de colectividad. */
enum CollectivityTypeEnum {
  PENA = 'PENA',
  COFRADIA = 'COFRADIA',
  CLUB_DEPORTIVO = 'CLUB_DEPORTIVO',
  ASOCIACION_CULTURAL = 'ASOCIACION_CULTURAL',
}

/**
 * DTO de entrada para la provisión de un nuevo tenant.
 * Validado con class-validator y documentado con Swagger.
 */
export class ProvisionTenantDto {
  @ApiProperty({ description: 'Nombre de la colectividad', example: 'Peña El Buen Gusto' })
  @IsNotEmpty({ message: 'El nombre de la colectividad es obligatorio.' })
  name!: string;

  @ApiProperty({
    description: 'Tipo de colectividad',
    enum: CollectivityTypeEnum,
    example: 'PENA',
  })
  @IsEnum(CollectivityTypeEnum, {
    message:
      'El tipo de colectividad debe ser uno de: PENA, COFRADIA, CLUB_DEPORTIVO, ASOCIACION_CULTURAL.',
  })
  collectivityType!: string;

  @ApiProperty({ description: 'CIF de la colectividad', example: 'A28015550' })
  @IsNotEmpty({ message: 'El CIF es obligatorio.' })
  cif!: string;

  @ApiProperty({ description: 'Email de contacto de la colectividad', example: 'contacto@pena.es' })
  @IsEmail({}, { message: 'El email de contacto debe ser un email válido.' })
  contactEmail!: string;

  @ApiProperty({ description: 'Nombre del administrador inicial', example: 'Juan García' })
  @IsNotEmpty({ message: 'El nombre del administrador es obligatorio.' })
  adminName!: string;

  @ApiProperty({ description: 'Email del administrador inicial', example: 'admin@pena.es' })
  @IsEmail({}, { message: 'El email del administrador debe ser un email válido.' })
  adminEmail!: string;

  @ApiProperty({
    description: 'Contraseña del administrador (mínimo 8 caracteres)',
    example: 'SecurePass123',
  })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  adminPassword!: string;
}
