// Handlers MSW para endpoints de treasury/subscriptions (/v1/treasury/member-accounts/*).
// Coinciden con subscription.api.ts.

import { http, HttpResponse } from 'msw';
import { buildMemberSubscriptionsResponse } from '../../factories';
import { apiResponse } from '../utils';
import type { MemberSubscriptionsResponse } from '@/features/treasury/subscriptions/schemas/subscription.schemas';

// === Configuracion de handlers ===

export interface SubscriptionHandlerConfig {
  subscriptionsData?: MemberSubscriptionsResponse;
}

/**
 * Crea handlers MSW para endpoints de subscriptions.
 */
export function createSubscriptionHandlers(config: SubscriptionHandlerConfig = {}) {
  return [
    // GET /api/v1/treasury/member-accounts/:memberId/subscriptions
    http.get('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
      const data = config.subscriptionsData ?? buildMemberSubscriptionsResponse();
      return HttpResponse.json(apiResponse(data));
    }),

    // POST /api/v1/treasury/member-accounts/:memberId/subscriptions
    http.post('*/v1/treasury/member-accounts/:memberId/subscriptions', () => {
      return HttpResponse.json(apiResponse({ id: 'sub-new-001' }), { status: 201 });
    }),

    // PATCH /api/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/change-plan
    http.patch(
      '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/change-plan',
      () => {
        return new HttpResponse(null, { status: 204 });
      },
    ),

    // PATCH /api/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/discount
    http.patch(
      '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/discount',
      () => {
        return new HttpResponse(null, { status: 204 });
      },
    ),

    // PATCH /api/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/close
    http.patch(
      '*/v1/treasury/member-accounts/:memberId/subscriptions/:subscriptionId/close',
      () => {
        return new HttpResponse(null, { status: 204 });
      },
    ),
  ];
}
