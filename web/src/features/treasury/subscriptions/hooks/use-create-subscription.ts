import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
import { createSubscription } from '../api/subscription.api';
import { ApiError } from '@/shared/api/api-error';
import type { CreateSubscriptionInput } from '../schemas/subscription.schemas';

/** Hook para crear una nueva suscripcion para un socio. */
export function useCreateSubscription(memberAccountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) => createSubscription(memberAccountId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscriptions', memberAccountId],
      });
      notifications.show({
        title: i18n.t('treasury:subscriptions.notifications.createSuccess.title'),
        message: i18n.t('treasury:subscriptions.notifications.createSuccess.message'),
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;
      if (status === 409) {
        notifications.show({
          title: i18n.t('treasury:subscriptions.notifications.createDuplicate.title'),
          message: i18n.t('treasury:subscriptions.notifications.createDuplicate.message'),
          color: 'red',
        });
      }
    },
  });
}
