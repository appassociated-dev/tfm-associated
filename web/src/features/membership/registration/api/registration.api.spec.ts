// Tests para registration.api.ts — funciones de la capa API de alta de socios.
// Valida URLs (incluyendo encode de parámetros), métodos HTTP, transformación
// de payload (firstName/lastName → name/surnames, dni → documentType/documentNumber),
// parseo Zod de respuestas, y manejo de errores.
// Usa MSW para interceptar peticiones a nivel de red.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { buildMemberType, buildRegistrationResponse, resetMemberCounters } from '@/test/factories';

// Mock de auth.provider para el interceptor de httpClient
vi.mock('@/features/auth/context/auth.provider', () => ({
  getAccessToken: () => 'test-token',
  setTokens: () => {},
}));

// Importar DESPUÉS de vi.mock
import {
  checkDni,
  checkEmail,
  validatePreconditions,
  getMemberTypes,
  simpleRegistration,
} from './registration.api';

describe('Registration API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMemberCounters();
    localStorage.clear();
  });

  // ===========================================
  // checkDni()
  // ===========================================
  describe('checkDni()', () => {
    it('debería enviar GET a /v1/members/check-dni/DNI/:dni para DNI español', async () => {
      // Arrange
      let capturedUrl: string | undefined;

      server.use(
        http.get('*/v1/members/check-dni/:docType/:dni', ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json(apiResponse({ exists: false }));
        }),
      );

      // Act
      const result = await checkDni('12345678A');

      // Assert
      expect(capturedUrl).toContain('/check-dni/DNI/12345678A');
      expect(result.exists).toBe(false);
    });

    it('debería enviar GET con tipo NIE para documentos que empiezan con X/Y/Z', async () => {
      // Arrange
      let capturedDocType: string | undefined;

      server.use(
        http.get('*/v1/members/check-dni/:docType/:dni', ({ params }) => {
          capturedDocType = params.docType as string;
          return HttpResponse.json(apiResponse({ exists: false }));
        }),
      );

      // Act — triangulación con X
      await checkDni('X1234567L');

      // Assert
      expect(capturedDocType).toBe('NIE');
    });

    it('debería detectar NIE con letra Y (triangulación)', async () => {
      // Arrange
      let capturedDocType: string | undefined;

      server.use(
        http.get('*/v1/members/check-dni/:docType/:dni', ({ params }) => {
          capturedDocType = params.docType as string;
          return HttpResponse.json(apiResponse({ exists: false }));
        }),
      );

      // Act
      await checkDni('Y9876543M');

      // Assert
      expect(capturedDocType).toBe('NIE');
    });

    it('debería devolver exists: true cuando el DNI ya existe', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/check-dni/:docType/:dni', () => {
          return HttpResponse.json(
            apiResponse({
              exists: true,
              memberName: 'Juan García',
              memberNumber: 'SOC-0042',
            }),
          );
        }),
      );

      // Act
      const result = await checkDni('11111111H');

      // Assert
      expect(result.exists).toBe(true);
      expect(result.memberName).toBe('Juan García');
      expect(result.memberNumber).toBe('SOC-0042');
    });

    it('debería propagar error 500 del servidor', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/check-dni/:docType/:dni', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Error interno', details: null } },
            { status: 500 },
          );
        }),
      );

      // Act & Assert
      await expect(checkDni('12345678A')).rejects.toThrow();
    });
  });

  // ===========================================
  // checkEmail()
  // ===========================================
  describe('checkEmail()', () => {
    it('debería enviar GET a /v1/members/check-email/:email', async () => {
      // Arrange
      let capturedUrl: string | undefined;

      server.use(
        http.get('*/v1/members/check-email/:email', ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json(apiResponse({ exists: false }));
        }),
      );

      // Act
      const result = await checkEmail('test@club.es');

      // Assert
      expect(capturedUrl).toContain('/check-email/');
      expect(result.exists).toBe(false);
    });

    it('debería devolver exists: true cuando el email ya existe', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/check-email/:email', () => {
          return HttpResponse.json(apiResponse({ exists: true }));
        }),
      );

      // Act
      const result = await checkEmail('duplicado@club.es');

      // Assert
      expect(result.exists).toBe(true);
    });

    it('debería funcionar con email que contiene caracteres especiales (triangulación)', async () => {
      // Arrange
      let capturedEmail: string | undefined;

      server.use(
        http.get('*/v1/members/check-email/:email', ({ params }) => {
          capturedEmail = params.email as string;
          return HttpResponse.json(apiResponse({ exists: false }));
        }),
      );

      // Act
      await checkEmail('user+tag@club.es');

      // Assert — el email se envía encoded en la URL
      expect(capturedEmail).toBeDefined();
    });

    it('debería propagar error del servidor', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/check-email/:email', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Error', details: null } },
            { status: 500 },
          );
        }),
      );

      // Act & Assert
      await expect(checkEmail('test@club.es')).rejects.toThrow();
    });
  });

  // ===========================================
  // validatePreconditions()
  // ===========================================
  describe('validatePreconditions()', () => {
    it('debería enviar GET a /v1/members/preconditions', async () => {
      // Arrange
      let capturedUrl: string | undefined;
      const preconditions = {
        hasFiscalYear: true,
        hasMemberTypes: true,
        hasRegistrationPlan: true,
        registrationPlan: {
          feePlanId: 'f0000001-0000-4000-8000-000000000001',
          name: 'Cuota de Alta',
          amount: 5000,
        },
        errors: [],
      };

      server.use(
        http.get('*/v1/members/preconditions', ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json(apiResponse(preconditions));
        }),
      );

      // Act
      const result = await validatePreconditions();

      // Assert
      expect(capturedUrl).toContain('/v1/members/preconditions');
      expect(result.hasFiscalYear).toBe(true);
      expect(result.hasMemberTypes).toBe(true);
      expect(result.registrationPlan?.name).toBe('Cuota de Alta');
    });

    it('debería parsear precondiciones fallidas con errores', async () => {
      // Arrange
      const preconditions = {
        hasFiscalYear: false,
        hasMemberTypes: false,
        hasRegistrationPlan: false,
        registrationPlan: null,
        errors: ['No existe un ejercicio fiscal activo', 'No hay tipos de socio configurados'],
      };

      server.use(
        http.get('*/v1/members/preconditions', () => {
          return HttpResponse.json(apiResponse(preconditions));
        }),
      );

      // Act
      const result = await validatePreconditions();

      // Assert
      expect(result.hasFiscalYear).toBe(false);
      expect(result.registrationPlan).toBeNull();
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('ejercicio fiscal');
    });

    it('debería propagar error del servidor', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/preconditions', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Error', details: null } },
            { status: 500 },
          );
        }),
      );

      // Act & Assert
      await expect(validatePreconditions()).rejects.toThrow();
    });
  });

  // ===========================================
  // getMemberTypes()
  // ===========================================
  describe('getMemberTypes()', () => {
    it('debería enviar GET a /v1/member-types', async () => {
      // Arrange
      let capturedUrl: string | undefined;
      const types = [buildMemberType(), buildMemberType()];

      server.use(
        http.get('*/v1/member-types', ({ request }) => {
          capturedUrl = new URL(request.url).pathname;
          return HttpResponse.json(apiResponse(types));
        }),
      );

      // Act
      const result = await getMemberTypes();

      // Assert
      expect(capturedUrl).toContain('/v1/member-types');
      expect(result).toHaveLength(2);
    });

    it('debería parsear MemberType con campos de edad y permisos (triangulación)', async () => {
      // Arrange
      const types = [
        buildMemberType({
          code: 'JUVENIL',
          name: 'Socio Juvenil',
          ageRangeMin: 14,
          ageRangeMax: 17,
          votingRight: false,
          eligibleForOffice: false,
        }),
        buildMemberType({
          code: 'ORDINARIO',
          name: 'Socio Ordinario',
          ageRangeMin: 18,
          ageRangeMax: null,
          votingRight: true,
          eligibleForOffice: true,
        }),
      ];

      server.use(
        http.get('*/v1/member-types', () => {
          return HttpResponse.json(apiResponse(types));
        }),
      );

      // Act
      const result = await getMemberTypes();

      // Assert
      expect(result[0].code).toBe('JUVENIL');
      expect(result[0].ageRangeMin).toBe(14);
      expect(result[0].votingRight).toBe(false);
      expect(result[1].code).toBe('ORDINARIO');
      expect(result[1].ageRangeMax).toBeNull();
      expect(result[1].eligibleForOffice).toBe(true);
    });

    it('debería devolver array vacío si no hay tipos configurados', async () => {
      // Arrange
      server.use(
        http.get('*/v1/member-types', () => {
          return HttpResponse.json(apiResponse([]));
        }),
      );

      // Act
      const result = await getMemberTypes();

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ===========================================
  // simpleRegistration()
  // ===========================================
  describe('simpleRegistration()', () => {
    it('debería enviar POST a /v1/members/simple-registration con payload transformado', async () => {
      // Arrange
      let capturedBody: unknown;
      const regResponse = buildRegistrationResponse();

      server.use(
        http.post('*/v1/members/simple-registration', async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json(apiResponse(regResponse));
        }),
      );

      // Act
      const result = await simpleRegistration({
        dni: '12345678A',
        firstName: 'María',
        lastName: 'García López',
        birthDate: '1990-05-15',
        email: 'maria@club.es',
        phone: '+34666777888',
        address: 'Calle Mayor 1',
        postalCode: '28001',
        city: 'Madrid',
        memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c1',
      });

      // Assert — verifica transformación de campos
      expect(capturedBody).toEqual({
        name: 'María', // firstName → name
        surnames: 'García López', // lastName → surnames
        documentType: 'DNI', // calculado de dni
        documentNumber: '12345678A', // dni → documentNumber
        birthDate: '1990-05-15',
        email: 'maria@club.es',
        phone: '+34666777888',
        address: 'Calle Mayor 1',
        postalCode: '28001',
        city: 'Madrid',
        memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c1',
      });
      expect(result).toEqual(regResponse);
    });

    it('debería transformar NIE correctamente (triangulación con X)', async () => {
      // Arrange
      let capturedBody: Record<string, unknown> | undefined;

      server.use(
        http.post('*/v1/members/simple-registration', async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(apiResponse(buildRegistrationResponse()));
        }),
      );

      // Act
      await simpleRegistration({
        dni: 'X1234567L',
        firstName: 'Pierre',
        lastName: 'Dubois',
        birthDate: '1985-03-20',
        email: 'pierre@club.es',
        phone: null,
        address: null,
        postalCode: null,
        city: null,
        memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c2',
      });

      // Assert
      expect(capturedBody?.documentType).toBe('NIE');
      expect(capturedBody?.documentNumber).toBe('X1234567L');
      expect(capturedBody?.name).toBe('Pierre');
      expect(capturedBody?.surnames).toBe('Dubois');
    });

    it('debería parsear RegistrationResponse con cargo de inscripción', async () => {
      // Arrange
      const regResponse = buildRegistrationResponse({
        registrationCharge: {
          chargeId: 'a0000001-0000-4000-8000-000000000099',
          amount: 5000,
          description: 'Cuota de inscripción',
          status: 'PENDING',
        },
      });

      server.use(
        http.post('*/v1/members/simple-registration', () => {
          return HttpResponse.json(apiResponse(regResponse));
        }),
      );

      // Act
      const result = await simpleRegistration({
        dni: '99999999R',
        firstName: 'Test',
        lastName: 'User',
        birthDate: '2000-01-01',
        email: 'test@club.es',
        phone: null,
        address: null,
        postalCode: null,
        city: null,
        memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c1',
      });

      // Assert
      expect(result.registrationCharge).not.toBeNull();
      expect(result.registrationCharge?.amount).toBe(5000);
      expect(result.registrationCharge?.status).toBe('PENDING');
    });

    it('debería propagar error 409 si el socio ya existe', async () => {
      // Arrange
      server.use(
        http.post('*/v1/members/simple-registration', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'MEMBER_ALREADY_EXISTS',
                message: 'El DNI ya está registrado',
                details: null,
              },
            },
            { status: 409 },
          );
        }),
      );

      // Act & Assert
      await expect(
        simpleRegistration({
          dni: '12345678A',
          firstName: 'Dup',
          lastName: 'User',
          birthDate: '1990-01-01',
          email: 'dup@club.es',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
          memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c1',
        }),
      ).rejects.toThrow();
    });

    it('debería propagar error 422 si los datos no son válidos', async () => {
      // Arrange
      server.use(
        http.post('*/v1/members/simple-registration', () => {
          return HttpResponse.json(
            {
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Email inválido',
                details: { field: 'email' },
              },
            },
            { status: 422 },
          );
        }),
      );

      // Act & Assert
      await expect(
        simpleRegistration({
          dni: '12345678A',
          firstName: 'Test',
          lastName: 'User',
          birthDate: '1990-01-01',
          email: 'bad-email',
          phone: null,
          address: null,
          postalCode: null,
          city: null,
          memberTypeId: 'f47ac10b-58cc-4372-a567-0000000000c1',
        }),
      ).rejects.toThrow();
    });
  });
});
