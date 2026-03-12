import { Injectable, Inject } from '@nestjs/common';
import { Member, ReconstituteMemberProps } from '../../domain/aggregates/member';
import { MemberId } from '../../domain/value-objects/member-id';
import { MemberTypeId } from '../../domain/value-objects/member-type-id';
import { MemberStatus } from '../../domain/value-objects/member-status';
import { MemberNumber } from '../../domain/value-objects/member-number';
import { PersonalData } from '../../domain/value-objects/personal-data';
import { ContactData } from '../../domain/value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../../domain/value-objects/identity-document';
import { BankDetails } from '../../domain/value-objects/bank-details';
import { CustomFields } from '../../domain/value-objects/custom-fields';
import { ENCRYPTION_SERVICE, EncryptionService } from '../../domain/ports/encryption-service.port';

/**
 * Datos de un Member tal como los devuelve el Prisma Client.
 * Incluye todos los campos de ficha (UC-006) y los campos previos (UC-007).
 */
export interface PrismaRawMember {
  id: string;
  member_number: string;
  name: string;
  surnames: string;
  birth_date: Date;
  document_type: string;
  document_number: string;
  email: string;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  iban_encrypted: string | null;
  member_type_id: string;
  custom_fields: Record<string, unknown> | null;
  current_status: string;
  registration_date: Date;
  leave_date: Date | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Mapper inyectable para convertir entre el modelo de persistencia Prisma
 * y el aggregate de dominio Member.
 * Integra EncryptionService para cifrar/descifrar IBAN (RNF-006).
 */
@Injectable()
export class MemberPrismaMapper {
  constructor(
    @Inject(ENCRYPTION_SERVICE)
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Convierte un registro del Prisma Client a un aggregate Member.
   * Descifra el IBAN si está presente.
   * Utiliza Member.reconstitute() para evitar emisión de eventos.
   */
  async toDomain(raw: PrismaRawMember): Promise<Member> {
    // Reconstituir MemberNumber
    const memberNumberResult = MemberNumber.fromString(raw.member_number);
    const memberNumber = memberNumberResult.ok ? memberNumberResult.value : undefined;

    // Reconstituir PersonalData
    const personalDataResult = PersonalData.create({
      name: raw.name,
      surnames: raw.surnames,
      birthDate: raw.birth_date,
    });
    const personalData = personalDataResult.ok ? personalDataResult.value : undefined;

    // Reconstituir ContactData
    const contactDataResult = ContactData.create({
      email: raw.email,
      phone: raw.phone,
      address: raw.address,
      postalCode: raw.postal_code,
      city: raw.city,
    });
    const contactData = contactDataResult.ok ? contactDataResult.value : undefined;

    // Reconstituir IdentityDocument
    const identityDocResult = IdentityDocument.create(
      raw.document_type as DocumentType,
      raw.document_number,
    );
    const identityDocument = identityDocResult.ok ? identityDocResult.value : undefined;

    // Descifrar y reconstituir BankDetails
    let bankDetails: BankDetails | null = null;
    if (raw.iban_encrypted) {
      try {
        const decryptedIban = await this.encryptionService.decrypt(raw.iban_encrypted);
        const bankResult = BankDetails.create(decryptedIban);
        if (bankResult.ok) {
          bankDetails = bankResult.value;
        }
      } catch {
        // Si falla el descifrado, dejar bankDetails como null
        // (posible rotación de clave pendiente)
      }
    }

    // Reconstituir CustomFields
    const customFieldsResult = CustomFields.create(
      (raw.custom_fields as Record<string, unknown>) ?? {},
    );
    const customFields = customFieldsResult.ok ? customFieldsResult.value : undefined;

    return Member.reconstitute({
      id: MemberId.fromString(raw.id),
      memberTypeId: MemberTypeId.fromString(raw.member_type_id),
      currentStatus: MemberStatus.fromString(raw.current_status),
      statusHistory: [], // El historial se carga por separado via StatusHistoryRepository
      version: raw.version,
      memberNumber,
      personalData,
      contactData,
      identityDocument,
      bankDetails,
      customFields,
      registrationDate: raw.registration_date,
      leaveDate: raw.leave_date,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    } as ReconstituteMemberProps);
  }

  /**
   * Convierte un aggregate Member a un objeto plano para persistencia.
   * Cifra el IBAN antes de almacenar (RNF-006).
   */
  async toPersistence(member: Member): Promise<Record<string, unknown>> {
    // Cifrar IBAN si está presente
    let ibanEncrypted: string | null = null;
    if (member.bankDetails?.iban) {
      ibanEncrypted = await this.encryptionService.encrypt(member.bankDetails.iban);
    }

    return {
      id: member.id.toValue(),
      member_number: member.memberNumber?.value ?? '',
      name: member.personalData?.name ?? '',
      surnames: member.personalData?.surnames ?? '',
      birth_date: member.personalData?.birthDate ?? new Date(),
      document_type: member.identityDocument?.type ?? '',
      document_number: member.identityDocument?.number ?? '',
      email: member.contactData?.email ?? '',
      phone: member.contactData?.phone ?? null,
      address: member.contactData?.address ?? null,
      postal_code: member.contactData?.postalCode ?? null,
      city: member.contactData?.city ?? null,
      iban_encrypted: ibanEncrypted,
      member_type_id: member.memberTypeId.toValue(),
      custom_fields: member.customFields?.data ?? null,
      current_status: member.getCurrentStatus().value,
      registration_date: member.registrationDate ?? new Date(),
      leave_date: member.leaveDate ?? null,
      version: member.version,
    };
  }

  /**
   * Métodos estáticos de retrocompatibilidad (Task 5).
   * Usados internamente cuando no se necesita cifrado de IBAN.
   * @deprecated Usar los métodos de instancia cuando sea posible.
   */
  static toDomainSync(raw: PrismaRawMember): Member {
    const memberNumberResult = MemberNumber.fromString(raw.member_number);
    const memberNumber = memberNumberResult.ok ? memberNumberResult.value : undefined;

    const personalDataResult = PersonalData.create({
      name: raw.name,
      surnames: raw.surnames,
      birthDate: raw.birth_date,
    });
    const personalData = personalDataResult.ok ? personalDataResult.value : undefined;

    const contactDataResult = ContactData.create({
      email: raw.email,
      phone: raw.phone,
      address: raw.address,
      postalCode: raw.postal_code,
      city: raw.city,
    });
    const contactData = contactDataResult.ok ? contactDataResult.value : undefined;

    const identityDocResult = IdentityDocument.create(
      raw.document_type as DocumentType,
      raw.document_number,
    );
    const identityDocument = identityDocResult.ok ? identityDocResult.value : undefined;

    const customFieldsResult = CustomFields.create(
      (raw.custom_fields as Record<string, unknown>) ?? {},
    );
    const customFields = customFieldsResult.ok ? customFieldsResult.value : undefined;

    return Member.reconstitute({
      id: MemberId.fromString(raw.id),
      memberTypeId: MemberTypeId.fromString(raw.member_type_id),
      currentStatus: MemberStatus.fromString(raw.current_status),
      statusHistory: [],
      version: raw.version,
      memberNumber,
      personalData,
      contactData,
      identityDocument,
      bankDetails: null, // Sin descifrado en modo sync
      customFields,
      registrationDate: raw.registration_date,
      leaveDate: raw.leave_date,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    } as ReconstituteMemberProps);
  }

  static toPersistenceSync(member: Member): Record<string, unknown> {
    return {
      id: member.id.toValue(),
      member_number: member.memberNumber?.value ?? '',
      name: member.personalData?.name ?? '',
      surnames: member.personalData?.surnames ?? '',
      birth_date: member.personalData?.birthDate ?? new Date(),
      document_type: member.identityDocument?.type ?? '',
      document_number: member.identityDocument?.number ?? '',
      email: member.contactData?.email ?? '',
      phone: member.contactData?.phone ?? null,
      address: member.contactData?.address ?? null,
      postal_code: member.contactData?.postalCode ?? null,
      city: member.contactData?.city ?? null,
      iban_encrypted: null, // Sin cifrado en modo sync
      member_type_id: member.memberTypeId.toValue(),
      custom_fields: member.customFields?.data ?? null,
      current_status: member.getCurrentStatus().value,
      registration_date: member.registrationDate ?? new Date(),
      leave_date: member.leaveDate ?? null,
      version: member.version,
    };
  }
}
