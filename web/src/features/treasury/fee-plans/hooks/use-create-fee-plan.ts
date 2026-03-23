import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
import { createFeePlan } from '../api/fee-plan.api';
import { ApiError } from '@/shared/api/api-error';
import type { CreateFeePlanInput } from '../schemas/fee-plan.schemas';

/** Hook para crear un nuevo plan de cuota. */
export function useCreateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFeePlanInput) => createFeePlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      notifications.show({
        title: i18n.t('treasury:feePlans.notifications.createSuccess.title'),
        message: i18n.t('treasury:feePlans.notifications.createSuccess.message'),
        color: 'green',
        autoClose: 4000,
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;
      const backendMessage = error instanceof ApiError ? error.message : undefined;
      if (status === 409) {
        notifications.show({
          title: i18n.t('treasury:feePlans.notifications.createErrorDuplicate.title'),
          message: i18n.t('treasury:feePlans.notifications.createErrorDuplicate.message'),
          color: 'red',
          autoClose: 4000,
        });
      } else {
        notifications.show({
          title: i18n.t('treasury:feePlans.notifications.createError.title'),
          message:
            backendMessage ?? i18n.t('treasury:feePlans.notifications.createError.messageFallback'),
          color: 'red',
          autoClose: 4000,
        });
      }
    },
  });
}
