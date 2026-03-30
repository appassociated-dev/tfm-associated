import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
import { deactivateFeePlan } from '../api/fee-plan.api';
import { handleMutationError } from '@/shared/utils/handle-mutation-error';

/** Hook para inactivar un plan de cuota. */
export function useDeactivateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateFeePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      notifications.show({
        title: i18n.t('treasury:feePlans.notifications.deactivateSuccess.title'),
        message: i18n.t('treasury:feePlans.notifications.deactivateSuccess.message'),
        color: 'green',
        autoClose: 4000,
      });
    },
    onError: (error: unknown) => {
      // 422 indica que el plan tiene suscripciones activas y no puede inactivarse
      handleMutationError(error, {
        422: () => {
          notifications.show({
            title: i18n.t('treasury:feePlans.notifications.deactivateError.title'),
            message: i18n.t('treasury:feePlans.notifications.deactivateError.message'),
            color: 'red',
          });
        },
      });
    },
  });
}
