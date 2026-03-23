import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth.api';
import type {
  AuthTokens,
  LoginApiResponse,
  LoginRequest,
  LoginResponse,
  TenantInfo,
  UserInfo,
} from '../schemas/auth.schemas';
import { isTenantSelectorResponse } from '../schemas/auth.schemas';

// === Constantes ===

const REFRESH_TOKEN_KEY = 'associated_refresh_token';

/** Margen en segundos antes de la expiración para disparar auto-refresh. */
const REFRESH_MARGIN_SECONDS = 60;

// === Token accessors para interceptors (module-level) ===

// Los interceptors de Axios no pueden usar hooks de React,
// así que exponemos getters/setters a nivel de módulo.

let tokenGetter: () => string | null = () => null;
let tokenSetter: (tokens: AuthTokens | null) => void = () => {};

export function registerTokenAccessors(
  getter: () => string | null,
  setter: (tokens: AuthTokens | null) => void,
): void {
  tokenGetter = getter;
  tokenSetter = setter;
}

export function getAccessToken(): string | null {
  return tokenGetter();
}

export function setTokens(tokens: AuthTokens | null): void {
  tokenSetter(tokens);
}

// === Interfaces ===

interface AuthState {
  user: UserInfo | null;
  tenant: TenantInfo | null;
  role: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  accessToken: string | null;
  login: (credentials: LoginRequest) => Promise<LoginApiResponse>;
  selectTenant: (tenantId: string) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
}

// === Context ===

export const AuthContext = createContext<AuthContextValue | null>(null);

