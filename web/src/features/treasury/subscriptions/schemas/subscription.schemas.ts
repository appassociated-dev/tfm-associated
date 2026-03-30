import { z } from 'zod';

// === Enums ===

export const cancelReasonSchema = z.enum([
  'PLAN_CHANGE',
  'MEMBER_LEAVE',
  'EXEMPTION',
  'ONE_TIME_COMPLETED',
]);

export const effectiveDateTypeSchema = z.enum(['IMMEDIATE', 'NEXT_MONTH', 'NEXT_FISCAL_YEAR']);

// === Schema de suscripcion ===

export const feeSubscriptionSchema = z.object({
  id: z.string().uuid(),
  feePlanId: z.string().uuid(),
  feePlanName: z.string(),
  feePlanCode: z.string(),
  feePlanType: z.enum(['ONE_TIME', 'RECURRING']),
  baseAmount: z.number().min(0),
  typeDiscount: z.number().min(0).max(1).nullable(),
  personalDiscount: z.number().min(0).max(1).nullable(),
  personalDiscountReason: z.string().nullable(),
  effectiveAmount: z.number().min(0),
  registrationDate: z.string().datetime(),
  leaveDate: z.string().datetime().nullable(),
  cancelReason: cancelReasonSchema.nullable(),
  chargesGenerated: z.number().int().min(0),
  totalCollected: z.number().min(0),
  // Campo opcional: cantidad de cargos pendientes de la suscripcion (REQ-SPU-001)
  pendingChargesCount: z.number().int().min(0).optional(),
});

// === Schema respuesta suscripciones de un socio ===

export const memberSubscriptionsResponseSchema = z.object({
  memberId: z.string().uuid(),
  memberName: z.string(),
  memberTypeId: z.string().uuid(),
  memberTypeName: z.string(),
  activeSubscription: feeSubscriptionSchema.nullable(),
  closedSubscriptions: z.array(feeSubscriptionSchema),
});

// === Schemas de input ===

export const createSubscriptionInputSchema = z.object({
  feePlanId: z.string().uuid(),
  personalDiscount: z.number().min(0).max(0.99).nullable(),
  personalDiscountReason: z.string().min(3).max(500).nullable(),
});

export const changePlanInputSchema = z.object({
  newFeePlanId: z.string().uuid(),
  effectiveDate: z.string().datetime(),
  effectiveDateType: effectiveDateTypeSchema,
  keepPendingCharges: z.boolean(),
});

export const updateDiscountInputSchema = z.object({
  personalDiscount: z.number().min(0).max(0.99),
  reason: z.string().min(3).max(500),
  approvedBy: z.string().min(3).max(200),
});

// === Tipos inferidos ===

export type CancelReason = z.infer<typeof cancelReasonSchema>;
export type EffectiveDateType = z.infer<typeof effectiveDateTypeSchema>;
export type FeeSubscription = z.infer<typeof feeSubscriptionSchema>;
export type MemberSubscriptionsResponse = z.infer<typeof memberSubscriptionsResponseSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;
export type ChangePlanInput = z.infer<typeof changePlanInputSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountInputSchema>;
