import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { activateFeePlan } from '../api/fee-plan.api';

/** Hook para activar un plan de cuota inactivo. */
export function useActivateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateFeePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      notifications.show({
        title: 'Plan activado',
        message: 'El plan de cuota se ha activado correctamente',
        color: 'green',
        autoClose: 4000,
      });
    },
  });
}
