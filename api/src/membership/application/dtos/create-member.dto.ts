import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsEmail,
  IsUUID,
  IsObject,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../domain/value-objects/identity-document';

/**
 * DTO de entrada para la creación de un socio (UC-006).
 * Validado con class-validator y documentado con Swagger.
 */
export class CreateMemberDto {
  @ApiProperty({
    description: 'Nombre del socio',
    example: 'Juan',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  name!: string;

  @ApiProperty({
    description: 'Apellidos del socio',
    example: 'García López',
  })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  @IsString()
  @MaxLength(200, { message: 'Los apellidos no pueden exceder 200 caracteres.' })
  surnames!: string;

  @ApiProperty({
    description: 'Fecha de nacimiento (ISO 8601)',
    example: '1990-05-15',
  })
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida (ISO 8601).' })
  birthDate!: string;

  @ApiProperty({
    description: 'Tipo de documento de identidad',
    enum: DocumentType,
    example: 'DNI',
  })
  @IsEnum(DocumentType, {
    message: 'El tipo de documento debe ser DNI, NIE o PASSPORT.',
  })
  documentType!: DocumentType;

  @ApiProperty({
    description: 'Número de documento de identidad',
    example: '12345678Z',
  })
  @IsNotEmpty({ message: 'El número de documento es obligatorio.' })
  @IsString()
  @MaxLength(20, { message: 'El número de documento no puede exceder 20 caracteres.' })
  documentNumber!: string;

  @ApiProperty({
    description: 'Email del socio',
    example: 'juan.garcia@ejemplo.com',
  })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  @IsEmail({}, { message: 'El email debe tener un formato válido.' })
  email!: string;

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

  @ApiProperty({
    description: 'ID del tipo de socio (UUID)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'memberTypeId debe ser un UUID válido.' })
  memberTypeId!: string;

  @ApiPropertyOptional({
    description: 'Campos personalizados según tipo de colectividad',
    example: {},
    default: {},
  })
  @IsOptional()
  @IsObject({ message: 'customFields debe ser un objeto.' })
  customFields?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Estado inicial del socio (ACTIVE o APPLICANT)',
    example: 'ACTIVE',
    default: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  initialStatus?: string;
}
