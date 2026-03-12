import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Member } from '../../domain/aggregates/member';

/**
 * DTO de respuesta para listados de socios (UC-006).
 * Vista resumida del aggregate Member para listas.
 */
export class MemberListResponseDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Número de socio' })
  memberNumber!: string;

  @ApiProperty({ description: 'Nombre del socio' })
  name!: string;

  @ApiProperty({ description: 'Apellidos del socio' })
  surnames!: string;

  @ApiProperty({ description: 'Email del socio' })
  email!: string;

  @ApiProperty({ description: 'Estado actual del socio' })
  currentStatus!: string;

  @ApiPropertyOptional({ description: 'Nombre del tipo de socio' })
  memberTypeName!: string | null;

  @ApiProperty({ description: 'Fecha de registro' })
  registrationDate!: Date;

  /**
   * Construye un DTO de respuesta para listados a partir del aggregate.
   * @param member Aggregate Member.
   * @param memberTypeName Nombre del tipo de socio (resuelto externamente).
   */
  static fromDomain(member: Member, memberTypeName?: string): MemberListResponseDto {
    const dto = new MemberListResponseDto();
    dto.id = member.id.toValue();
    dto.memberNumber = member.memberNumber?.value ?? '';
    dto.name = member.personalData?.name ?? '';
    dto.surnames = member.personalData?.surnames ?? '';
    dto.email = member.contactData?.email ?? '';
    dto.currentStatus = member.getCurrentStatus().value;
    dto.memberTypeName = memberTypeName ?? null;
    dto.registrationDate = member.registrationDate ?? new Date();
    return dto;
  }
}
