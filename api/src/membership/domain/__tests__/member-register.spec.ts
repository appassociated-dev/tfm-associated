import { describe, it, expect } from 'vitest';
import { Member } from '../aggregates/member';
import { MemberTypeId } from '../value-objects/member-type-id';
import { MemberStatus } from '../value-objects/member-status';
import { MemberNumber } from '../value-objects/member-number';
import { PersonalData } from '../value-objects/personal-data';
import { ContactData } from '../value-objects/contact-data';
import { IdentityDocument, DocumentType } from '../value-objects/identity-document';
import { BankDetails } from '../value-objects/bank-details';
import { CustomFields } from '../value-objects/custom-fields';
import { MemberRegisteredEvent } from '../events/member-registered.event';
import { MemberDataUpdatedEvent } from '../events/member-data-updated.event';
import { MemberId } from '../value-objects/member-id';

// --- Helpers ---

function createValidPersonalData() {
  const result = PersonalData.create({
    name: 'Juan',
    surnames: 'García López',
    birthDate: new Date('1990-06-15'),
  });
  if (!result.ok) throw new Error('PersonalData inválido');
  return result.value;
}

function createValidContactData() {
  const result = ContactData.create({
    email: 'juan@example.com',
    phone: '+34612345678',
    address: 'Calle Mayor 1',
    postalCode: '28001',
    city: 'Madrid',
  });
  if (!result.ok) throw new Error('ContactData inválido');
  return result.value;
}

function createValidIdentityDocument() {
  const result = IdentityDocument.create(DocumentType.DNI, '12345678Z');
  if (!result.ok) throw new Error('IdentityDocument inválido');
  return result.value;
}

function createValidBankDetails() {
  const result = BankDetails.create('ES9121000418450200051332');
  if (!result.ok) throw new Error('BankDetails inválido');
  return result.value;
}

function createValidMemberNumber() {
  const result = MemberNumber.fromSequence(1);
  if (!result.ok) throw new Error('MemberNumber inválido');
  return result.value;
}

function createValidCustomFields() {
  const result = CustomFields.create({});
  if (!result.ok) throw new Error('CustomFields inválido');
  return result.value;
}

function createRegisteredMember(overrides?: {
  initialStatus?: MemberStatus;
  bankDetails?: BankDetails | null;
}) {
  const result = Member.register({
    memberTypeId: MemberTypeId.create(),
    memberNumber: createValidMemberNumber(),
    personalData: createValidPersonalData(),
    contactData: createValidContactData(),
    identityDocument: createValidIdentityDocument(),
    bankDetails:
      overrides?.bankDetails !== undefined ? overrides.bankDetails : createValidBankDetails(),
    customFields: createValidCustomFields(),
    initialStatus: overrides?.initialStatus,
  });
  if (!result.ok) throw new Error(`Member.register falló: ${result.error.message}`);
  return result.value;
}

