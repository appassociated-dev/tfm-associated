// Barrel de factories de datos de test.
// Importar desde '@/test/factories'.

// Auth / Tenant
export {
  buildUser,
  buildTenant,
  buildAuthTokens,
  buildLoginResponse,
  buildTenantSelectorResponse,
  buildUserProfile,
  resetAuthCounters,
} from './auth.factory';

// Membership
export {
  buildMemberType,
  buildLeaveSummary,
  buildReinstatementSummary,
  buildRegistrationResponse,
  resetMemberCounters,
} from './member.factory';

// Treasury — Fee Plans
export {
  buildFeePlan,
  buildFeePlanDetail,
  buildMemberTypeOption,
  resetFeePlanCounters,
} from './fee-plan.factory';

// Treasury — Subscriptions
export {
  buildSubscription,
  buildMemberSubscriptionsResponse,
  resetSubscriptionCounters,
} from './subscription.factory';
