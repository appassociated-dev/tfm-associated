import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';

import {
  personalDataSchema,
  memberTypeSchema,
  simpleRegistrationRequestSchema,
  registrationResponseSchema,
  dniCheckResponseSchema,
  registrationChargeSchema,
} from './member-registration.schemas';

// === Datos de prueba ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';

const validPersonalData = {
  dni: '12345678Z',
  firstName: 'Juan',
  lastName: 'García López',
  birthDate: '1990-05-15',
  email: 'juan@ejemplo.com',
  phone: null,
  address: null,
  postalCode: null,
  city: null,
};

const validMemberType = {
  id: VALID_UUID,
  code: 'NUMERARIO',
  name: 'Socio Numerario',
  description: 'Socio con plenos derechos',
  ageRangeMin: 18,
  ageRangeMax: 65,
  votingRight: true,
  eligibleForOffice: true,
  active: true,
};

const validRegistrationRequest = {
  dni: '12345678Z',
  firstName: 'Juan',
  lastName: 'García López',
  birthDate: '1990-05-15',
  email: 'juan@ejemplo.com',
  phone: null,
  address: null,
  postalCode: null,
  city: null,
  memberTypeId: VALID_UUID,
};

const validRegistrationResponse = {
  memberId: VALID_UUID,
  memberNumber: 'SOC-0042',
  status: 'ACTIVE',
  memberTypeName: 'Socio Numerario',
  registrationDate: '2026-03-15T10:30:00.000Z',
  registrationCharge: {
    chargeId: VALID_UUID_2,
    amount: 5000,
    description: 'Cuota de inscripción',
    status: 'PENDING',
  },
};

// === Tests ===

