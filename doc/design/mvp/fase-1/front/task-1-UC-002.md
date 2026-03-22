# Task 1 — UC-002: Autenticación multi-tenant (Frontend)

## Información general

- **Fase:** 1
- **Tipo:** Frontend
- **UC:** UC-002
- **Bounded Context:** BC-Identity
- **Prioridad:** Must

## Alcance

### Incluido

- Página de login (`/login`) con formulario email + contraseña
- Selector de tenant cuando el usuario pertenece a múltiples colectividades
- Almacenamiento seguro de tokens (Access Token + Refresh Token)
- Contexto de autenticación (`AuthProvider`) con estado global
- Hook `useAuth()` para acceso al estado de autenticación desde cualquier componente
- Interceptor Axios para inyección automática de `Authorization` y `X-Tenant-Id`
- Interceptor Axios para refresh automático en 401
- Rutas protegidas (`ProtectedRoute` component)
- Página de dashboard (placeholder, solo layout con navbar y sidebar)
- Funcionalidad de switch tenant en navbar
- Funcionalidad de logout
- Feedback visual: loading states, errores de validación, cuenta bloqueada
- Tests unitarios (componentes + hooks)

### Excluido

- Recuperación de contraseña / "He olvidado mi contraseña"
- Registro de usuarios (los usuarios se crean en provisión o alta de socio)
- Magic link por email
- Tematización / branding por tenant (post-MVP)
- PWA / Service Worker (post-MVP)
- Internacionalización (estructura preparada pero solo idioma ES en Fase 1)

## Dependencias

### Tareas previas requeridas

| Tarea                       | Artefacto necesario                                                                                                                                                                                                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fase 0 — Scaffold**       | Proyecto React + Vite + Mantine configurado, HttpClient (Axios) base, estructura de features, `QueryClientProvider`, `RouterProvider`, Zod instalado, `ErrorBoundary` + `ErrorReporter` configurados                                                                               |
| **F1-Back Task 2 — UC-002** | Endpoints de autenticación operativos: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/switch-tenant`, `GET /auth/me`. Contratos de DTOs definidos (`LoginRequestDto`, `LoginResponseDto`, `RefreshResponseDto`, `TenantSelectorDto`, `UserProfileDto`) |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] **Task 0 (Brand Setup) completada:** theme de marca, `index.html` con meta tags, logos SVG en `web/src/shared/assets/`, utilities de formateo (`format-money.ts`, `format-date.ts`)
- [ ] `web/src/shared/api/http-client.ts` existe con instancia Axios base configurada
- [ ] `web/src/app/router.tsx` existe con `RouterProvider` básico
- [ ] `web/src/shared/observability/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] `web/src/shared/observability/error-boundary.tsx` existe y envuelve la app en `providers.tsx`
- [ ] `zod` está instalado y disponible como dependencia
- [ ] Endpoint `POST /api/v1/auth/login` responde correctamente (probar con curl o REST client)
- [ ] Endpoint `POST /api/v1/auth/refresh` responde correctamente
- [ ] Endpoint `GET /api/v1/auth/me` responde con perfil del usuario autenticado
- [ ] Endpoint `POST /api/v1/auth/switch-tenant` responde correctamente
- [ ] Docker Compose con API y BD arrancados y accesibles desde `localhost:3000`

### Artefactos producidos

| Artefacto                                                         | Consumido por                                                         |
| ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| `AuthProvider` + `useAuth()`                                      | Todas las features del frontend (acceso al usuario, tenant, permisos) |
| `ProtectedRoute` component                                        | Todas las rutas que requieren autenticación                           |
| HttpClient con interceptors de auth configurados                  | Todas las llamadas API del frontend                                   |
| Layout base (Shell + Navbar + Sidebar)                            | Todas las páginas internas de la aplicación                           |
| Hook `usePermissions()`                                           | Frontends de UC-017, UC-018, UC-011, UC-013 (control de acceso en UI) |
| Schemas Zod de auth (`schemas/auth.schemas.ts`) + tipos inferidos | Todas las features que consumen datos de usuario/tenant               |

