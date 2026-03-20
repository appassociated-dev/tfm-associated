import { httpClient } from '@/shared/api/http-client';
import {
  leaveSummarySchema,
  leaveResponseSchema,
  reinstatementSummarySchema,
  reinstatementResponseSchema,
  statusHistorySchema,
  availableTransitionsSchema,
  type LeaveSummary,
  type VoluntaryLeaveRequest,
  type LeaveResponse,
  type ReinstatementRequest,
  type ReinstatementSummary,
  type ReinstatementResponse,
  type StatusHistory,
  type AvailableTransitions,
} from '../schemas/member-leave.schemas';

/** Obtiene resumen de baja: suscripciones activas, cargos pendientes, opciones de fecha efectiva. */
export async function getLeaveSummary(memberId: string): Promise<LeaveSummary> {
  const { data } = await httpClient.get(`/v1/members/${memberId}/leave-summary`);
  return leaveSummarySchema.parse(data.data ?? data);
}

/** Ejecuta baja voluntaria con fecha efectiva y motivo. */
export async function processVoluntaryLeave(
  memberId: string,
  input: VoluntaryLeaveRequest,
): Promise<LeaveResponse> {
  const { data } = await httpClient.post(`/v1/members/${memberId}/voluntary-leave`, input);
  return leaveResponseSchema.parse(data.data ?? data);
}

/** Ejecuta baja por impago (sin datos adicionales, el backend valida el workflow). */
export async function processNonpaymentLeave(memberId: string): Promise<LeaveResponse> {
  const { data } = await httpClient.post(`/v1/members/${memberId}/nonpayment-leave`);
  return leaveResponseSchema.parse(data.data ?? data);
}

/** Obtiene resumen de rehabilitacion: desglose de costes, antiguedad, importe total. */
export async function getReinstatementSummary(memberId: string): Promise<ReinstatementSummary> {
  const { data } = await httpClient.get(`/v1/members/${memberId}/reinstatement-summary`);
  return reinstatementSummarySchema.parse(data.data ?? data);
}

/** Ejecuta rehabilitacion de ex-socio tras confirmacion de pago. */
export async function reinstateMember(
  memberId: string,
  input: ReinstatementRequest,
): Promise<ReinstatementResponse> {
  const { data } = await httpClient.post(`/v1/members/${memberId}/reinstate`, input);
  return reinstatementResponseSchema.parse(data.data ?? data);
}

/** Obtiene historial completo de estados del socio. */
export async function getStatusHistory(memberId: string): Promise<StatusHistory> {
  const { data } = await httpClient.get(`/v1/members/${memberId}/status-history`);
  return statusHistorySchema.parse(data.data ?? data);
}

/** Obtiene transiciones de estado disponibles desde el estado actual. */
export async function getAvailableTransitions(memberId: string): Promise<AvailableTransitions> {
  const { data } = await httpClient.get(`/v1/members/${memberId}/available-transitions`);
  return availableTransitionsSchema.parse(data.data ?? data);
}
