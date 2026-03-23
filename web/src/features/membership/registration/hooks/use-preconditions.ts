import { useQuery } from '@tanstack/react-query';

import { validatePreconditions } from '../api/registration.api';

/** Consulta las precondiciones del alta simple (FE-4, FE-5). */
export function usePreconditions() {
  return useQuery({
    queryKey: ['registration-preconditions'],
    queryFn: validatePreconditions,
    staleTime: 30 * 1000, // 30 segundos de cache
  });
}
