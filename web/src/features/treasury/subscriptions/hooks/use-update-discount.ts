import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
import { updateDiscount } from '../api/subscription.api';
import { ApiError } from '@/shared/api/api-error';
import type { UpdateDiscountInput } from '../schemas/subscription.schemas';

/** Hook para modificar el descuento personalizado de una suscripcion. */
export function useUpdateDiscount(memberAccountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      input,
    }: {
      subscriptionId: string;
      input: UpdateDiscountInput;
    }) => updateDiscount(memberAccountId, subscriptionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subscriptions', memberAccountId],
      });
      notifications.show({
        title: i18n.t('treasury:subscriptions.notifications.discountSuccess.title'),
        message: i18n.t('treasury:subscriptions.notifications.discountSuccess.message'),
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;
      if (status === 409) {
        notifications.show({
          title: i18n.t('treasury:subscriptions.notifications.discountError.title'),
          message: i18n.t('treasury:subscriptions.notifications.discountError.message'),
          color: 'red',
        });
      }
    },
  });
}