## Referencia de especificación

| Documento                                           | Contenido relevante                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `uc/uc-002.md`                                      | Flujo de login, selector de tenant, switch sin re-login, flujos de excepción                                                       |
| `us/us-002.md`                                      | Criterios de aceptación (login multi-tenant, switch, roles independientes)                                                         |
| `adr/adr-006.md`                                    | Claims JWT, flujo Access + Refresh token                                                                                           |
| `adr/adr-010.md`                                    | Formato de respuesta API, headers `Authorization` y `X-Tenant-Id`                                                                  |
| `stack/frontend.md`                                 | React 19, Mantine 8, React Router 7, React Query 5, Axios                                                                          |
| `rnf/rnf-001.md`                                    | Política de complejidad de password (validación client-side informativa)                                                           |
| `doc/brand/001-associated-brand-foundation.md`      | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición                          |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |

## Puntos críticos

1. **Almacenamiento de tokens.** El Access Token se almacena en memoria (variable de estado del `AuthProvider`). El Refresh Token se almacena en `localStorage` (aceptable para MVP; en producción, considerar `httpOnly cookie`). Nunca almacenar el Access Token en `localStorage` para minimizar superficie de ataque XSS.

2. **Refresh transparente en 401.** Cuando una respuesta devuelve 401 (token expirado), el interceptor Axios debe automáticamente intentar un refresh con el Refresh Token, reintentar la petición original y, solo si el refresh falla, redirigir al login. Esto debe manejar correctamente peticiones concurrentes (queue de requests mientras se ejecuta el refresh).

3. **Selector de tenant.** El endpoint de login puede devolver dos tipos de respuesta: tokens directos (1 tenant) o lista de tenants (múltiples). El componente de login debe manejar ambos flujos sin dos pantallas separadas, mostrando el selector solo cuando sea necesario.

4. **Sincronización de estado tras switch tenant.** Al cambiar de tenant, todo el estado cacheado de React Query debe invalidarse (`queryClient.clear()`). Los datos del tenant anterior no deben ser visibles. El layout debe reflejar inmediatamente el nuevo tenant (nombre, rol).

5. **Protección de rutas.** `ProtectedRoute` debe verificar la existencia de un token válido (no expirado) y, opcionalmente, permisos específicos. Si no hay token, redirige a `/login`. Si no hay permisos, muestra 403. No se debe renderizar contenido protegido ni por un instante antes de verificar.

## Riesgos

| Riesgo                                                            | Probabilidad | Impacto | Mitigación                                                                                |
| ----------------------------------------------------------------- | ------------ | ------- | ----------------------------------------------------------------------------------------- |
| Race condition en refresh concurrente (múltiples 401 simultáneos) | Alta         | Medio   | Implementar cola de refresh: primer 401 dispara refresh, los demás esperan la resolución  |
| Flash de contenido protegido antes de verificar auth              | Media        | Medio   | Renderizar loading/splash mientras se verifica el estado de auth al montar `AuthProvider` |
| Token expirado entre tabs del navegador                           | Media        | Bajo    | Escuchar `storage` events para sincronizar estado entre tabs                              |
| Mantine theme conflict con componentes custom                     | Baja         | Bajo    | Usar sistema de themes de Mantine consistentemente, no CSS raw                            |

## Plan de implementación

### Paso 1: Schemas Zod y tipos derivados

Crear en `web/src/features/auth/schemas/`:

