import { useQuery } from '@tanstack/react-query';

import { getStatusHistory } from '../api/member-leave.api';

/** Obtiene historial completo de estados del socio. */
export function useStatusHistory(memberId: string | undefined) {
  return useQuery({
    queryKey: ['status-history', memberId],
    queryFn: () => getStatusHistory(memberId!),
    enabled: !!memberId,
  });
}
