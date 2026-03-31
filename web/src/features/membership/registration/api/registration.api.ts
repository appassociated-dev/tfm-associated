import { z } from 'zod';
import { httpClient } from '@/shared/api/http-client';
import {
  dniCheckResponseSchema,
  emailCheckResponseSchema,
  memberTypeSchema,
  registrationResponseSchema,
  type DniCheckResponse,
  type EmailCheckResponse,
  type MemberType,
  type SimpleRegistrationRequest,
  type RegistrationResponse,
  type PreconditionsResponse,
  preconditionsResponseSchema,
} from '../schemas/member-registration.schemas';

/** Determina el tipo de documento (DNI o NIE) a partir del valor. */
function getDocumentType(value: string): 'DNI' | 'NIE' {
  return /^[XYZxyz]/i.test(value) ? 'NIE' : 'DNI';
}

/** Verifica si un DNI ya existe en el tenant. */
export async function checkDni(dni: string): Promise<DniCheckResponse> {
  const docType = getDocumentType(dni);
  const { data } = await httpClient.get(
    `/v1/members/check-dni/${docType}/${encodeURIComponent(dni)}`,
  );
  return dniCheckResponseSchema.parse(data.data ?? data);
}

/** Verifica si un email ya existe en el tenant. */
export async function checkEmail(email: string): Promise<EmailCheckResponse> {
  const { data } = await httpClient.get(`/v1/members/check-email/${encodeURIComponent(email)}`);
  return emailCheckResponseSchema.parse(data.data ?? data);
}

/** Valida precondiciones del alta simple (ejercicio fiscal, tipos de socio, plan de alta). */
export async function validatePreconditions(): Promise<PreconditionsResponse> {
  const { data } = await httpClient.get('/v1/members/preconditions');
  return preconditionsResponseSchema.parse(data.data ?? data);
}

/** Obtiene tipos de socio activos. */
export async function getMemberTypes(): Promise<MemberType[]> {
  const { data } = await httpClient.get('/v1/member-types');
  return z.array(memberTypeSchema).parse(data.data ?? data);
}

/** Ejecuta alta simple de socio.
 * Transforma el payload del frontend al formato del backend:
 * - dni → documentType + documentNumber
 * - legalRepresentative* fields son descartados explícitamente (backend no los acepta aún)
 */
export async function simpleRegistration(
  input: SimpleRegistrationRequest,
): Promise<RegistrationResponse> {
  // Construir payload explícitamente para descartar campos no aceptados por el backend
  // KNOWN LIMITATION: legalRepresentative data collected in UI only — backend SimpleRegistrationDto
  // does not accept legalRepresentativeName / legalRepresentativeDocumentNumber (pending backend change).
  const payload = {
    name: input.name,
    surnames: input.surnames,
    birthDate: input.birthDate,
    email: input.email,
    phone: input.phone,
    address: input.address,
    postalCode: input.postalCode,
    city: input.city,
    memberTypeId: input.memberTypeId,
    documentType: getDocumentType(input.dni),
    documentNumber: input.dni,
  };
  const { data } = await httpClient.post('/v1/members/simple-registration', payload);
  return registrationResponseSchema.parse(data.data ?? data);
}
