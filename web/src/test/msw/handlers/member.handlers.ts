// Handlers MSW para endpoints de membership (/v1/members/*).
// Coinciden con member-leave.api.ts y registration.api.ts.

import { http, HttpResponse } from 'msw';
import {
  buildLeaveSummary,
  buildReinstatementSummary,
  buildMemberType,
  buildRegistrationResponse,
} from '../../factories';
import { apiResponse } from '../utils';
import type {
  LeaveSummary,
  ReinstatementSummary,
} from '@/features/membership/leave/schemas/member-leave.schemas';
import type {
  MemberType,
  RegistrationResponse,
  PreconditionsResponse,
} from '@/features/membership/registration/schemas/member-registration.schemas';

// === Configuración de handlers ===

export interface MemberHandlerConfig {
  leaveSummary?: LeaveSummary;
  reinstatementSummary?: ReinstatementSummary;
  memberTypes?: MemberType[];
  registrationResponse?: RegistrationResponse;
  preconditions?: PreconditionsResponse;
}

/**
 * Crea handlers MSW para endpoints de membership.
 */
export function createMemberHandlers(config: MemberHandlerConfig = {}) {
  return [
    // GET /api/v1/members/:memberId/leave-summary
    http.get('*/v1/members/:memberId/leave-summary', () => {
      const data = config.leaveSummary ?? buildLeaveSummary();
      return HttpResponse.json(apiResponse(data));
    }),

    // POST /api/v1/members/:memberId/voluntary-leave
    http.post('*/v1/members/:memberId/voluntary-leave', () => {
      return HttpResponse.json(
        apiResponse({
          memberId: 'f47ac10b-58cc-4372-a567-000000000e01',
          previousStatus: 'ACTIVE',
          newStatus: 'VOLUNTARY_LEAVE',
          effectiveDate: '2026-03-22T00:00:00.000Z',
          subscriptionsClosed: 1,
          pendingChargesAmount: 0,
        }),
      );
    }),

    // POST /api/v1/members/:memberId/nonpayment-leave
    http.post('*/v1/members/:memberId/nonpayment-leave', () => {
      return HttpResponse.json(
        apiResponse({
          memberId: 'f47ac10b-58cc-4372-a567-000000000e01',
          previousStatus: 'ACTIVE',
          newStatus: 'NONPAYMENT_LEAVE',
          effectiveDate: '2026-03-22T00:00:00.000Z',
          subscriptionsClosed: 1,
          pendingChargesAmount: 0,
        }),
      );
    }),

    // GET /api/v1/members/:memberId/reinstatement-summary
    http.get('*/v1/members/:memberId/reinstatement-summary', () => {
      const data = config.reinstatementSummary ?? buildReinstatementSummary();
      return HttpResponse.json(apiResponse(data));
    }),

    // POST /api/v1/members/:memberId/reinstate
    http.post('*/v1/members/:memberId/reinstate', () => {
      return HttpResponse.json(
        apiResponse({
          memberId: 'f47ac10b-58cc-4372-a567-000000000e01',
          newStatus: 'ACTIVE',
          debtPaid: 7500,
          seniorityRecovered: true,
          registrationDate: '2026-03-22T00:00:00.000Z',
        }),
      );
    }),

    // GET /api/v1/members/:memberId/status-history
    http.get('*/v1/members/:memberId/status-history', () => {
      return HttpResponse.json(
        apiResponse({
          memberId: 'f47ac10b-58cc-4372-a567-000000000e01',
          currentStatus: 'ACTIVE',
          entries: [],
        }),
      );
    }),

    // GET /api/v1/members/:memberId/available-transitions
    http.get('*/v1/members/:memberId/available-transitions', () => {
      return HttpResponse.json(
        apiResponse({
          memberId: 'f47ac10b-58cc-4372-a567-000000000e01',
          currentStatus: 'ACTIVE',
          availableTransitions: [{ status: 'VOLUNTARY_LEAVE', description: 'Baja voluntaria' }],
        }),
      );
    }),

    // GET /api/v1/members/preconditions
    http.get('*/v1/members/preconditions', () => {
      const data = config.preconditions ?? {
        hasFiscalYear: true,
        hasMemberTypes: true,
        hasRegistrationPlan: true,
        registrationPlan: {
          feePlanId: 'f47ac10b-58cc-4372-a567-000000000001',
          name: 'Cuota de Alta',
          amount: 5000,
        },
        errors: [],
      };
      return HttpResponse.json(apiResponse(data));
    }),

    // GET /api/v1/member-types
    http.get('*/v1/member-types', () => {
      const data = config.memberTypes ?? [buildMemberType(), buildMemberType()];
      return HttpResponse.json(apiResponse(data));
    }),

    // GET /api/v1/members/check-dni/:docType/:dni
    http.get('*/v1/members/check-dni/:docType/:dni', () => {
      return HttpResponse.json(apiResponse({ exists: false }));
    }),

    // GET /api/v1/members/check-email/:email
    http.get('*/v1/members/check-email/:email', () => {
      return HttpResponse.json(apiResponse({ exists: false }));
    }),

    // POST /api/v1/members/simple-registration
    http.post('*/v1/members/simple-registration', () => {
      const data = config.registrationResponse ?? buildRegistrationResponse();
      return HttpResponse.json(apiResponse(data), { status: 201 });
    }),
  ];
}