describe('Member — register() y métodos de ficha', () => {
  // --- Factory register ---

  describe('register()', () => {
    it('debería crear un Member con ficha completa y estado ACTIVE por defecto', () => {
      const member = createRegisteredMember();

      expect(member.id).toBeDefined();
      expect(member.memberNumber?.value).toBe('00001');
      expect(member.personalData?.name).toBe('Juan');
      expect(member.personalData?.surnames).toBe('García López');
      expect(member.contactData?.email).toBe('juan@example.com');
      expect(member.identityDocument?.number).toBe('12345678Z');
      expect(member.bankDetails?.iban).toBe('ES9121000418450200051332');
      expect(member.getCurrentStatus().equals(MemberStatus.ACTIVE)).toBe(true);
      expect(member.registrationDate).toBeDefined();
      expect(member.leaveDate).toBeNull();
      expect(member.version).toBe(0);
    });

    it('debería crear un Member con estado APPLICANT si se indica', () => {
      const member = createRegisteredMember({ initialStatus: MemberStatus.APPLICANT });
      expect(member.getCurrentStatus().equals(MemberStatus.APPLICANT)).toBe(true);
      expect(member.getStatusHistory()).toHaveLength(0);
    });

    it('debería emitir un MemberRegisteredEvent', () => {
      const member = createRegisteredMember();
      const events = member.pullDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MemberRegisteredEvent);

      const event = events[0] as MemberRegisteredEvent;
      expect(event.payload.memberNumber).toBe('00001');
      expect(event.payload.name).toBe('Juan');
      expect(event.payload.surnames).toBe('García López');
      expect(event.payload.email).toBe('juan@example.com');
    });

    it('debería crear sin bankDetails (null)', () => {
      const member = createRegisteredMember({ bankDetails: null });
      expect(member.bankDetails).toBeNull();
    });

    it('debería crear una primera entrada en StatusHistory', () => {
      const member = createRegisteredMember();
      const history = member.getStatusHistory();
      expect(history).toHaveLength(1);
      expect(history[0].newStatus.equals(MemberStatus.ACTIVE)).toBe(true);
    });
  });

  // --- updatePersonalData ---

  describe('updatePersonalData()', () => {
    it('debería actualizar nombre y apellidos', () => {
      const member = createRegisteredMember();
      const newData = PersonalData.create({
        name: 'Pedro',
        surnames: 'Martínez Ruiz',
        birthDate: new Date('1990-06-15'),
      });
      if (!newData.ok) throw new Error('PersonalData inválido');

      member.updatePersonalData(newData.value);

      expect(member.personalData?.name).toBe('Pedro');
      expect(member.personalData?.surnames).toBe('Martínez Ruiz');
    });

    it('debería emitir MemberDataUpdatedEvent', () => {
      const member = createRegisteredMember();
      member.pullDomainEvents(); // Limpiar eventos previos

      const newData = PersonalData.create({
        name: 'Pedro',
        surnames: 'Martínez Ruiz',
        birthDate: new Date('1990-06-15'),
      });
      if (!newData.ok) throw new Error('PersonalData inválido');

      member.updatePersonalData(newData.value);

      const events = member.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(MemberDataUpdatedEvent);

      const event = events[0] as MemberDataUpdatedEvent;
      expect(event.payload.modifiedFields).toContain('personalData');
      expect(event.payload.ibanChanged).toBe(false);
    });
  });

  // --- updateContactData ---

  describe('updateContactData()', () => {
    it('debería actualizar datos de contacto', () => {
      const member = createRegisteredMember();
      const newContact = ContactData.create({
        email: 'pedro@example.com',
        phone: '+34698765432',
        address: 'Calle Nueva 5',
        postalCode: '28002',
        city: 'Barcelona',
      });
      if (!newContact.ok) throw new Error('ContactData inválido');

      member.updateContactData(newContact.value);

      expect(member.contactData?.email).toBe('pedro@example.com');
      expect(member.contactData?.city).toBe('Barcelona');
    });

    it('debería emitir MemberDataUpdatedEvent con newEmail', () => {
      const member = createRegisteredMember();
      member.pullDomainEvents();

      const newContact = ContactData.create({
        email: 'pedro@example.com',
        phone: null,
        address: null,
        postalCode: null,
        city: null,
      });
      if (!newContact.ok) throw new Error('ContactData inválido');

      member.updateContactData(newContact.value);

      const events = member.pullDomainEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as MemberDataUpdatedEvent;
      expect(event.payload.modifiedFields).toContain('contactData');
      expect(event.payload.newEmail).toBe('pedro@example.com');
    });
  });

  // --- updateBankDetails ---

  describe('updateBankDetails()', () => {
    it('debería actualizar IBAN', () => {
      const member = createRegisteredMember();
      const newBank = BankDetails.create('GB29NWBK60161331926819');
      if (!newBank.ok) throw new Error('BankDetails inválido');

      member.updateBankDetails(newBank.value);

      expect(member.bankDetails?.iban).toBe('GB29NWBK60161331926819');
    });

    it('debería emitir MemberDataUpdatedEvent con ibanChanged=true', () => {
      const member = createRegisteredMember();
      member.pullDomainEvents();

      const newBank = BankDetails.create('GB29NWBK60161331926819');
      if (!newBank.ok) throw new Error('BankDetails inválido');

      member.updateBankDetails(newBank.value);

      const events = member.pullDomainEvents();
      expect(events).toHaveLength(1);
      const event = events[0] as MemberDataUpdatedEvent;
      expect(event.payload.ibanChanged).toBe(true);
      expect(event.payload.newIban).toBe('GB29NWBK60161331926819');
    });
  });

  // --- updateCustomFields ---

  describe('updateCustomFields()', () => {
    it('debería actualizar campos personalizados', () => {
      const member = createRegisteredMember();
      const newFields = CustomFields.create({ parish: 'San Pedro' }, 'BROTHERHOOD');
      if (!newFields.ok) throw new Error('CustomFields inválido');

      member.updateCustomFields(newFields.value);

      expect(member.customFields?.getValue('parish')).toBe('San Pedro');
    });
  });

  // --- calculateSeniority ---

  describe('calculateSeniority()', () => {
    it('debería calcular antigüedad en años y meses', () => {
      const member = createRegisteredMember();
      const seniority = member.calculateSeniority();
      // Socio recién creado: 0 años, 0 meses
      expect(seniority.years).toBe(0);
      expect(seniority.months).toBe(0);
    });

    it('debería calcular antigüedad de un socio reconstituido con registrationDate antigua', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      twoYearsAgo.setDate(1); // Primer día del mes para evitar problemas de borde

      const member = Member.reconstitute({
        id: MemberId.create(),
        memberTypeId: MemberTypeId.create(),
        currentStatus: MemberStatus.ACTIVE,
        statusHistory: [],
        version: 1,
        memberNumber: createValidMemberNumber(),
        personalData: createValidPersonalData(),
        contactData: createValidContactData(),
        identityDocument: createValidIdentityDocument(),
        bankDetails: createValidBankDetails(),
        customFields: createValidCustomFields(),
        registrationDate: twoYearsAgo,
        leaveDate: null,
      });

      const seniority = member.calculateSeniority();
      expect(seniority.years).toBeGreaterThanOrEqual(1);
    });
  });

  // --- Retrocompatibilidad con Task 5 ---

  describe('retrocompatibilidad con Task 5', () => {
    it('debería mantener Member.create() funcional sin datos de ficha', () => {
      const memberTypeId = MemberTypeId.create();
      const member = Member.create({ memberTypeId });

      expect(member.getCurrentStatus().equals(MemberStatus.APPLICANT)).toBe(true);
      expect(member.version).toBe(0);
      expect(member.getStatusHistory()).toHaveLength(0);
      expect(member.id).toBeDefined();
      // Los nuevos campos deben ser null/undefined en un Member creado con el factory original
      expect(member.memberNumber).toBeUndefined();
      expect(member.personalData).toBeUndefined();
      expect(member.contactData).toBeUndefined();
      expect(member.identityDocument).toBeUndefined();
      expect(member.bankDetails).toBeUndefined();
      expect(member.customFields).toBeUndefined();
    });

    it('debería mantener reconstitute() funcional sin datos de ficha', () => {
      const member = Member.reconstitute({
        id: MemberId.create(),
        memberTypeId: MemberTypeId.create(),
        currentStatus: MemberStatus.ACTIVE,
        statusHistory: [],
        version: 3,
      });

      expect(member.getCurrentStatus().equals(MemberStatus.ACTIVE)).toBe(true);
      expect(member.version).toBe(3);
      expect(member.memberNumber).toBeUndefined();
    });
  });
});
