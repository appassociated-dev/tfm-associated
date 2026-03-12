import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** Valores válidos para el tipo de colectividad. */
enum CollectivityTypeEnum {
  PENA = 'PENA',
  COFRADIA = 'COFRADIA',
  CLUB_DEPORTIVO = 'CLUB_DEPORTIVO',
  ASOCIACION_CULTURAL = 'ASOCIACION_CULTURAL',
}

/**
 * DTO de entrada para la importación de plantillas de tipos de socio.
 */
export class ImportTemplateDto {
  @ApiProperty({
    description: 'Tipo de colectividad para seleccionar las plantillas',
    enum: CollectivityTypeEnum,
    example: 'COFRADIA',
  })
  @IsNotEmpty({ message: 'El tipo de colectividad es obligatorio.' })
  @IsEnum(CollectivityTypeEnum, {
    message:
      'El tipo de colectividad debe ser uno de: PENA, COFRADIA, CLUB_DEPORTIVO, ASOCIACION_CULTURAL.',
  })
  collectivityType!: string;
}
