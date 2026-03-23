import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberType } from '../../domain/aggregates/member-type';

/**
 * DTO de respuesta para un tipo de socio.
 * Representa la vista pública del aggregate MemberType.
 */
export class MemberTypeResponseDto {
  @ApiProperty({ description: 'ID del tipo de socio (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Código único del tipo de socio' })
  code!: string;

  @ApiProperty({ description: 'Nombre del tipo de socio' })
  name!: string;

  @ApiPropertyOptional({ description: 'Descripción del tipo de socio' })
  description!: string;

  @ApiPropertyOptional({ description: 'Edad mínima permitida' })
  ageRangeMin!: number | null;

  @ApiPropertyOptional({ description: 'Edad máxima permitida' })
  ageRangeMax!: number | null;

  @ApiProperty({ description: 'Derecho a voto' })
  votingRight!: boolean;

  @ApiProperty({ description: 'Elegible para cargo directivo' })
  eligibleForOffice!: boolean;

  @ApiProperty({ description: 'Antigüedad mínima para votar (meses)' })
  minimumSeniorityForVoting!: number;

  @ApiProperty({ description: 'Antigüedad mínima para cargo (meses)' })
  minimumSeniorityForOffice!: number;

  @ApiPropertyOptional({ description: 'ID del tipo destino de transición automática' })
  automaticTransitionTargetId!: string | null;

  @ApiPropertyOptional({ description: 'Configuración de reglas' })
  rulesConfig!: object | null;

  @ApiProperty({ description: 'Estado activo' })
  active!: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt!: Date;

  /**
   * Construye un DTO de respuesta a partir del aggregate de dominio.
   */
  static fromDomain(memberType: MemberType): MemberTypeResponseDto {
    const dto = new MemberTypeResponseDto();
    dto.id = memberType.id.toValue();
    dto.code = memberType.code.value;
    dto.name = memberType.name;
    dto.description = memberType.description;
    dto.ageRangeMin = memberType.ageRange.min;
    dto.ageRangeMax = memberType.ageRange.max;
    dto.votingRight = memberType.votingRight;
    dto.eligibleForOffice = memberType.eligibleForOffice;
    dto.minimumSeniorityForVoting = memberType.minimumSeniorityForVoting;
    dto.minimumSeniorityForOffice = memberType.minimumSeniorityForOffice;
    dto.automaticTransitionTargetId = memberType.automaticTransitionTargetId
      ? memberType.automaticTransitionTargetId.toValue()
      : null;
    dto.rulesConfig = memberType.rulesConfig.getRaw();
    dto.active = memberType.active;
    dto.createdAt = memberType.createdAt;
    dto.updatedAt = memberType.updatedAt;
    return dto;
  }
}
