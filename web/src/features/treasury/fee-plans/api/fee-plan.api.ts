import { z } from 'zod';
import { httpClient } from '@/shared/api/http-client';
import {
  feePlanSchema,
  feePlanDetailSchema,
  memberTypeOptionSchema,
  feePlanTemplateSchema,
  type FeePlan,
  type FeePlanDetail,
  type CreateFeePlanInput,
  type UpdateFeePlanInput,
  type LinkMemberTypeInput,
  type MemberTypeOption,
  type FeePlanTemplate,
} from '../schemas/fee-plan.schemas';

const FEE_PLANS_BASE = '/v1/fee-plans';
const MEMBER_TYPES_BASE = '/v1/member-types';

/** Obtiene listado de planes, opcionalmente filtrado por estado. */
export async function getFeePlans(params?: { active?: boolean }): Promise<FeePlan[]> {
  const { data } = await httpClient.get(FEE_PLANS_BASE, { params });
  const payload = data.data ?? data;
  return z.array(feePlanSchema).parse(payload);
}

/** Obtiene detalle de un plan con vinculaciones a tipos de socio. */
export async function getFeePlan(id: string): Promise<FeePlanDetail> {
  const { data } = await httpClient.get(`${FEE_PLANS_BASE}/${id}`);
  return feePlanDetailSchema.parse(data.data ?? data);
}

/** Crea un nuevo plan de cuota. */
export async function createFeePlan(input: CreateFeePlanInput): Promise<FeePlan> {
  const { data } = await httpClient.post(FEE_PLANS_BASE, input);
  return feePlanSchema.parse(data.data ?? data);
}

/** Actualiza un plan de cuota existente. */
export async function updateFeePlan(id: string, input: UpdateFeePlanInput): Promise<FeePlan> {
  const { data } = await httpClient.put(`${FEE_PLANS_BASE}/${id}`, input);
  return feePlanSchema.parse(data.data ?? data);
}

/** Inactiva un plan de cuota. */
export async function deactivateFeePlan(id: string): Promise<void> {
  await httpClient.patch(`${FEE_PLANS_BASE}/${id}/deactivate`);
}

/** Vincula tipos de socio a un plan. */
export async function linkMemberTypes(planId: string, links: LinkMemberTypeInput[]): Promise<void> {
  await httpClient.post(`${FEE_PLANS_BASE}/${planId}/link-member-types`, { links });
}

/** Obtiene tipos de socio activos (para selector de vinculacion). */
export async function getMemberTypes(): Promise<MemberTypeOption[]> {
  const { data } = await httpClient.get(MEMBER_TYPES_BASE);
  const payload = data.data ?? data;
  return z.array(memberTypeOptionSchema).parse(payload);
}

/** Obtiene plantillas predefinidas para un tipo de colectividad. */
export async function getTemplates(collectivityType: string): Promise<FeePlanTemplate> {
  const { data } = await httpClient.get(`${FEE_PLANS_BASE}/templates`, {
    params: { collectivityType },
  });
  return feePlanTemplateSchema.parse(data.data ?? data);
}

/** Importa plantillas predefinidas para un tipo de colectividad. */
export async function importTemplate(collectivityType: string): Promise<FeePlan[]> {
  const { data } = await httpClient.post(`${FEE_PLANS_BASE}/templates/import`, {
    collectivityType,
  });
  const payload = data.data ?? data;
  return z.array(feePlanSchema).parse(payload);
}
