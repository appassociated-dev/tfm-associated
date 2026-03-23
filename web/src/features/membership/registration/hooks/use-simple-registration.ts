import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import i18n from '@/i18n/i18n';
import { simpleRegistration } from '../api/registration.api';
import { ApiError } from '@/shared/api/api-error';
import type { SimpleRegistrationRequest } from '../schemas/member-registration.schemas';

/** Mutation para alta simple de socio (UC-011). */
export function useSimpleRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SimpleRegistrationRequest) => simpleRegistration(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      notifications.show({
        title: i18n.t('membership:registration.notifications.successTitle'),
        message: i18n.t('membership:registration.notifications.successMessage', {
          memberNumber: data.memberNumber,
        }),
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;
      const detail = error instanceof ApiError ? error.message : undefined;

      if (status === 409) {
        notifications.show({
          title: i18n.t('membership:registration.notifications.dniDuplicateTitle'),
          message: i18n.t('membership:registration.notifications.dniDuplicateMessage'),
          color: 'red',
        });
      } else if (status === 422) {
        notifications.show({
          title: i18n.t('membership:registration.notifications.validationErrorTitle'),
          message:
            detail || i18n.t('membership:registration.notifications.validationErrorFallback'),
          color: 'red',
        });
      }
    },
  });
}
