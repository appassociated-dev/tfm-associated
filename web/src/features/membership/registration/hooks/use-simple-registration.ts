import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

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
        title: 'Socio dado de alta',
        message: `Socio registrado correctamente. Número asignado: ${data.memberNumber}`,
        color: 'green',
      });
    },
    onError: (error: unknown) => {
      const status = error instanceof ApiError ? error.status : undefined;
      const detail = error instanceof ApiError ? error.message : undefined;

      if (status === 409) {
        notifications.show({
          title: 'DNI duplicado',
          message: 'Ya existe un socio con ese DNI. Es una reactivacion?',
          color: 'red',
        });
      } else if (status === 422) {
        notifications.show({
          title: 'Error de validacion',
          message: detail || 'Datos invalidos. Revise el formulario.',
          color: 'red',
        });
      }
    },
  });
}
