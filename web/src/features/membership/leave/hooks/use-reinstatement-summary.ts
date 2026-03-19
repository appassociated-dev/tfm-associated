import { useQuery } from '@tanstack/react-query';

import { getReinstatementSummary } from '../api/member-leave.api';

/** Obtiene resumen de rehabilitacion: desglose de costes, antiguedad, importe total. */
export function useReinstatementSummary(memberId: string | undefined) {
  return useQuery({
    queryKey: ['reinstatement-summary', memberId],
    queryFn: () => getReinstatementSummary(memberId!),
    enabled: !!memberId,
    retry: false,
  });
}
