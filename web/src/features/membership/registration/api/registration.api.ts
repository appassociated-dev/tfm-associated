import { z } from 'zod';
import { httpClient } from '@/shared/api/http-client';
import {
  dniCheckResponseSchema,
  memberTypeSchema,
  registrationResponseSchema,
  type DniCheckResponse,
  type MemberType,
  type SimpleRegistrationRequest,
  type RegistrationResponse,
} from '../schemas/member-registration.schemas';

/** Verifica si un DNI ya existe en el tenant. */
export async function checkDni(dni: string): Promise<DniCheckResponse> {
  const { data } = await httpClient.get(`/v1/members/check-dni/${encodeURIComponent(dni)}`);
  return dniCheckResponseSchema.parse(data.data ?? data);
}

/** Obtiene tipos de socio activos. */
export async function getMemberTypes(): Promise<MemberType[]> {
  const { data } = await httpClient.get('/v1/member-types');
  return z.array(memberTypeSchema).parse(data.data ?? data);
}

/** Ejecuta alta simple de socio. */
export async function simpleRegistration(
  input: SimpleRegistrationRequest,
): Promise<RegistrationResponse> {
  const { data } = await httpClient.post('/v1/members/simple-registration', input);
  return registrationResponseSchema.parse(data.data ?? data);
}