// === Provider ===

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Estado de autenticación
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Referencia al timer de auto-refresh para poder limpiarlo
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref al refresh token para acceso sincrónico en callbacks
  const refreshTokenRef = useRef<string | null>(null);
  // Ref al access token para acceso sincrónico en interceptors (evita stale closures)
  const accessTokenRef = useRef<string | null>(null);

  const isAuthenticated = accessToken !== null && user !== null;

  // --- Helpers internos ---

  /** Limpia el timer de auto-refresh si existe. */
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  /** Programa auto-refresh del access token ~60s antes de expirar. */
  const scheduleTokenRefresh = useCallback(
    (expiresIn: number) => {
      clearRefreshTimer();

      // expiresIn viene en segundos; restamos el margen
      const delayMs = Math.max(expiresIn - REFRESH_MARGIN_SECONDS, 0) * 1000;

      refreshTimerRef.current = setTimeout(async () => {
        const currentRefresh = refreshTokenRef.current;
        if (!currentRefresh) return;

        try {
          const tokens = await authApi.refreshTokens(currentRefresh);
          setAccessToken(tokens.accessToken);
          accessTokenRef.current = tokens.accessToken;

          // Actualizar refresh token si el backend rota tokens
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
          refreshTokenRef.current = tokens.refreshToken;

          // Programar siguiente refresh
          scheduleTokenRefresh(tokens.expiresIn);
        } catch {
          // Si falla el refresh, cerrar sesión limpiamente
          clearAuthState();
        }
      }, delayMs);
    },
    [clearRefreshTimer],
  );

  /** Limpia todo el estado de autenticación. */
  const clearAuthState = useCallback(() => {
    clearRefreshTimer();
    setAccessToken(null);
    accessTokenRef.current = null;
    setUser(null);
    setTenant(null);
    setRole(null);
    setPermissions([]);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('associated_tenant_id');
    refreshTokenRef.current = null;
  }, [clearRefreshTimer]);

  /**
   * Aplica la respuesta de login directo o selectTenant al estado.
   * ASYNC: espera a que los permisos se carguen ANTES de retornar,
   * evitando race condition donde la UI navega con permissions=[].
   */
  const applyLoginResponse = useCallback(
    async (response: LoginResponse): Promise<void> => {
      setAccessToken(response.accessToken);
      accessTokenRef.current = response.accessToken;
      setUser(response.user);
      setTenant(response.tenant);
      setRole(response.role);

      // Guardar tenant ID y refresh token en localStorage
      localStorage.setItem('associated_tenant_id', response.tenant.id);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      refreshTokenRef.current = response.refreshToken;

      // Programar auto-refresh
      scheduleTokenRefresh(response.expiresIn);

      // Cargar permisos ANTES de retornar — sin esto la UI navega con permissions=[]
      try {
        const profile = await authApi.getCurrentUser();
        setPermissions(profile.permissions);
      } catch {
        // Si falla obtener permisos, dejamos array vacío
        setPermissions([]);
      }
    },
    [scheduleTokenRefresh],
  );

  // --- Acciones expuestas ---

  const login = useCallback(
    async (credentials: LoginRequest): Promise<LoginApiResponse> => {
      const response = await authApi.login(credentials);

      // Si es login directo (un solo tenant), aplicar estado completo
      if (!isTenantSelectorResponse(response)) {
        await applyLoginResponse(response);
      }
      // Si requiere selección de tenant, devolver sin cambiar estado.
      // La UI manejará la selección y llamará a selectTenant().

      return response;
    },
    [applyLoginResponse],
  );

  const selectTenant = useCallback(
    async (tenantId: string): Promise<void> => {
      const response = await authApi.selectTenant(tenantId);
      applyLoginResponse(response);
    },
    [applyLoginResponse],
  );

  const switchTenant = useCallback(
    async (tenantId: string): Promise<void> => {
      const response = await authApi.switchTenant(tenantId);
      applyLoginResponse(response);
    },
    [applyLoginResponse],
  );

  const logout = useCallback(async (): Promise<void> => {
    const currentRefresh = refreshTokenRef.current;

    // Intentar invalidar el token en el backend ANTES de limpiar estado
    // (si limpiamos primero, el interceptor no tiene token y da 401)
    if (currentRefresh) {
      try {
        await authApi.logout(currentRefresh);
      } catch {
        // Error al cerrar sesión en backend no bloquea el flujo local
      }
    }

    // Limpiar estado después de la llamada API
    clearAuthState();
  }, [clearAuthState]);

  // --- Registrar token accessors para interceptors ---

  useEffect(() => {
    registerTokenAccessors(
      () => accessTokenRef.current,
      (tokens) => {
        if (tokens) {
          setAccessToken(tokens.accessToken);
          accessTokenRef.current = tokens.accessToken;
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
          refreshTokenRef.current = tokens.refreshToken;
          scheduleTokenRefresh(tokens.expiresIn);
        } else {
          clearAuthState();
        }
      },
    );
  }, [scheduleTokenRefresh, clearAuthState]);

  // --- Restauración de sesión al montar ---

  useEffect(() => {
    const restoreSession = async () => {
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!storedRefresh) {
        setIsLoading(false);
        return;
      }

      try {
        // Paso 1: Renovar tokens
        const tokens = await authApi.refreshTokens(storedRefresh);
        setAccessToken(tokens.accessToken);
        accessTokenRef.current = tokens.accessToken;
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
        refreshTokenRef.current = tokens.refreshToken;

        // Paso 2: Obtener perfil completo del usuario
        const profile = await authApi.getCurrentUser();
        setUser({ id: profile.id, email: profile.email, name: profile.name });
        setTenant(profile.currentTenant);
        setRole(profile.role);
        setPermissions(profile.permissions);

        // Paso 3: Programar auto-refresh
        scheduleTokenRefresh(tokens.expiresIn);
      } catch {
        // Si la restauración falla, limpiar todo y dejar al usuario desautenticado
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        refreshTokenRef.current = null;
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    // Limpiar timer al desmontar
    return () => {
      clearRefreshTimer();
    };
    // Solo ejecutar al montar el componente
  }, []);

  // --- Valor del contexto (memoizado) ---

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tenant,
      role,
      permissions,
      isAuthenticated,
      isLoading,
      accessToken,
      login,
      selectTenant,
      switchTenant,
      logout,
    }),
    [
      user,
      tenant,
      role,
      permissions,
      isAuthenticated,
      isLoading,
      accessToken,
      login,
      selectTenant,
      switchTenant,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
