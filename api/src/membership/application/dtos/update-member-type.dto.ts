import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO de entrada para la actualización de un tipo de socio.
 * No incluye el campo 'code' porque es inmutable tras la creación.
 */
export class UpdateMemberTypeDto {
  @ApiProperty({
    description: 'Nombre del tipo de socio',
    example: 'Socio Numerario',
  })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @IsString()
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres.' })
  name!: string;

  @ApiProperty({
    description: 'Descripción del tipo de socio',
    example: 'Socio de pleno derecho con voto y capacidad para cargos',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Edad mínima permitida',
    example: 18,
  })
  @IsOptional()
  @IsInt({ message: 'La edad mínima debe ser un número entero.' })
  @Min(0, { message: 'La edad mínima no puede ser negativa.' })
  ageRangeMin?: number | null;

  @ApiPropertyOptional({
    description: 'Edad máxima permitida',
    example: 65,
  })
  @IsOptional()
  @IsInt({ message: 'La edad máxima debe ser un número entero.' })
  @Min(0, { message: 'La edad máxima no puede ser negativa.' })
  ageRangeMax?: number | null;

  @ApiProperty({
    description: 'Si el socio tiene derecho a voto',
    example: true,
  })
  @IsBoolean({ message: 'votingRight debe ser un booleano.' })
  votingRight!: boolean;

  @ApiProperty({
    description: 'Si el socio puede ocupar cargos directivos',
    example: true,
  })
  @IsBoolean({ message: 'eligibleForOffice debe ser un booleano.' })
  eligibleForOffice!: boolean;

  @ApiProperty({
    description: 'Antigüedad mínima en meses para poder votar',
    example: 6,
  })
  @IsInt({ message: 'minimumSeniorityForVoting debe ser un número entero.' })
  @Min(0, { message: 'minimumSeniorityForVoting no puede ser negativo.' })
  minimumSeniorityForVoting!: number;

  @ApiProperty({
    description: 'Antigüedad mínima en meses para poder ocupar cargo',
    example: 12,
  })
  @IsInt({ message: 'minimumSeniorityForOffice debe ser un número entero.' })
  @Min(0, { message: 'minimumSeniorityForOffice no puede ser negativo.' })
  minimumSeniorityForOffice!: number;

  @ApiPropertyOptional({
    description: 'ID del tipo de socio al que transiciona automáticamente',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID('4', { message: 'automaticTransitionTargetId debe ser un UUID válido.' })
  automaticTransitionTargetId?: string | null;

  @ApiProperty({
    description: 'Configuración de reglas específicas del tipo de colectividad',
    example: {},
  })
  @IsObject({ message: 'rulesConfig debe ser un objeto.' })
  rulesConfig!: object;
}
