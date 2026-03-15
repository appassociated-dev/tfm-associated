import { z } from 'zod';

// === Enums de baja de socio ===

/** Tipos de baja disponibles. */
export const leaveTypeSchema = z.enum([
  'VOLUNTARY_LEAVE',
  'NONPAYMENT_LEAVE',
  'DISCIPLINARY_LEAVE',
]);

/** Configuraciones de fecha efectiva segun estatutos del tenant. */
export const effectiveDateConfigSchema = z.enum([
  'IMMEDIATE',
  'END_OF_FISCAL_YEAR',
  'END_OF_NEXT_MONTH',
  'NOTICE_PERIOD',
]);

// === Schema de resumen de baja ===

/** Resumen previo a ejecutar la baja: suscripciones activas, cargos pendientes, opciones de fecha. */
export const leaveSummarySchema = z.object({
  memberId: z.string().uuid(),
  memberName: z.string(),
  memberNumber: z.string(),
  currentStatus: z.string(),
  availableLeaveTypes: z.array(leaveTypeSchema),
  effectiveDateOptions: z.array(
    z.object({
      type: effectiveDateConfigSchema,
      effectiveDate: z.string().datetime(),
      label: z.string(),
      description: z.string(),
    }),
  ),
  activeSubscriptions: z.array(
    z.object({
      id: z.string().uuid(),
      planName: z.string(),
      effectiveAmount: z.number(),
      periodicity: z.string(),
    }),
  ),
  pendingCharges: z.array(
    z.object({
      id: z.string().uuid(),
      description: z.string(),
      amount: z.number(),
      dueDate: z.string().datetime(),
    }),
  ),
  totalPendingDebt: z.number(),
});

// === Schema de peticion de baja voluntaria ===

/** Datos requeridos para procesar baja voluntaria. */
export const voluntaryLeaveRequestSchema = z.object({
  effectiveDateType: effectiveDateConfigSchema,
  reason: z.string().min(3, 'Motivo es obligatorio (mínimo 3 caracteres)').max(500),
});

// === Schema de respuesta de baja ===

/** Respuesta del backend tras ejecutar baja voluntaria o por impago. */
export const leaveResponseSchema = z.object({
  memberId: z.string().uuid(),
  previousStatus: z.string(),
  newStatus: z.string(),
  effectiveDate: z.string().datetime(),
  subscriptionsClosed: z.number(),
  pendingChargesAmount: z.number(),
});

// === Schemas de rehabilitacion ===

/** Resumen previo a rehabilitacion: desglose de costes y antiguedad. */
export const reinstatementSummarySchema = z.object({
  memberId: z.string().uuid(),
  memberName: z.string(),
  memberNumber: z.string(),
  leaveDate: z.string().datetime(),
  leaveType: leaveTypeSchema,
  pendingDebt: z.number(),
  penalty: z.number(),
  newRegistrationFee: z.number(),
  totalToPay: z.number(),
  keepSeniority: z.boolean(),
  previousSeniorityMonths: z.number(),
});

/** Peticion de rehabilitacion: requiere confirmacion de pago. */
export const reinstatementRequestSchema = z.object({
  paymentConfirmed: z.boolean().refine((val) => val === true, 'Debe confirmar el pago'),
});

/** Respuesta tras rehabilitacion exitosa. */
export const reinstatementResponseSchema = z.object({
  memberId: z.string().uuid(),
  newStatus: z.string(),
  debtPaid: z.number(),
  seniorityRecovered: z.boolean(),
  registrationDate: z.string().datetime(),
});

// === Schemas de historial de estados ===

/** Entrada individual del historial de estados del socio. */
export const statusHistoryEntrySchema = z.object({
  id: z.string().uuid(),
  previousStatus: z.string(),
  newStatus: z.string(),
  reason: z.string(),
  changedBy: z.string(),
  changedAt: z.string().datetime(),
});

/** Historial completo de estados del socio. */
export const statusHistorySchema = z.object({
  memberId: z.string().uuid(),
  currentStatus: z.string(),
  entries: z.array(statusHistoryEntrySchema),
});

// === Schema de transiciones disponibles ===

/** Transiciones de estado permitidas desde el estado actual del socio. */
export const availableTransitionsSchema = z.object({
  memberId: z.string().uuid(),
  currentStatus: z.string(),
  availableTransitions: z.array(
    z.object({
      status: z.string(),
      description: z.string(),
    }),
  ),
});

// === Tipos inferidos ===

export type LeaveType = z.infer<typeof leaveTypeSchema>;
export type EffectiveDateConfig = z.infer<typeof effectiveDateConfigSchema>;
export type LeaveSummary = z.infer<typeof leaveSummarySchema>;
export type VoluntaryLeaveRequest = z.infer<typeof voluntaryLeaveRequestSchema>;
export type LeaveResponse = z.infer<typeof leaveResponseSchema>;
export type ReinstatementSummary = z.infer<typeof reinstatementSummarySchema>;
export type ReinstatementRequest = z.infer<typeof reinstatementRequestSchema>;
export type ReinstatementResponse = z.infer<typeof reinstatementResponseSchema>;
export type StatusHistoryEntry = z.infer<typeof statusHistoryEntrySchema>;
export type StatusHistory = z.infer<typeof statusHistorySchema>;
export type AvailableTransitions = z.infer<typeof availableTransitionsSchema>;
