import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { createFeePlan } from '../api/fee-plan.api';
import type { CreateFeePlanInput } from '../schemas/fee-plan.schemas';

/** Hook para crear un nuevo plan de cuota. */
export function useCreateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFeePlanInput) => createFeePlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      notifications.show({
        title: 'Plan creado',
        message: 'El plan de cuota se ha creado correctamente',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        notifications.show({
          title: 'Codigo duplicado',
          message: 'Ya existe un plan con ese codigo. Pruebe con otro.',
          color: 'red',
        });
      }
    },
  });
}
