import { useQuery } from '@tanstack/react-query';
import { useDebouncedValue } from '@mantine/hooks';

import { checkEmail } from '../api/registration.api';

/** Verifica unicidad de email con debounce de 500ms. */
export function useCheckEmail(email: string) {
  const [debouncedEmail] = useDebouncedValue(email.trim().toLowerCase(), 500);

  // Solo consultar si tiene formato valido de email
  const isValidEmail = !!debouncedEmail && /^\S+@\S+\.\S+$/.test(debouncedEmail);

  return useQuery({
    queryKey: ['check-email', debouncedEmail],
    queryFn: () => checkEmail(debouncedEmail),
    enabled: isValidEmail,
  });
}
