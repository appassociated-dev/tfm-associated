import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Member } from '../../domain/aggregates/member';

/**
 * DTO de respuesta para la ficha completa de un socio (UC-006).
 * Representa la vista pública del aggregate Member con todos los datos de ficha.
 * Nota: el IBAN nunca se devuelve en texto plano; solo enmascarado.
 */
export class MemberResponseDto {
  @ApiProperty({ description: 'ID del socio (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Número de socio' })
  memberNumber!: string;

  @ApiProperty({ description: 'Nombre del socio' })
  name!: string;

  @ApiProperty({ description: 'Apellidos del socio' })
  surnames!: string;

  @ApiProperty({ description: 'Fecha de nacimiento' })
  birthDate!: Date;

  @ApiProperty({ description: 'Edad calculada' })
  age!: number;

  @ApiProperty({ description: 'Tipo de documento de identidad' })
  documentType!: string;

  @ApiProperty({ description: 'Número de documento de identidad' })
  documentNumber!: string;

  @ApiProperty({ description: 'Email del socio' })
  email!: string;

  @ApiPropertyOptional({ description: 'Teléfono del socio' })
  phone!: string | null;

  @ApiPropertyOptional({ description: 'Dirección del socio' })
  address!: string | null;

  @ApiPropertyOptional({ description: 'Código postal' })
  postalCode!: string | null;

  @ApiPropertyOptional({ description: 'Ciudad' })
  city!: string | null;

  @ApiPropertyOptional({ description: 'IBAN enmascarado' })
  ibanMasked!: string | null;

  @ApiProperty({ description: 'ID del tipo de socio (UUID)' })
  memberTypeId!: string;

  @ApiPropertyOptional({ description: 'Nombre del tipo de socio' })
  memberTypeName!: string | null;

  @ApiProperty({ description: 'Estado actual del socio' })
  currentStatus!: string;

  @ApiPropertyOptional({ description: 'Campos personalizados' })
  customFields!: Record<string, unknown> | null;

  @ApiProperty({ description: 'Fecha de registro' })
  registrationDate!: Date;

  @ApiPropertyOptional({ description: 'Fecha de baja' })
  leaveDate!: Date | null;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt!: Date;

  /**
   * Construye un DTO de respuesta a partir del aggregate de dominio.
   * @param member Aggregate Member.
   * @param memberTypeName Nombre del tipo de socio (resuelto externamente).
   */
  static fromDomain(member: Member, memberTypeName?: string): MemberResponseDto {
    const dto = new MemberResponseDto();
    dto.id = member.id.toValue();
    dto.memberNumber = member.memberNumber?.value ?? '';
    dto.name = member.personalData?.name ?? '';
    dto.surnames = member.personalData?.surnames ?? '';
    dto.birthDate = member.personalData?.birthDate ?? new Date();
    dto.age = member.personalData?.getAge() ?? 0;
    dto.documentType = member.identityDocument?.type ?? '';
    dto.documentNumber = member.identityDocument?.number ?? '';
    dto.email = member.contactData?.email ?? '';
    dto.phone = member.contactData?.phone ?? null;
    dto.address = member.contactData?.address ?? null;
    dto.postalCode = member.contactData?.postalCode ?? null;
    dto.city = member.contactData?.city ?? null;
    dto.ibanMasked = member.bankDetails?.getMaskedIban() ?? null;
    dto.memberTypeId = member.memberTypeId.toValue();
    dto.memberTypeName = memberTypeName ?? null;
    dto.currentStatus = member.getCurrentStatus().value;
    dto.customFields = member.customFields?.data ?? null;
    dto.registrationDate = member.registrationDate ?? new Date();
    dto.leaveDate = member.leaveDate ?? null;
    dto.createdAt = member.createdAt ?? member.registrationDate ?? new Date();
    dto.updatedAt = member.updatedAt ?? dto.createdAt;
    return dto;
  }
}
