import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
import { changePlan } from '../api/subscription.api';
import { ApiError } from '@/shared/api/api-error';
import type { ChangePlanInput } from '../schemas/subscription.schemas';

/** Hook para cambiar el plan de una suscripcion activa. */
export function useChangePlan(memberAccountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subscriptionId, input }: { subscriptionId: string; input: ChangePlanInput }) =>
      changePlan(memberAccountId, subscriptionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscriptions', memberAccountId],
      });
      notifications.show({
        title: i18n.t('treasury:subscriptions.notifications.changePlanSuccess.title'),
        message: i18n.t('treasury:subscriptions.notifications.changePlanSuccess.message'),
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;
      if (status === 422) {
        notifications.show({
          title: i18n.t('treasury:subscriptions.notifications.changePlanError.title'),
          message: i18n.t('treasury:subscriptions.notifications.changePlanError.message'),
          color: 'red',
        });
      }
    },
  });
}
