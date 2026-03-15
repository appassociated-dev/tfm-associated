import { z } from 'zod';

// === Schema de datos personales (paso 1 del wizard) ===

export const personalDataSchema = z.object({
  dni: z.string().min(1, 'DNI/NIE es obligatorio').max(20),
  firstName: z.string().min(1, 'Nombre es obligatorio').max(100),
  lastName: z.string().min(1, 'Apellidos es obligatorio').max(200),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha de nacimiento inválida'),
  email: z.string().email('Email inválido'),
  phone: z.string().max(20).nullable(),
  address: z.string().max(300).nullable(),
  postalCode: z.string().max(10).nullable(),
  city: z.string().max(100).nullable(),
});

// === Schema de tipo de socio (selector del paso 2) ===

export const memberTypeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  ageRangeMin: z.number().int().nullable(),
  ageRangeMax: z.number().int().nullable(),
  votingRight: z.boolean(),
  eligibleForOffice: z.boolean(),
  active: z.boolean(),
});

// === Schema de cargo de inscripción (paso 3) ===

export const registrationChargeSchema = z.object({
  feePlanId: z.string().uuid(),
  feePlanName: z.string(),
  amount: z.number().min(0),
});

// === Schema de la petición completa de alta simple ===

export const simpleRegistrationRequestSchema = z.object({
  dni: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  birthDate: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  memberTypeId: z.string().uuid(),
});

// === Schema de respuesta de alta exitosa ===

export const registrationResponseSchema = z.object({
  memberId: z.string().uuid(),
  memberNumber: z.string(),
  status: z.string(),
  memberTypeName: z.string(),
  registrationDate: z.string().datetime(),
  registrationCharge: z
    .object({
      chargeId: z.string().uuid(),
      amount: z.number(),
      description: z.string(),
      status: z.string(),
    })
    .nullable(),
});

// === Schema de verificación de unicidad de DNI ===

export const dniCheckResponseSchema = z.object({
  exists: z.boolean(),
  memberName: z.string().nullable(),
  memberNumber: z.string().nullable(),
});

// === Tipos inferidos ===

export type PersonalData = z.infer<typeof personalDataSchema>;
export type MemberType = z.infer<typeof memberTypeSchema>;
export type RegistrationCharge = z.infer<typeof registrationChargeSchema>;
export type SimpleRegistrationRequest = z.infer<typeof simpleRegistrationRequestSchema>;
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;
export type DniCheckResponse = z.infer<typeof dniCheckResponseSchema>;
