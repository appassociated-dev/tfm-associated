import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { processNonpaymentLeave } from '../api/member-leave.api';
import { ApiError } from '@/shared/api/api-error';
import type { LeaveResponse } from '../schemas/member-leave.schemas';
import { formatDateCompact } from '@/shared/utils/format-date';
import i18n from '@/i18n/i18n';

/** Mutation para procesar baja por impago de socio (UC-013). */
export function useNonpaymentLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => processNonpaymentLeave(memberId),
    onSuccess: (data: LeaveResponse) => {
      // Invalida lista de socios (el estado cambio) y resumen de baja (ya no aplica)
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['leave-summary'] });
      // Formatea la fecha en formato compacto español (dd/MM/yyyy)
      const effectiveDateFormatted = formatDateCompact(new Date(data.effectiveDate));
      notifications.show({
        title: i18n.t('membership:leave.nonpayment.notifications.successTitle'),
        message: i18n.t('membership:leave.nonpayment.notifications.successText', {
          effectiveDate: effectiveDateFormatted,
          subscriptionsClosed: data.subscriptionsClosed,
        }),
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;

      // 422 indica que el socio no cumple los requisitos para la baja por impago
      if (status === 422) {
        notifications.show({
          title: i18n.t('membership:leave.nonpayment.notifications.stateErrorTitle'),
          message: i18n.t('membership:leave.nonpayment.notifications.stateErrorText'),
          color: 'red',
        });
      } else {
        // Error generico inesperado: red, servidor caido, timeout, etc.
        notifications.show({
          title: i18n.t('common:errors.somethingWentWrong'),
          message: i18n.t('common:errors.unexpected'),
          color: 'red',
        });
      }
    },
  });
}
