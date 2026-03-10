import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para la apertura de un ejercicio fiscal.
 * Validado con class-validator y documentado con Swagger.
 */
export class OpenFiscalYearDto {
  @ApiProperty({
    description: 'Nombre del ejercicio fiscal',
    example: 'Ejercicio 2026',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Tipo de ejercicio fiscal',
    example: 'NATURAL_YEAR',
    enum: ['NATURAL_YEAR', 'SPORTS_SEASON', 'CONFRATERNITY', 'CUSTOM'],
  })
  @IsNotEmpty({ message: 'El tipo es obligatorio.' })
  @IsString()
  @IsIn(['NATURAL_YEAR', 'SPORTS_SEASON', 'CONFRATERNITY', 'CUSTOM'], {
    message: 'El tipo debe ser uno de: NATURAL_YEAR, SPORTS_SEASON, CONFRATERNITY, CUSTOM.',
  })
  type!: string;

  @ApiProperty({
    description: 'Fecha de inicio del ejercicio fiscal (ISO 8601)',
    example: '2026-01-01',
  })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  @IsDateString({}, { message: 'La fecha de inicio debe tener formato ISO 8601.' })
  startDate!: string;

  @ApiProperty({
    description: 'Fecha de fin del ejercicio fiscal (ISO 8601)',
    example: '2026-12-31',
  })
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria.' })
  @IsDateString({}, { message: 'La fecha de fin debe tener formato ISO 8601.' })
  endDate!: string;

  @ApiPropertyOptional({
    description: 'ID del ejercicio fiscal anterior (UUID)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID('4', { message: 'previousFiscalYearId debe ser un UUID válido.' })
  previousFiscalYearId?: string;

  @ApiProperty({
    description: 'Si se deben trasladar los socios del ejercicio anterior',
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'carryOverMembers debe ser un booleano.' })
  carryOverMembers!: boolean;

  @ApiProperty({
    description: 'Si se deben aplicar transiciones automáticas de tipo de socio',
    example: false,
    default: false,
  })
  @IsBoolean({ message: 'applyAutomaticTransitions debe ser un booleano.' })
  applyAutomaticTransitions!: boolean;
}
