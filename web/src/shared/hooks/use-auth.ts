// Hook de autenticación — gestiona estado de sesión del usuario
import { useState, useCallback } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  permissions: string[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const login = useCallback((user: AuthUser, accessToken: string, tenantId: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('tenant_id', tenantId);
    setState({ user, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('tenant_id');
    setState({ user: null, isAuthenticated: false });
  }, []);

  return { ...state, login, logout };
}
