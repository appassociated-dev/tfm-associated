import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberTypeTemplate } from '../../infrastructure/data/member-type-templates';

/**
 * DTO de respuesta para una plantilla de tipo de socio.
 * Representa la vista pública de una plantilla predefinida.
 */
export class MemberTypeTemplateDto {
  @ApiProperty({ description: 'Código de la plantilla' })
  code!: string;

  @ApiProperty({ description: 'Nombre de la plantilla' })
  name!: string;

  @ApiProperty({ description: 'Descripción de la plantilla' })
  description!: string;

  @ApiPropertyOptional({ description: 'Edad mínima' })
  ageRangeMin!: number | null;

  @ApiPropertyOptional({ description: 'Edad máxima' })
  ageRangeMax!: number | null;

  @ApiProperty({ description: 'Derecho a voto' })
  votingRight!: boolean;

  @ApiProperty({ description: 'Elegible para cargo' })
  eligibleForOffice!: boolean;

  @ApiProperty({ description: 'Antigüedad mínima para votar (meses)' })
  minimumSeniorityForVoting!: number;

  @ApiProperty({ description: 'Antigüedad mínima para cargo (meses)' })
  minimumSeniorityForOffice!: number;

  @ApiProperty({ description: 'Configuración de reglas' })
  rulesConfig!: object;

  /**
   * Construye un DTO a partir de los datos de plantilla.
   */
  static fromTemplate(template: MemberTypeTemplate): MemberTypeTemplateDto {
    const dto = new MemberTypeTemplateDto();
    dto.code = template.code;
    dto.name = template.name;
    dto.description = template.description;
    dto.ageRangeMin = template.ageRangeMin;
    dto.ageRangeMax = template.ageRangeMax;
    dto.votingRight = template.votingRight;
    dto.eligibleForOffice = template.eligibleForOffice;
    dto.minimumSeniorityForVoting = template.minimumSeniorityForVoting;
    dto.minimumSeniorityForOffice = template.minimumSeniorityForOffice;
    dto.rulesConfig = template.rulesConfig;
    return dto;
  }
}
