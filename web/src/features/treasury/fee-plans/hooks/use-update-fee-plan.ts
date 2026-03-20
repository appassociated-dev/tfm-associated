import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { updateFeePlan } from '../api/fee-plan.api';
import type { UpdateFeePlanInput } from '../schemas/fee-plan.schemas';

/** Hook para actualizar un plan de cuota existente. */
export function useUpdateFeePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFeePlanInput }) =>
      updateFeePlan(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
      queryClient.invalidateQueries({ queryKey: ['fee-plans', variables.id] });
      notifications.show({
        title: 'Plan actualizado',
        message: 'El plan de cuota se ha actualizado correctamente',
        color: 'green',
        autoClose: 4000,
      });
    },
  });
}
