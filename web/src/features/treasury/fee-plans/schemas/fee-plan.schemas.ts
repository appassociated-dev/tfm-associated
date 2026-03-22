import { z } from 'zod';

// === Enums ===

export const frequencySchema = z.enum(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM']);
export const planTypeSchema = z.enum(['ONE_TIME', 'RECURRING']);

// === Schema base del plan de cuota ===

export const feePlanSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().nullable(),
  type: planTypeSchema,
  amount: z.number().int().min(0),
  frequency: frequencySchema.nullable(),
  billingMonths: z.array(z.number().int().min(1).max(12)),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// === Schema vinculación plan ↔ tipo socio ===

export const memberTypeFeePlanSchema = z.object({
  memberTypeId: z.string().uuid(),
  memberTypeName: z.string(),
  feePlanId: z.string().uuid(),
  isDefault: z.boolean(),
  order: z.number().int().min(0),
  active: z.boolean(),
});

// === Schema plan con vinculaciones ===

export const feePlanDetailSchema = feePlanSchema.extend({
  linkedMemberTypes: z.array(memberTypeFeePlanSchema),
});

// === Schema listado paginado ===

export const feePlanListResponseSchema = z.object({
  data: z.array(feePlanSchema),
  total: z.number(),
});

// === Schema tipo de socio (para selector vinculación) ===

export const memberTypeOptionSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
});

// === Schema plantilla predefinida ===

export const feePlanTemplateSchema = z.object({
  collectivityType: z.string(),
  templates: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      type: planTypeSchema,
      amount: z.number(),
      frequency: frequencySchema.nullable(),
      billingMonths: z.array(z.number().int().min(1).max(12)),
    }),
  ),
});

// === Schemas de input (creación/edición) ===

/** Schema base (sin refinements) para reusar con .partial() */
const createFeePlanInputBaseSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  type: planTypeSchema,
  amount: z.number().int().min(1),
  frequency: frequencySchema.nullable().optional(),
  billingMonths: z.array(z.number().int().min(1).max(12)).optional(),
});

/** Schema con validacion condicional: si es RECURRING, frequency y billingMonths son obligatorios. */
export const createFeePlanInputSchema = createFeePlanInputBaseSchema
  .refine(
    (data) => {
      // Si es RECURRING, frequency es obligatorio
      if (data.type === 'RECURRING') {
        return data.frequency != null;
      }
      return true;
    },
    {
      message: 'La periodicidad es obligatoria para planes periodicos',
      path: ['frequency'],
    },
  )
  .refine(
    (data) => {
      // Si es RECURRING, billingMonths debe tener al menos 1 mes
      if (data.type === 'RECURRING') {
        return data.billingMonths != null && data.billingMonths.length > 0;
      }
      return true;
    },
    {
      message: 'Seleccione al menos un mes de facturacion para planes periodicos',
      path: ['billingMonths'],
    },
  );

export const updateFeePlanInputSchema = createFeePlanInputBaseSchema.partial().omit({ code: true });

export const linkMemberTypeInputSchema = z.object({
  memberTypeId: z.string().uuid(),
  isDefault: z.boolean(),
  order: z.number().int().min(0),
});

// === Tipos inferidos (TODOS exportados) ===

export type Frequency = z.infer<typeof frequencySchema>;
export type PlanType = z.infer<typeof planTypeSchema>;
export type FeePlan = z.infer<typeof feePlanSchema>;
export type FeePlanDetail = z.infer<typeof feePlanDetailSchema>;
export type MemberTypeFeePlan = z.infer<typeof memberTypeFeePlanSchema>;
export type MemberTypeOption = z.infer<typeof memberTypeOptionSchema>;
export type FeePlanTemplate = z.infer<typeof feePlanTemplateSchema>;
export type CreateFeePlanInput = z.infer<typeof createFeePlanInputSchema>;
export type UpdateFeePlanInput = z.infer<typeof updateFeePlanInputSchema>;
export type LinkMemberTypeInput = z.infer<typeof linkMemberTypeInputSchema>;
