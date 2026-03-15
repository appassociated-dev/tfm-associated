import { useQuery } from '@tanstack/react-query';

import { getAvailableTransitions } from '../api/member-leave.api';

/** Obtiene transiciones de estado disponibles desde el estado actual del socio. */
export function useAvailableTransitions(memberId: string | undefined) {
  return useQuery({
    queryKey: ['available-transitions', memberId],
    queryFn: () => getAvailableTransitions(memberId!),
    enabled: !!memberId,
  });
}
