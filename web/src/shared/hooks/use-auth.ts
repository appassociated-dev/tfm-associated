import { useState, useCallback } from 'react';

/** Estado de autenticación del usuario. */
interface AuthState {
  /** Indica si el usuario está autenticado. */
  isAuthenticated: boolean;
  /** ID del usuario (null si no está autenticado). */
  userId: string | null;
  /** Email del usuario (null si no está autenticado). */
  email: string | null;
  /** ID del tenant activo (null si no se ha seleccionado). */
  tenantId: string | null;
  /** Indica si se está verificando la autenticación. */
  isLoading: boolean;
}

/** Valor de retorno del hook useAuth. */
interface UseAuthReturn extends AuthState {
  /** Inicia sesión con token (placeholder). */
  login: (token: string, tenantId?: string) => void;
  /** Cierra la sesión. */
  logout: () => void;
}

/**
 * Hook de autenticación (placeholder).
 * Gestiona el estado básico de autenticación leyendo/escribiendo en localStorage.
 * Se reemplazará con la implementación completa del módulo auth.
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem('access_token');
    return {
      isAuthenticated: !!token,
      userId: null,
      email: null,
      tenantId: localStorage.getItem('tenant_id'),
      isLoading: false,
    };
  });

  /** Guarda el token y actualiza el estado (placeholder). */
  const login = useCallback((token: string, tenantId?: string) => {
    localStorage.setItem('access_token', token);
    if (tenantId) {
      localStorage.setItem('tenant_id', tenantId);
    }
    setState({
      isAuthenticated: true,
      userId: null, // Se resolverá al decodificar el JWT
      email: null,
      tenantId: tenantId ?? null,
      isLoading: false,
    });
  }, []);

  /** Elimina el token y limpia el estado. */
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('tenant_id');
    setState({
      isAuthenticated: false,
      userId: null,
      email: null,
      tenantId: null,
      isLoading: false,
    });
  }, []);

  return { ...state, login, logout };
}
