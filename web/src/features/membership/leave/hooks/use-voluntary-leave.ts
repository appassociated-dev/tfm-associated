import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { processVoluntaryLeave } from '../api/member-leave.api';
import type { VoluntaryLeaveRequest } from '../schemas/member-leave.schemas';

/** Mutation para procesar baja voluntaria de socio (UC-013). */
export function useVoluntaryLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: VoluntaryLeaveRequest }) =>
      processVoluntaryLeave(memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['leave-summary'] });
      notifications.show({
        title: 'Baja procesada',
        message: 'Baja voluntaria procesada',
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;

      if (status === 422) {
        notifications.show({
          title: 'Error de estado',
          message: 'No se puede procesar la baja desde el estado actual.',
          color: 'red',
        });
      }
    },
  });
}
