import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { processVoluntaryLeave } from '../api/member-leave.api';
import { ApiError } from '@/shared/api/api-error';
import type { VoluntaryLeaveRequest } from '../schemas/member-leave.schemas';
import i18n from '@/i18n/i18n';

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
        title: i18n.t('membership:leave.notifications.voluntaryLeave.successTitle'),
        message: i18n.t('membership:leave.notifications.voluntaryLeave.successText'),
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;

      if (status === 422) {
        notifications.show({
          title: i18n.t('membership:leave.notifications.voluntaryLeave.stateErrorTitle'),
          message: i18n.t('membership:leave.notifications.voluntaryLeave.stateErrorText'),
          color: 'red',
        });
      }
    },
  });
}
