import { z } from 'zod';

import i18n from '@/i18n/i18n';

// === Schema de datos personales (paso 1 del wizard) ===

export const personalDataSchema = z.object({
  dni: z.string().min(1, i18n.t('membership:registration.validation.dniRequired')).max(20),
  name: z.string().min(1, i18n.t('membership:registration.validation.nameRequired')).max(100),
  surnames: z
    .string()
    .min(1, i18n.t('membership:registration.validation.surnamesRequired'))
    .max(200),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: i18n.t('membership:registration.validation.birthDateInvalid'),
  }),
  email: z.string().email(i18n.t('membership:registration.validation.emailInvalid')),
  phone: z.string().max(20).nullable(),
  address: z.string().max(300).nullable(),
  postalCode: z.string().max(10).nullable(),
  city: z.string().max(100).nullable(),
  /**
   * UI-only fields — used for displaying and carrying legal representative data through the
   * registration wizard (e.g. to the confirmation step). These fields are NOT sent to the
   * backend: `registration.api.ts` constructs the API payload explicitly and omits them.
   * They are also defined in `personalDataFormSchema` for form validation purposes.
   */
  legalRepresentativeName: z.string().max(200).optional(),
  legalRepresentativeDocumentNumber: z.string().max(20).optional(),
});

// === Schema de tipo de socio (selector del paso 2) ===
// Campos obligatorios: los que usa el wizard de alta (subset estrecho).
// Campos opcionales: resto de MemberTypeResponseDto que no usa el wizard (REQ-ZOD-005).

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
  // Campos presentes en MemberTypeResponseDto, no usados por el wizard — se añaden como opcionales
  minimumSeniorityForVoting: z.number().int().optional(),
  minimumSeniorityForOffice: z.number().int().optional(),
  automaticTransitionTargetId: z.string().uuid().nullable().optional(),
  rulesConfig: z.unknown().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
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
  name: z.string(),
  surnames: z.string(),
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
  /** Aviso no bloqueante de email duplicado (REQ-ZOD-006). Presente en SimpleRegistrationResponseDto. */
  emailWarning: z.string().optional(),
});

// === Schema de verificación de unicidad de DNI ===

export const dniCheckResponseSchema = z.object({
  exists: z.boolean(),
  memberName: z.string().nullish(),
  memberNumber: z.string().nullish(),
});

// === Schema de verificación de unicidad de email ===

export const emailCheckResponseSchema = z.object({
  exists: z.boolean(),
});

// === Schema de precondiciones del alta simple ===

export const registrationPlanInfoSchema = z.object({
  feePlanId: z.string().uuid(),
  name: z.string(),
  amount: z.number(),
});

export const preconditionsResponseSchema = z.object({
  hasFiscalYear: z.boolean(),
  hasMemberTypes: z.boolean(),
  hasRegistrationPlan: z.boolean(),
  registrationPlan: registrationPlanInfoSchema.nullish(),
  errors: z.array(z.string()),
});

// === Schema del formulario de datos personales (paso 1 — interno del form) ===
// Nota: birthDate es string | null porque Mantine 8 DateInput devuelve string ("YYYY-MM-DD") en onChange.
// El schema de API (personalDataSchema) espera string ISO — la conversion se hace en el useEffect de onValidChange.

export const personalDataFormSchema = z.object({
  dni: z.string().min(1, i18n.t('membership:registration.validation.dniRequired')).max(20),
  name: z.string().min(1, i18n.t('membership:registration.validation.nameRequired')).max(100),
  surnames: z
    .string()
    .min(1, i18n.t('membership:registration.validation.surnamesRequired'))
    .max(200),
  birthDate: z
    .string({ error: i18n.t('membership:registration.validation.birthDateRequired') })
    .nullable()
    .refine((val) => val !== null && val.trim() !== '', {
      message: i18n.t('membership:registration.validation.birthDateRequired'),
    }),
  email: z
    .string()
    .min(1, i18n.t('membership:registration.validation.emailRequired'))
    .email(i18n.t('membership:registration.validation.emailInvalidForm')),
  phone: z.string().max(20),
  address: z.string().max(300),
  postalCode: z.string().refine((val) => !val || /^\d{5}$/.test(val), {
    message: i18n.t('membership:registration.validation.postalCodeFormat'),
  }),
  city: z.string().max(100),
  // Campos opcionales para representante legal (solo cuando el socio es menor de edad)
  legalRepresentativeName: z.string().max(200).optional(),
  legalRepresentativeDocumentNumber: z.string().max(20).optional(),
});

export type PersonalDataFormValues = z.infer<typeof personalDataFormSchema>;

// === Tipos inferidos ===

export type PersonalData = z.infer<typeof personalDataSchema>;
export type MemberType = z.infer<typeof memberTypeSchema>;
export type RegistrationCharge = z.infer<typeof registrationChargeSchema>;
export type SimpleRegistrationRequest = z.infer<typeof simpleRegistrationRequestSchema>;
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;
export type DniCheckResponse = z.infer<typeof dniCheckResponseSchema>;
export type EmailCheckResponse = z.infer<typeof emailCheckResponseSchema>;
export type PreconditionsResponse = z.infer<typeof preconditionsResponseSchema>;