describe('personalDataSchema', () => {
  it('deberia aceptar datos personales validos', () => {
    const result = personalDataSchema.parse(validPersonalData);

    expect(result.dni).toBe('12345678Z');
    expect(result.firstName).toBe('Juan');
    expect(result.lastName).toBe('García López');
    expect(result.birthDate).toBe('1990-05-15');
    expect(result.email).toBe('juan@ejemplo.com');
  });

  it('deberia aceptar datos con campos opcionales rellenos', () => {
    const withOptionals = {
      ...validPersonalData,
      phone: '+34 612 345 678',
      address: 'Calle Mayor 1',
      postalCode: '28001',
      city: 'Madrid',
    };
    const result = personalDataSchema.parse(withOptionals);

    expect(result.phone).toBe('+34 612 345 678');
    expect(result.address).toBe('Calle Mayor 1');
    expect(result.postalCode).toBe('28001');
    expect(result.city).toBe('Madrid');
  });

  it('deberia rechazar dni vacio', () => {
    const invalid = { ...validPersonalData, dni: '' };

    expect(() => personalDataSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar email invalido', () => {
    const invalid = { ...validPersonalData, email: 'no-es-email' };

    expect(() => personalDataSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar firstName vacio', () => {
    const invalid = { ...validPersonalData, firstName: '' };

    expect(() => personalDataSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar lastName vacio', () => {
    const invalid = { ...validPersonalData, lastName: '' };

    expect(() => personalDataSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar birthDate invalida', () => {
    const invalid = { ...validPersonalData, birthDate: 'no-es-fecha' };

    expect(() => personalDataSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia aceptar phone como null', () => {
    const result = personalDataSchema.parse(validPersonalData);

    expect(result.phone).toBeNull();
  });
});

describe('memberTypeSchema', () => {
  it('deberia aceptar tipo de socio valido con rangos de edad', () => {
    const result = memberTypeSchema.parse(validMemberType);

    expect(result.id).toBe(VALID_UUID);
    expect(result.code).toBe('NUMERARIO');
    expect(result.ageRangeMin).toBe(18);
    expect(result.ageRangeMax).toBe(65);
    expect(result.votingRight).toBe(true);
    expect(result.eligibleForOffice).toBe(true);
  });

  it('deberia aceptar ageRangeMin y ageRangeMax como null', () => {
    const withNullRanges = {
      ...validMemberType,
      ageRangeMin: null,
      ageRangeMax: null,
    };
    const result = memberTypeSchema.parse(withNullRanges);

    expect(result.ageRangeMin).toBeNull();
    expect(result.ageRangeMax).toBeNull();
  });

  it('deberia aceptar description como null', () => {
    const withNullDesc = { ...validMemberType, description: null };
    const result = memberTypeSchema.parse(withNullDesc);

    expect(result.description).toBeNull();
  });

  it('deberia rechazar id que no es UUID', () => {
    const invalid = { ...validMemberType, id: 'no-es-uuid' };

    expect(() => memberTypeSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('simpleRegistrationRequestSchema', () => {
  it('deberia aceptar request de registro valido', () => {
    const result = simpleRegistrationRequestSchema.parse(validRegistrationRequest);

    expect(result.dni).toBe('12345678Z');
    expect(result.memberTypeId).toBe(VALID_UUID);
    expect(result.email).toBe('juan@ejemplo.com');
  });

  it('deberia rechazar email invalido en request', () => {
    const invalid = { ...validRegistrationRequest, email: 'invalido' };

    expect(() => simpleRegistrationRequestSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar memberTypeId que no es UUID', () => {
    const invalid = { ...validRegistrationRequest, memberTypeId: 'no-uuid' };

    expect(() => simpleRegistrationRequestSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('registrationResponseSchema', () => {
  it('deberia aceptar respuesta valida con cargo de inscripcion', () => {
    const result = registrationResponseSchema.parse(validRegistrationResponse);

    expect(result.memberId).toBe(VALID_UUID);
    expect(result.memberNumber).toBe('SOC-0042');
    expect(result.status).toBe('ACTIVE');
    expect(result.memberTypeName).toBe('Socio Numerario');
    expect(result.registrationCharge).not.toBeNull();
    expect(result.registrationCharge!.amount).toBe(5000);
  });

  it('deberia aceptar respuesta con registrationCharge null', () => {
    const withNullCharge = {
      ...validRegistrationResponse,
      registrationCharge: null,
    };
    const result = registrationResponseSchema.parse(withNullCharge);

    expect(result.registrationCharge).toBeNull();
  });

  it('deberia rechazar memberId que no es UUID', () => {
    const invalid = { ...validRegistrationResponse, memberId: 'no-uuid' };

    expect(() => registrationResponseSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia rechazar registrationDate que no es datetime ISO', () => {
    const invalid = { ...validRegistrationResponse, registrationDate: '15/03/2026' };

    expect(() => registrationResponseSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('dniCheckResponseSchema', () => {
  it('deberia aceptar respuesta exists=true con datos del socio', () => {
    const response = {
      exists: true,
      memberName: 'Juan García',
      memberNumber: 'SOC-0042',
    };
    const result = dniCheckResponseSchema.parse(response);

    expect(result.exists).toBe(true);
    expect(result.memberName).toBe('Juan García');
    expect(result.memberNumber).toBe('SOC-0042');
  });

  it('deberia aceptar respuesta exists=false con campos null', () => {
    const response = {
      exists: false,
      memberName: null,
      memberNumber: null,
    };
    const result = dniCheckResponseSchema.parse(response);

    expect(result.exists).toBe(false);
    expect(result.memberName).toBeNull();
    expect(result.memberNumber).toBeNull();
  });

  it('deberia rechazar respuesta sin campo exists', () => {
    const invalid = { memberName: null, memberNumber: null };

    expect(() => dniCheckResponseSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('registrationChargeSchema', () => {
  it('deberia aceptar cargo de inscripcion valido', () => {
    const charge = {
      feePlanId: VALID_UUID,
      feePlanName: 'Cuota Inscripción',
      amount: 5000,
    };
    const result = registrationChargeSchema.parse(charge);

    expect(result.feePlanId).toBe(VALID_UUID);
    expect(result.feePlanName).toBe('Cuota Inscripción');
    expect(result.amount).toBe(5000);
  });

  it('deberia rechazar amount negativo', () => {
    const invalid = {
      feePlanId: VALID_UUID,
      feePlanName: 'Cuota',
      amount: -100,
    };

    expect(() => registrationChargeSchema.parse(invalid)).toThrow(ZodError);
  });

  it('deberia aceptar amount 0 (inscripcion gratuita)', () => {
    const freeCharge = {
      feePlanId: VALID_UUID,
      feePlanName: 'Gratuita',
      amount: 0,
    };
    const result = registrationChargeSchema.parse(freeCharge);

    expect(result.amount).toBe(0);
  });
});
