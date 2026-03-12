import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de entrada para importar plantillas de planes de cuota.
 * Recibe el tipo de colectividad para determinar las plantillas a importar.
 */
export class ImportTemplateDto {
  @ApiProperty({
    description: 'Tipo de colectividad (ASSOCIATION, CLUB, FEDERATION)',
    example: 'ASSOCIATION',
  })
  @IsNotEmpty({ message: 'El tipo de colectividad es obligatorio.' })
  @IsString()
  collectivityType!: string;
}