- **`auth.schemas.ts`**: Definir schemas Zod que sirven como contrato de la API. Los tipos TypeScript se infieren automáticamente con `z.infer<>`, garantizando que la validación en runtime y el tipado en compilación estén siempre sincronizados:

  ```typescript
  import { z } from 'zod';

  // Schemas base reutilizables
  const authTokensSchema = z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
  });
  const userInfoSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
  });
  const tenantInfoSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  });

  // Schemas de respuesta
  const loginResponseSchema = z.object({
    tokens: authTokensSchema,
    user: userInfoSchema,
    tenant: tenantInfoSchema,
    role: z.string(),
  });
  const tenantSelectorResponseSchema = z.object({
    requiresTenantSelection: z.literal(true),
    tenants: z.array(tenantInfoSchema.extend({ role: z.string() })),
  });
  const userProfileSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string(),
    currentTenant: tenantInfoSchema,
    role: z.string(),
    permissions: z.array(z.string()),
  });

  // Tipos inferidos (se usan en el resto de la feature)
  type AuthTokens = z.infer<typeof authTokensSchema>;
  type LoginResponse = z.infer<typeof loginResponseSchema>;
  type TenantSelectorResponse = z.infer<typeof tenantSelectorResponseSchema>;
  type UserProfile = z.infer<typeof userProfileSchema>;
  ```

- Los schemas se exportan junto con los tipos. Las funciones API del paso 2 parsean las respuestas con `schema.parse(response.data)`, lo cual lanza `ZodError` si la API devuelve una estructura inesperada. Esto se captura en el interceptor de Axios y se reporta vía `ErrorReporter`

### Paso 2: Servicio API de autenticación

Crear en `web/src/features/auth/api/`:

- **`auth.api.ts`**: Funciones que encapsulan llamadas al backend. Cada función parsea la respuesta con el schema Zod correspondiente (`schema.parse(response.data.data)`), lo que valida la estructura en runtime:
  - `login(credentials): Promise<LoginResponse | TenantSelectorResponse>` — parsea con `loginResponseSchema` o `tenantSelectorResponseSchema` según la forma de la respuesta
  - `selectTenant(tenantId: string): Promise<LoginResponse>` — parsea con `loginResponseSchema`
  - `refreshTokens(refreshToken: string): Promise<AuthTokens>` — parsea con `authTokensSchema`
  - `logout(refreshToken: string): Promise<void>`
  - `switchTenant(tenantId: string): Promise<LoginResponse>` — parsea con `loginResponseSchema`
  - `getCurrentUser(): Promise<UserProfile>` — parsea con `userProfileSchema`
  - Si `ZodError` se produce, se reporta vía `ErrorReporter.captureException()` con el detalle de los campos que no coinciden

### Paso 3: AuthProvider y useAuth hook

Crear en `web/src/features/auth/context/`:

- **`auth.provider.tsx`**: React Context que gestiona el estado de autenticación:
  - Estado:
    - `user: UserInfo | null`
    - `tenant: TenantInfo | null`
    - `role: string | null`
    - `permissions: string[]`
    - `accessToken: string | null` (en memoria, NO en localStorage)
    - `isAuthenticated: boolean`
    - `isLoading: boolean` (true durante verificación inicial)
  - Acciones:
    - `login(credentials): Promise<LoginResponse | TenantSelectorResponse>`
    - `selectTenant(tenantId): Promise<void>`
    - `switchTenant(tenantId): Promise<void>`
    - `logout(): Promise<void>`
  - Al montar: verificar si existe refresh token en localStorage → si existe, intentar refresh para restaurar sesión → setear `isLoading = false` al terminar
  - `refreshToken` en localStorage con key `associated_refresh_token`
  - Timer para refresh automático antes de expiración del access token (ej: 1 minuto antes)

- **`use-auth.ts`**: Hook que consume el AuthContext. Lanza error si se usa fuera del Provider.

- **`use-permissions.ts`**: Hook derivado:
  - `hasPermission(permission: string): boolean`
  - `hasAnyPermission(permissions: string[]): boolean`
  - `hasAllPermissions(permissions: string[]): boolean`

### Paso 4: Interceptors de Axios

Actualizar `web/src/shared/api/http-client.ts`:

**Request interceptor:**

- Leer `accessToken` del AuthProvider (vía closure o store)
- Si existe token: añadir header `Authorization: Bearer {token}`
- Leer `tenantId` del AuthProvider
- Si existe tenantId: añadir header `X-Tenant-Id: {tenantId}`

**Response interceptor (manejo de 401 y errores):**

