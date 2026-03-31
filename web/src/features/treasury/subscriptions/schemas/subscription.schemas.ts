import { z } from 'zod';

// === Enums ===

export const cancelReasonSchema = z.enum([
  'PLAN_CHANGE',
  'MEMBER_LEAVE',
  'EXEMPTION',
  'ONE_TIME_COMPLETED',
]);

export const effectiveDateTypeSchema = z.enum(['IMMEDIATE', 'NEXT_MONTH', 'NEXT_FISCAL_YEAR']);

// === Schema de suscripcion (REQ-ZOD-001) ===
// Alineado con SubscriptionResponseDto del backend.
// Campos eliminados (phantom): feePlanType, baseAmount, chargesGenerated, totalCollected
// Campos añadidos: effectiveAmountFormatted, isActive, createdAt
// Campos opcionales: feePlanName, feePlanCode (@ApiPropertyOptional en DTO)

export const feeSubscriptionSchema = z.object({
  id: z.string().uuid(),
  feePlanId: z.string().uuid(),
  // @ApiPropertyOptional en DTO — puede no estar presente
  feePlanName: z.string().optional(),
  feePlanCode: z.string().optional(),
  // No nullable en DTO (typeDiscount!: number) — siempre presente como número
  typeDiscount: z.number().min(0).max(1),
  // No nullable en DTO (personalDiscount!: number) — siempre presente como número
  personalDiscount: z.number().min(0).max(1),
  personalDiscountReason: z.string().nullable(),
  effectiveAmount: z.number().min(0),
  /** Importe efectivo formateado con moneda (ej: "95.00 EUR"). Siempre presente en DTO. */
  effectiveAmountFormatted: z.string(),
  /** Indica si la suscripcion esta activa. Siempre presente en DTO. */
  isActive: z.boolean(),
  registrationDate: z.string().datetime(),
  leaveDate: z.string().datetime().nullable(),
  // Lenient: backend puede enviar valores nuevos de cancelReason no conocidos por el frontend
  cancelReason: z.string().nullable(),
  /** Fecha de creacion (Date serializado como ISO string). Siempre presente en DTO. */
  createdAt: z.string().datetime(),
  // Campo opcional: cantidad de cargos pendientes de la suscripcion (REQ-SPU-001)
  pendingChargesCount: z.number().int().min(0).optional(),
});

// === Schema respuesta suscripciones de un socio (REQ-ZOD-002) ===
// Alineado con SubscriptionHistoryResponseDto del backend.
// Campos eliminados (phantom): memberName, memberTypeId, memberTypeName, closedSubscriptions
// Campos añadidos: memberAccountId
// Renombrado: closedSubscriptions -> history

export const memberSubscriptionsResponseSchema = z.object({
  /** UUID de la cuenta de socio (memberAccount). */
  memberAccountId: z.string().uuid(),
  // Lenient: schema de respuesta no impone UUID estricto para evitar crash con valores inesperados
  memberId: z.string(),
  activeSubscription: feeSubscriptionSchema.nullable(),
  /** Historial de suscripciones cerradas (antes: closedSubscriptions). */
  history: z.array(feeSubscriptionSchema),
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
