import { useQuery } from '@tanstack/react-query';

import { getLeaveSummary } from '../api/member-leave.api';

/** Obtiene resumen previo a la baja: suscripciones activas, cargos pendientes, opciones de fecha. */
export function useLeaveSummary(memberId: string | undefined) {
  return useQuery({
    queryKey: ['leave-summary', memberId],
    queryFn: () => getLeaveSummary(memberId!),
    enabled: !!memberId,
  });
}