- Si respuesta es 401 y hay refresh token disponible:
  1. Marcar flag `isRefreshing = true`
  2. Intentar `refreshTokens(refreshToken)`
  3. Si éxito: actualizar tokens, reintentar la petición original
  4. Si fallo: limpiar estado de auth, redirigir a `/login`
- **Cola de peticiones concurrentes**: si `isRefreshing` es true cuando llega otro 401, encolar la petición y resolverla cuando el refresh termine
- **Errores 5xx y de red**: reportar vía `ErrorReporter.captureException()` con contexto de la petición (URL, método, status)
- **ZodError en parseo de respuesta**: reportar vía `ErrorReporter.captureException()` con detalle de los campos que fallaron (indica desalineación API↔frontend)

### Paso 5: Página de login

Crear en `web/src/features/auth/pages/`:

- **`login.page.tsx`**: Página de login con Mantine components:
  - Layout centrado en pantalla, título "Iniciar sesión"
  - Para la pantalla de login, usar `logo-stacked.svg` (isotipo arriba + texto debajo) importado desde `@/shared/assets/logo-stacked.svg` con un ancho de 120-140px
  - Formulario con `react-hook-form` + `zodResolver`:
    - Campo `email` (TextInput, type email, validación: formato email)
    - Campo `password` (PasswordInput, validación: no vacío)
    - Botón "Acceder" (`color="brand"`, loading state durante submit). Nunca usar `variant="gradient"` — prohibido por directrices de marca
  - Manejo de errores:
    - Credenciales inválidas → notificación roja: "Credenciales incorrectas"
    - Cuenta bloqueada → notificación yellow (Mantine `color="yellow"`, shade 6 `#FAB005`): "Cuenta bloqueada temporalmente. Reintente en X minutos"
    - Error de red → notificación roja: "Error de conexión. Verifique su conexión a internet"
  - Si la respuesta es `requiresTenantSelection: true` → mostrar selector de tenant (paso 6)
  - Si login exitoso con 1 tenant → redirigir a `/dashboard`

### Paso 6: Selector de tenant

Crear en `web/src/features/auth/components/`:

- **`tenant-selector.tsx`**: Componente que se muestra tras login exitoso cuando el usuario pertenece a múltiples tenants:
  - Lista de tarjetas (Mantine Card) con:
    - Nombre de la colectividad
    - Tipo (Peña, Cofradía, Club, Asociación)
    - Rol del usuario en esa colectividad (badge)
  - Al hacer click en una tarjeta → `selectTenant(tenantId)` → redirigir a `/dashboard`
  - Indicador de "última colectividad" (persistida en localStorage)

### Paso 7: Rutas protegidas

Crear en `web/src/shared/components/`:

- **`protected-route.tsx`**: Wrapper de React Router que:
  1. Si `isLoading` (verificación inicial en curso) → renderiza spinner/skeleton
  2. Si `!isAuthenticated` → `<Navigate to="/login" />`
  3. Si requiere permisos específicos (prop `permissions`) y el usuario no los tiene → renderiza página 403
  4. Si todo OK → renderiza `<Outlet />` (children)

Actualizar `web/src/app/router.tsx`:

- `/login` → `LoginPage` (pública)
- `/` → `ProtectedRoute` → layout principal
  - `/dashboard` → `DashboardPage` (placeholder)

### Paso 8: Layout principal

Crear en `web/src/shared/components/layout/`:

