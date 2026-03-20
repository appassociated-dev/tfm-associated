import { httpClient } from '@/shared/api/http-client';
import {
  feeSubscriptionSchema,
  memberSubscriptionsResponseSchema,
  type FeeSubscription,
  type MemberSubscriptionsResponse,
  type CreateSubscriptionInput,
  type ChangePlanInput,
  type UpdateDiscountInput,
  type CancelReason,
} from '../schemas/subscription.schemas';

const BASE = '/v1/treasury/member-accounts';

/** Obtiene suscripciones (activa + historicas) de un socio. */
export async function getSubscriptions(
  memberAccountId: string,
): Promise<MemberSubscriptionsResponse> {
  const { data } = await httpClient.get(`${BASE}/${memberAccountId}/subscriptions`);
  return memberSubscriptionsResponseSchema.parse(data.data ?? data);
}

/** Crea nueva suscripcion para un socio. */
export async function createSubscription(
  memberAccountId: string,
  input: CreateSubscriptionInput,
): Promise<FeeSubscription> {
  const { data } = await httpClient.post(`${BASE}/${memberAccountId}/subscriptions`, input);
  return feeSubscriptionSchema.parse(data.data ?? data);
}

/** Cambia el plan de una suscripcion activa. */
export async function changePlan(
  memberAccountId: string,
  subscriptionId: string,
  input: ChangePlanInput,
): Promise<FeeSubscription> {
  const { data } = await httpClient.post(
    `${BASE}/${memberAccountId}/subscriptions/${subscriptionId}/change-plan`,
    input,
  );
  return feeSubscriptionSchema.parse(data.data ?? data);
}

/** Modifica el descuento personalizado de una suscripcion activa. */
export async function updateDiscount(
  memberAccountId: string,
  subscriptionId: string,
  input: UpdateDiscountInput,
): Promise<FeeSubscription> {
  const { data } = await httpClient.put(
    `${BASE}/${memberAccountId}/subscriptions/${subscriptionId}`,
    input,
  );
  return feeSubscriptionSchema.parse(data.data ?? data);
}

/** Cierra una suscripcion con motivo. */
export async function closeSubscription(
  memberAccountId: string,
  subscriptionId: string,
  reason: CancelReason,
): Promise<void> {
  await httpClient.patch(`${BASE}/${memberAccountId}/subscriptions/${subscriptionId}/close`, {
    reason,
  });
}
