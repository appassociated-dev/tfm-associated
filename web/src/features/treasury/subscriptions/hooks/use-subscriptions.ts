import { useQuery } from '@tanstack/react-query';

import { getSubscriptions } from '../api/subscription.api';

/** Hook para obtener suscripciones (activa + historicas) de un socio. */
export function useSubscriptions(memberAccountId: string) {
  return useQuery({
    queryKey: ['subscriptions', memberAccountId],
    queryFn: () => getSubscriptions(memberAccountId),
    enabled: !!memberAccountId,
  });
}
