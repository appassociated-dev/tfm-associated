import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './auth.provider';

/**
 * Hook para acceder al estado y acciones de autenticación.
 * Debe usarse dentro de un AuthProvider.
 *
 * @throws Error si se usa fuera del AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
}