- **`app-shell.tsx`**: Layout principal usando `AppShell` de Mantine:
  - **Navbar** (header):
    - Nombre de la colectividad actual (tenant)
    - Menú de usuario (dropdown):
      - Nombre del usuario
      - Rol actual (badge)
      - "Cambiar colectividad" (si múltiples tenants) → abre modal de switch
      - "Cerrar sesión" → logout + redirect a `/login`
  - **Sidebar** (navbar lateral):
    - **Logo sidebar abierto**: usar `logo-horizontal-white.svg` importado desde `@/shared/assets/logo-horizontal-white.svg` con ancho de 140-160px. La variante blanca usa `#EAF7FE` (`brand.0`), no blanco puro
    - **Logo sidebar colapsado**: usar `isotipo-white.svg` importado desde `@/shared/assets/isotipo-white.svg` con ancho de 28-32px
    - Fondo del sidebar: `theme.other.brandDark` (`#27343E`) — nunca hardcodear el hex, usar el token del theme
    - Texto de items activos: opacidad 100%
    - Texto de items inactivos: opacidad 60%
    - Labels de sección (ej: "Tesorería", "Socios"): opacidad 30%
    - Item activo: fondo `rgba(255,255,255,0.1)` + borde izquierdo semitransparente
    - Ancho del navbar: 240px (desktop), colapsado en mobile (<768px / breakpoint `sm`)
    - Links de navegación condicionados por permisos:
      - Dashboard (todos)
      - Socios (permission: `membership:members:read`)
      - Tesorería (permission: `treasury:*:read`)
      - Configuración (permission: `settings:*:read`)
    - Cada link verifica permisos con `usePermissions()`
  - **Main content**: `<Outlet />` donde se renderizan las páginas

- **`switch-tenant-modal.tsx`**: Modal con lista de tenants del usuario (reutiliza `TenantSelector`). Al seleccionar:
  1. `switchTenant(tenantId)`
  2. `queryClient.clear()` (invalidar todo el cache de React Query)
  3. Redirigir a `/dashboard`

### Paso 9: Página dashboard (placeholder)

Crear en `web/src/features/dashboard/pages/`:

- **`dashboard.page.tsx`**: Placeholder con:
  - Título "Dashboard" con nombre de la colectividad
  - Cards vacías con texto "Próximamente" para KPIs
  - Sirve para verificar que la autenticación funciona end-to-end

### Paso 10: Tests

**Tests unitarios (componentes):**

- `LoginPage`:
  - Renderiza formulario con campos email y password
  - Muestra error de validación si email inválido
  - Muestra error de validación si password vacío
  - Muestra loading en botón durante submit
  - Muestra error de credenciales inválidas (mock API)
  - Muestra selector de tenant si múltiples tenants (mock API)
  - Redirige a dashboard tras login exitoso (mock API + mock router)
- `TenantSelector`:
  - Renderiza lista de tenants con nombre y rol
  - Llama a selectTenant al hacer click
- `ProtectedRoute`:
  - Renderiza children si autenticado
  - Redirige a login si no autenticado
  - Renderiza 403 si sin permisos
- `AppShell`:
  - Muestra nombre del tenant actual
  - Muestra links condicionados por permisos

**Tests unitarios (hooks):**

- `useAuth()`:
  - Retorna estado inicial correcto (no autenticado)
  - Actualiza estado tras login exitoso
  - Limpia estado tras logout
- `usePermissions()`:
  - `hasPermission` retorna true/false correctamente
  - `hasAnyPermission` con array de permisos

## Criterios de aceptación

Derivados de US-002:

1. **Login funcional:** El usuario introduce email y contraseña, el sistema autentica contra la API y redirige al dashboard. Si las credenciales son inválidas, muestra error claro.

2. **Selector de tenant:** Si el usuario pertenece a múltiples colectividades, tras autenticarse ve un selector con el nombre, tipo y rol de cada una. Puede elegir a cuál acceder.

3. **Cambio de contexto sin re-login:** Desde el navbar, el usuario puede cambiar de colectividad sin volver a introducir credenciales. El sistema actualiza la UI inmediatamente con los datos y permisos del nuevo tenant.

4. **Roles reflejados en la UI:** Los links del sidebar y los elementos de la UI se muestran/ocultan según los permisos del rol del usuario en el tenant actual.

5. **Refresh transparente:** Si el access token expira durante una sesión, el sistema renueva automáticamente sin interrumpir al usuario (mientras el refresh token sea válido).

6. **Persistencia de sesión:** Al recargar la página, el sistema restaura la sesión si el refresh token sigue siendo válido, sin pedir login de nuevo.

7. **Cuenta bloqueada:** Si la API devuelve error de cuenta bloqueada, la UI muestra un mensaje claro con el tiempo de espera.
