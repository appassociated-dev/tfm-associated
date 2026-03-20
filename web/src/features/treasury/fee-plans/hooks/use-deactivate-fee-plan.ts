import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { deactivateFeePlan } from '../api/fee-plan.api';

/** Hook para inactivar un plan de cuota. */
export function useDeactivateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateFeePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      notifications.show({
        title: 'Plan inactivado',
        message: 'El plan de cuota se ha inactivado correctamente',
        color: 'green',
        autoClose: 4000,
      });
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        notifications.show({
          title: 'No se puede inactivar',
          message: 'No se puede inactivar: el plan tiene suscripciones activas',
          color: 'red',
          autoClose: 4000,
        });
      }
    },
  });
}
