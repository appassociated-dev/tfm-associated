import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
import { activateFeePlan } from '../api/fee-plan.api';
import { handleMutationError } from '@/shared/utils/handle-mutation-error';

/** Hook para activar un plan de cuota inactivo. */
export function useActivateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateFeePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      notifications.show({
        title: i18n.t('treasury:feePlans.notifications.activateSuccess.title'),
        message: i18n.t('treasury:feePlans.notifications.activateSuccess.message'),
        color: 'green',
        autoClose: 4000,
      });
    },
    onError: (error: unknown) => {
      // 422 indica transicion de estado invalida (ej: plan ya activo)
      handleMutationError(error, {
        422: () => {
          notifications.show({
            title: i18n.t('treasury:feePlans.notifications.activateError.title'),
            message: i18n.t('treasury:feePlans.notifications.activateError.message'),
            color: 'red',
          });
        },
      });
    },
  });
}
