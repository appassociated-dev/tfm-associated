// Handlers MSW para endpoints de treasury/fee-plans (/v1/treasury/fee-plans/*).
// Coinciden con fee-plan.api.ts.

import { http, HttpResponse } from 'msw';
import { buildFeePlan, buildFeePlanDetail } from '../../factories';
import { apiResponse } from '../utils';
import type {
  FeePlan,
  FeePlanDetail,
  MemberTypeOption,
} from '@/features/treasury/fee-plans/schemas/fee-plan.schemas';

// === Configuración de handlers ===

export interface FeePlanHandlerConfig {
  feePlans?: FeePlan[];
  feePlanDetail?: FeePlanDetail;
  memberTypeOptions?: MemberTypeOption[];
}

/**
 * Crea handlers MSW para endpoints de fee-plans.
 */
export function createFeePlanHandlers(config: FeePlanHandlerConfig = {}) {
  return [
    // GET /api/v1/treasury/fee-plans
    http.get('*/v1/treasury/fee-plans', ({ request }) => {
      const url = new URL(request.url);
      // Si piden templates, devolver handler separado
      if (url.pathname.endsWith('/templates')) return;

      const data = config.feePlans ?? [buildFeePlan(), buildFeePlan()];
      return HttpResponse.json(apiResponse(data));
    }),

    // GET /api/v1/treasury/fee-plans/templates
    http.get('*/v1/treasury/fee-plans/templates', () => {
      return HttpResponse.json(
        apiResponse({
          collectivityType: 'SPORTS_CLUB',
          templates: [
            {
              code: 'CUOTA-ANUAL',
              name: 'Cuota Anual',
              type: 'RECURRING' as const,
              amount: 12000,
              frequency: 'ANNUAL' as const,
              billingMonths: [1],
            },
          ],
        }),
      );
    }),

    // GET /api/v1/treasury/fee-plans/:id
    http.get('*/v1/treasury/fee-plans/:id', () => {
      const data = config.feePlanDetail ?? buildFeePlanDetail();
      return HttpResponse.json(apiResponse(data));
    }),

    // POST /api/v1/treasury/fee-plans
    http.post('*/v1/treasury/fee-plans', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const created = buildFeePlan({
        code: (body.code as string) ?? 'NEW-PLAN',
        name: (body.name as string) ?? 'Nuevo Plan',
        amount: (body.amount as number) ?? 10000,
      });
      return HttpResponse.json(apiResponse(created), { status: 201 });
    }),

    // PUT /api/v1/treasury/fee-plans/:id
    http.put('*/v1/treasury/fee-plans/:id', async ({ params, request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      const updated = buildFeePlan({
        id: params.id as string,
        name: (body.name as string) ?? 'Plan Actualizado',
      });
      return HttpResponse.json(apiResponse(updated));
    }),

    // PATCH /api/v1/treasury/fee-plans/:id/deactivate
    http.patch('*/v1/treasury/fee-plans/:id/deactivate', () => {
      return new HttpResponse(null, { status: 204 });
    }),

    // PATCH /api/v1/treasury/fee-plans/:id/activate
    http.patch('*/v1/treasury/fee-plans/:id/activate', () => {
      return new HttpResponse(null, { status: 204 });
    }),

    // POST /api/v1/treasury/fee-plans/:id/link-member-types
    http.post('*/v1/treasury/fee-plans/:planId/link-member-types', () => {
      return new HttpResponse(null, { status: 204 });
    }),

    // POST /api/v1/treasury/fee-plans/import-template
    http.post('*/v1/treasury/fee-plans/import-template', () => {
      return HttpResponse.json(apiResponse([buildFeePlan(), buildFeePlan()]));
    }),
  ];
}
