# Changelog de Sesiones

Historico detallado de sesiones de trabajo trasladado desde [Unreleased] al cerrar cada version.

---

## Sesiones del release [0.1.0] - 2026-03-25

### 20260324-001-acester-CLAUDECODE

- **Fecha de sesion:** 24 de marzo de 2026
- **Hora de inicio:** 21:48
- **Hora de ultimos trabajos:** 18:17
- **Documento de sesion:** [doc/agents-sessions/20260324-001-acester-CLAUDECODE.md](doc/agents-sessions/20260324-001-acester-CLAUDECODE.md)

#### Added

- Stack de despliegue Docker para produccion con 4 servicios (postgres, migration, api, web) - **SDD: production-docker-deploy**
- `api/Dockerfile.prod` - imagen multi-stage para API NestJS (node:22-slim + tini)
- `web/Dockerfile.prod` - imagen multi-stage para SPA React (nginx:1.27-alpine)
- `docker-compose.prod.yml` - stack de produccion completo
- `nginx/associated.conf` - vhost nginx del host con SSL termination y cabeceras de seguridad
- `web/nginx.conf` - configuracion nginx para SPA routing en contenedor web
- `.dockerignore` - exclusiones para build Docker
- `.env.production.example` - plantilla de variables de entorno para produccion
- Scripts de operaciones: `deploy.sh`, `migrate-tenants.sh`, `seed-production.sh`, `verify-deploy.sh`
- Endpoint de health check `GET /api/v1/health` con `@nestjs/terminus`
- Documentacion exhaustiva de despliegue en `doc/deploy/` (8 documentos, 3780 lineas)
- Utilidad compartida `parsePermissions(raw)` en `api/src/shared/` con 12 tests unitarios
- Interface `RequestWithUser` para tipado seguro de requests autenticados
- Step `Generate Prisma clients` en pipeline CI con env vars dummy para schema generation

#### Changed

- Movidos `tsconfig-paths`, `prisma`, `dotenv` de devDependencies a dependencies en `api/package.json`
- Anadido `@nestjs/terminus` como dependencia de produccion
- Refactorizado `PermissionsGuard` para usar utilidad compartida `parsePermissions` en vez de metodo privado
- Reemplazados 4 casteos `as string[]` inseguros en handlers de auth por `parsePermissions()` con validacion runtime
- Eliminados 70 warnings de ESLint en workspace API: `as any` reemplazados por tipos concretos, imports/variables sin uso eliminados
- Renombrado `generate-prisma-bridges.spec.ts` a `.integration-spec.ts` (integration test mal clasificado)
- Agregado exclude explicito para `*.integration-spec.ts` en `api/vitest.config.ts`

#### Fixed

- Path de configuracion Prisma en `DatabaseProvisioningService` (`process.cwd()` → `__dirname`)
- Configuracion HTTP/2 en nginx 1.24 (`http2 on;` → `listen 443 ssl http2;`)
- 4 errores ESLint `no-restricted-syntax` que bloqueaban CI lint (casteos inseguros sobre campos Prisma Json)
- 6 errores TypeScript `tsc --noEmit` que bloqueaban CI typecheck: props faltantes en fixtures, top-level await incompatible con CommonJS, tipo async de mock incorrecto
- Pipeline CI backend: `prisma generate` antes de lint/tests (resuelve 30 fallos por modulos `@prisma-main`/`@prisma-tenant` no encontrados)
- Job E2E de Playwright deshabilitado con `if: false` (workspace scaffoldeado sin tests implementados)

#### Removed

- Metodo privado `parsePermissions()` de `PermissionsGuard` (extraido a utilidad compartida)
- Imports y variables sin uso en 22 archivos del workspace API

---

### 20260323-001-acester-CLAUDECODE

- **Fecha de sesion:** 23 de marzo de 2026
- **Hora de inicio:** 01:43
- **Hora de ultimos trabajos:** 13:32
- **Documento de sesion:** [doc/agents-sessions/20260323-001-acester-CLAUDECODE.md](doc/agents-sessions/20260323-001-acester-CLAUDECODE.md)

#### Added

- Infraestructura i18n con react-i18next: 7 namespaces (auth, common, dashboard, errors, membership, treasury, validation) y type declarations - **SDD: i18n-infrastructure**
- Migracion de strings hardcoded a i18n en 45+ componentes

#### Changed

- Internacionalizados 28 mensajes de validacion Zod via i18n.t() singleton - **SDD: i18n-zod-errorboundary**
- Migrados strings de ErrorBoundary, http-client y main.tsx a i18n

#### Fixed

- Resuelto hang infinito en tests 4-12 de member-crud integration: watch() sin argumentos en personal-data-step.tsx generaba nuevo objeto cada render causando loop infinito - **SDD: fix-member-crud-tests-hang**
- Agregado DatesProvider en test wrapper y setup.ts con dayjs plugins para DateInput

#### Removed

[Sin cambios]

---

### 20260322-001-acester-CLAUDECODE

- **Fecha de sesion:** 22 de marzo de 2026
- **Hora de inicio:** 00:43
- **Hora de ultimos trabajos:** 23:19
- **Documento de sesion:** [doc/agents-sessions/20260322-001-acester-CLAUDECODE.md](doc/agents-sessions/20260322-001-acester-CLAUDECODE.md)

#### Added

- Reescrita suite completa de tests del frontend: factories (auth, member, fee-plan, subscription, tenant), helpers de render, MSW handlers - **SDD: web-test-overhaul** - 92 archivos, 19806 inserciones
- Tests de integracion nuevos: login-flow, member-crud, error-boundary, route-guards
- Tests unitarios nuevos para hooks de auth, membership leave, registration, treasury
- README del proyecto actualizado con informacion detallada, badges y banner SVG/PNG

#### Changed

- Migrado stack frontend a Zod 4 + react-hook-form (desde Zod 3.25 + @mantine/form) - **SDD: stack-alignment**
- Sustituidas referencias a @mantine/form por RHF en 10 archivos de spec/doc - **SDD: spec-cleanup-forms**
- Actualizados 9 archivos de references del skill doc-spec-manager

#### Fixed

- Resueltos 4 errores de TypeScript typecheck en el frontend

#### Removed

[Sin cambios]

---

### 20260320-001-acester-CLAUDECODE

- **Fecha de sesion:** 20 de marzo de 2026
- **Hora de inicio:** 15:39
- **Hora de ultimos trabajos:** 15:39
- **Documento de sesion:** [doc/agents-sessions/20260320-001-acester-CLAUDECODE.md](doc/agents-sessions/20260320-001-acester-CLAUDECODE.md)

#### Added

[Sin cambios]

#### Changed

- Actualizadas directrices de diseno UI: brand foundation con soporte de modo oscuro y optimizacion de sidebar documentados

#### Fixed

[Sin cambios]

#### Removed

[Sin cambios]

---

### 20260319-001-acester-CLAUDECODE

- **Fecha de sesion:** 19 de marzo de 2026
- **Hora de inicio:** 03:59
- **Hora de ultimos trabajos:** 03:59
- **Documento de sesion:** [doc/agents-sessions/20260319-001-acester-CLAUDECODE.md](doc/agents-sessions/20260319-001-acester-CLAUDECODE.md)

#### Added

- Componente RouteError y Breadcrumbs en 4 paginas internas
- Endpoint check-email, preconditions DTO y activate fee plan en backend
- postcss.config.cjs con responsive mixins de Mantine
- Seed data y testing manual con screenshots

#### Changed

- Rediseno completo de AppShell: sidebar agrupado por BC, dark mode, logos adaptativos
- Loading spinner global corregido en theme (Button.extend con loaderProps)
- Migracion Prisma (290 lineas) para modelos de membership y treasury
- Permisos frontend con matchPermission() y soporte de wildcards portado del backend

#### Fixed

- Resueltos 48 issues de auditoria del frontend fase 1 (127 archivos, 22156 inserciones)
- Corregida race condition en auth provider: applyLoginResponse ahora async con await getCurrentUser()
- Corregidos route params (:memberId), URLs de API (treasury prefix), schemas Zod de leave
- Corregidos fixes de backend: registration charge adapter, fee-plan response DTO, link-member-types handler

#### Removed

[Sin cambios]

---

### 20260318-001-acester-CLAUDECODE

- **Fecha de sesion:** 18 de marzo de 2026
- **Hora de inicio:** 00:49
- **Hora de ultimos trabajos:** 02:31
- **Documento de sesion:** [doc/agents-sessions/20260318-001-acester-CLAUDECODE.md](doc/agents-sessions/20260318-001-acester-CLAUDECODE.md)

#### Added

- Informe de auditoria exhaustiva del frontend fase 1 en doc/reports/frontend-fase1-audit.md: 6 P0 criticos, 12 P1, 18 P2, 12 P3 detectados por 6 subagentes en paralelo
- Componente RouteError para errores de ruta con pagina amigable (en vez de stack trace)
- errorElement configurado en router.tsx para rutas protegidas

#### Changed

- Reestructurado sidebar con NAV_SECTIONS agrupadas por Bounded Context (secciones Socios y Tesoreria con labels al 30% opacidad)
- Permisos de NAV_ITEMS alineados con SYSTEM_ROLES canonicos del backend
- Campo birthDate migrado de input nativo type="date" a Mantine DateInput con locale espanol y formato DD/MM/YYYY
- Paso 3 del wizard de alta ahora muestra importe real de inscripcion con formatMoney() en vez de texto generico
- Validacion condicional en schema createFeePlanInput: frequency y billingMonths requeridos solo para RECURRING
- MemberRepository.save() acepta tx transaccional opcional - alta de socio ahora es atomica con artefactos de tesoreria
- PrismaMemberRepository captura P2002 y lanza EmailAlreadyExistsError/DocumentAlreadyExistsError en vez de error Prisma crudo
- Botones "Cancelar Baja" y "Generar Certificado PDF" deshabilitados con tooltip explicativo (requieren endpoints backend)
- AppShell padding cambiado de md (16px) a lg (24px) segun guidelines de marca
- Creado postcss.config.cjs con postcss-preset-mantine y postcss-simple-vars para responsive mixins
- Iconos en Stepper del wizard de alta (IconUser, IconCategory, IconCheck)
- useBlocker migrado de window.confirm() a Modal Mantine con proceed/reset
- Tildes corregidas en 8 archivos fuente (anos→anos, Numero→Numero)
- Iconos en sidebar (IconDashboard, IconUserPlus, IconReceipt)
- Iconos en LeaveActions (IconUserMinus, IconUserPlus)
- Comentario corregido en theme: defaultColorScheme → forceColorScheme
- Script inline en index.html para data-mantine-color-scheme="light" (previene FOUC)
- Rediseñado layout: logo Associated en header brand (horizontal abierto, isotipo colapsado), sidebar colapsable en desktop con toggle
- Tenant name movido del header al footer del sidebar
- Sidebar CSS: opacidad de section headers (55%), iconos inactivos (70%), hover sin perder texto
- Sidebar colapsado: solo iconos centrados (70px) con tooltips, dividers en vez de section headers
- DatesProvider con locale español añadido a providers.tsx para @mantine/dates
- Reordenados controllers en membership.module.ts: RegistrationController antes de MembersController (fix ruta preconditions vs :id)
- Validacion importe minimo 0.01€ en formulario de planes de cuota (NumberInput min + schema min(1) centavo)
- Validacion codigo minimo 2 caracteres en formulario de planes de cuota + errores backend en toast
- Toast autoClose reducido a 4000ms en los 5 hooks de fee-plans
- Min-width 120px en boton Guardar de fee plans (fix loading spinner descentrado)
- MantineProvider: forceColorScheme="light" cambiado a defaultColorScheme="auto" - detecta preferencia del sistema (light/dark)
- Logos adaptativos en header: useComputedColorScheme swapea entre versiones color y white segun color scheme
- CSS del sidebar migrado de variables fijas (gray-X) a variables semanticas de Mantine (dimmed, text, default-hover, default-border) para compatibilidad dark mode
- Header brand section con ancho fijo alineado al sidebar (240px abierto, 70px colapsado)
- Borde del header brand usa var(--mantine-color-default-border) para consistencia con el tema
- Parametros del filtro de planes de cuota limpiados: params undefined cuando no hay filtro en vez de { active: undefined }
- Botones "Generar Certificado PDF" y "Cancelar Baja - Regularizacion" cambiados de disabled a variant="outline" color="brand" con notificacion onClick (disabled no era visible en dark mode)
- "Ejecutar Baja por Impago" ahora disabled con tooltip cuando workflow de morosidad esta incompleto
- Loading spinner de botones arreglado globalmente en theme: Button.extend() con loaderProps type dots + minWidth 100px

#### Fixed

- Corregido sistema de permisos frontend: implementado matchPermission() con soporte de wildcards (`*`, `bc:*`) portado del backend PermissionsGuard - sidebar ahora muestra todos los items segun rol
- Corregida race condition de permisos: applyLoginResponse ahora async con await getCurrentUser() - permisos disponibles antes de renderizar sidebar
- Corregido route param mismatch: `:id` cambiado a `:memberId` en 3 rutas de leave en router.tsx - paginas de baja/rehabilitacion ahora funcionales
- Anadidos Breadcrumbs (Mantine) a 4 paginas internas: voluntary-leave, nonpayment-leave, reinstatement, member-subscriptions
- Corregido await faltante en login(): applyLoginResponse se llamaba sin await, causando sidebar vacio al re-login
- Corregidas URLs de API de tesoreria: fee-plans y subscriptions apuntaban a `/v1/fee-plans` y `/v1/member-accounts` en vez de `/v1/treasury/fee-plans` y `/v1/treasury/member-accounts`
- Corregida sub-ruta de importar plantilla: `templates/import` cambiado a `import-template` para coincidir con backend
- Corregido test pre-existente auth.schemas.spec.ts: fixture y assertion actualizados de formato nested a flat
- Corregida race condition de token stale: accessTokenRef sincronico para interceptor Axios, evita 401 al re-login
- Corregido boton "Siguiente" deshabilitado en wizard de alta de socio: onValidChange faltaba en dependency array del useEffect
- Corregida validacion de codigo de plan de cuota: regex ahora acepta guiones y underscores (`/^[a-zA-Z0-9_-]+$/`)
- Corregida creacion/edicion de planes de cuota unica (ONE_TIME): frequency ahora @IsOptional() en DTOs del backend, frontend evita loop infinito con useRef
- Corregido logout 401: API de invalidacion de refresh token ahora se llama ANTES de limpiar el estado de auth (el token es necesario para autenticar la peticion)
- Corregido loop infinito en wizard de alta de socio: callbacks handleStep0ValidChange y handleStep1ValidChange envueltos en useCallback para evitar re-renders infinitos al estar onValidChange en dependency array del useEffect
- Corregida URL de check-dni: frontend ahora envia `/check-dni/DNI/73155707K` (2 segmentos) para coincidir con endpoint del backend `/check-dni/:documentType/:documentNumber`
- Corregido schema dniCheckResponseSchema: memberName/memberNumber de `.nullable()` a `.nullish()` (backend no envia los campos cuando exists=false)
- Corregido payload de alta simple: transformacion firstName→name, lastName→surnames, dni→documentType+documentNumber en capa API para coincidir con DTO del backend
- Corregida version de @mantine/notifications: 8.3.16 actualizada a 8.3.18 para evitar doble instancia de @mantine/core que causaba crash de DateInput
- Corregido crash de DateInput al seleccionar fecha del calendario: verificacion defensiva con instanceof Date antes de llamar toISOString()
- Corregido error TypeScript en prisma-member.repository.ts: String() wrapper en argumentos de EmailAlreadyExistsError y DocumentAlreadyExistsError
- Corregidos bordes inconsistentes del sidebar en dark mode: eliminado borde explicito de .navbar (Mantine gestiona el suyo), eliminado color hardcodeado de Divider de secciones
- Corregido login logo en dark mode: useComputedColorScheme swapea a logo-stacked-white.svg
- Corregido filtro "Mostrar inactivos" de planes de cuota: schema Zod de respuesta cambiado de min(1) a min(0) (un plan inactivo con importe 0 causaba error silencioso de Zod)
- Corregidas vinculaciones de tipos de socio a planes: (1) GetFeePlanHandler ahora devuelve linkedMemberTypes, (2) LinkMemberTypesHandler con semantica de reemplazo (delete + save), (3) DTO acepta arrays vacios
- Corregidas precondiciones de alta de socio: (1) validate-preconditions.handler.ts ahora llama setTenantId() en registrationChargePort, (2) frontend maneja isError del hook con alerta roja
- Corregidos 7 mismatches en schemas Zod de leave (leaveSummarySchema y reinstatementSummarySchema): nombres de campos, campos faltantes y tipos alineados con respuesta real del backend
- Backend ahora envia memberDni en respuestas de leave-summary y reinstatement-summary (antes mostraba "No disponible")
- Pagina /reinstate maneja error 422 para socios ACTIVE con alerta descriptiva en vez de error generico

#### Added

- Endpoint PATCH /api/v1/treasury/fee-plans/:id/activate para reactivar planes de cuota inactivos (dominio, comando, handler, controller, modulo)
- Hook useActivateFeePlan con invalidacion de queries y notificacion de exito
- Boton "Activar" condicional en menu de acciones de planes inactivos (verde)
- Endpoint GET /api/v1/members/check-email/:email para verificacion de email duplicado (query, handler, controller)
- Endpoint GET /api/v1/members/preconditions para validacion de precondiciones del alta simple
- Hook usePreconditions con alerta bloqueante cuando faltan precondiciones (ejercicio fiscal, tipos socio, plan ONE_TIME)
- Hook useCheckEmail con debounce 500ms y warning no-bloqueante en wizard de alta
- Cableado LinkMemberTypesModal al menu item "Ver vinculaciones" en planes de cuota
- Alerta de workflow de morosidad incompleto en pagina de baja por impago
- Campo DNI en seccion datos del socio en las 3 paginas de leave (voluntary, nonpayment, reinstatement)
- Alerta amarilla "Rehabilitacion no disponible" en pagina /reinstate para socios en estado ACTIVE (en vez de error generico)

#### Removed

[Sin cambios]

---

### 20260317-002-acester-CLAUDECODE

- **Fecha de sesion:** 17 de marzo de 2026
- **Hora de inicio:** 23:54
- **Hora de ultimos trabajos:** 23:54
- **Documento de sesion:** [doc/agents-sessions/20260317-002-acester-CLAUDECODE.md](doc/agents-sessions/20260317-002-acester-CLAUDECODE.md)

#### Added

[Sin cambios]

#### Changed

- Actualizado loginResponseSchema en auth.schemas.ts: tokens de formato nested a flat para coincidir con respuesta real del backend
- Actualizado AuthProvider: response.tokens.X a response.X + persistencia de tenant ID en localStorage

#### Fixed

- Corregido prisma-client.stub.d.ts: agregados campos databaseUser y databasePasswordEncrypted a PrismaRawTenant, y opcion select a PrismaDelegate.findUnique
- Corregidos tipos en tenant-prisma.mapper.ts y tenant.ts: databaseUser de optional/undefined a string | null
- Corregida migracion tenant incompleta: generada migracion add_all_tenant_models con todos los modelos del schema
- Corregido login silenciosamente fallido: loginResponseSchema no coincidia con formato flat del backend
- Corregido header X-Tenant-Id faltante: AuthProvider no persistia tenant ID en localStorage tras login

#### Removed

[Sin cambios]

---

### 20260317-001-acester-CLAUDE

- **Fecha de sesion:** 17 de marzo de 2026
- **Hora de inicio:** 12:25
- **Hora de ultimos trabajos:** 17:34
- **Documento de sesion:** [doc/agents-sessions/20260317-001-acester-CLAUDE.md](doc/agents-sessions/20260317-001-acester-CLAUDE.md)

#### Added

[Sin cambios]

#### Changed

- Optimizado test suite del backend: eliminados ~87 tests redundantes (cookie-cutter events, typed IDs, enums inflados) y fortalecidas ~22 assertions debiles en api/
- Agregado plugin SWC (`vitest-plugin-swc`) a configs de vitest unit e integracion para soporte de metadata de decoradores NestJS
- Agregada configuracion de pool (threads, maxThreads: 4) y deps.inline para @prisma/client en las 3 configs de vitest

#### Fixed

- Corregido rendimiento de vitest unit tests: agregado transformador SWC faltante que E2E ya tenia, reduciendo tiempo de transform de 78s a 2.5s en filesystem nativo

#### Removed

- Eliminados 4 archivos de test de typed IDs redundantes (tenant-id.spec.ts, user-id.spec.ts, member-id.spec.ts, member-type-id.spec.ts) - cubiertos por tests de clase base identifier.spec.ts

---

### 20260316-002-acester-CLAUDE

- **Fecha de sesion:** 16 de marzo de 2026
- **Hora de inicio:** 16:29
- **Hora de ultimos trabajos:** 10:28
- **Documento de sesion:** [doc/agents-sessions/20260316-002-acester-CLAUDE.md](doc/agents-sessions/20260316-002-acester-CLAUDE.md)

#### Added

- SDD completo (proposal, spec, design, tasks) para cambio backend-http-layer-testing - 19 tareas en 4 batches
- Tests HTTP integration para TenantsController (7 tests) y AuthController (12 tests) con @nestjs/testing + supertest
- Tests de cobertura para PermissionsGuard parsePermissions() - 12 escenarios (array, JSON string, null, tipos invalidos)
- Tests de integracion para script generate-prisma-bridges.js - 22 tests (regex, idempotencia, exports)
- EncryptedSecret Value Object para manejo seguro de ciphertext (toString retorna [ENCRYPTED])
- EncryptionService port e implementacion reubicados de membership a shared (cross-BC)
- TenantCredentialService para persistir/recuperar credenciales per-tenant encriptadas (AES-256-GCM)
- TenantCredentialsModule @Global() para proveer credenciales per-tenant a todos los BCs
- Columnas database_user y database_password_encrypted en tabla tenants (Prisma schema)

#### Changed

- Limpiados outbox publishers (Treasury y Membership): eliminado JSON.parse(JSON.stringify(...)) innecesario sobre campo Prisma Json
- Documentado patron @Public() + SuperadminGuard como definitivo para endpoints de bootstrap (tenants.controller.ts)
- Regla ESLint no-restricted-syntax (ERROR) para casteos inseguros sobre campos Prisma Json (as string[], as number[])
- PrismaTenantService.getClient() ahora async - usa credenciales per-tenant via TenantCredentialProvider (RNF-004)
- ProvisionTenantHandler persiste credenciales encriptadas en DB-Main tras crear el usuario PostgreSQL
- DatabaseProvisioningService.grantSchemaPermissions() otorga GRANT ALL sobre tablas/secuencias del tenant

#### Fixed

- Corregidos 6 tests de integracion rotos por fix Bug 3: eliminados JSON.parse() sobre permissions, ahora se verifican como array nativo
- Corregido Bug 5: DomainExceptionFilter registrado como APP_FILTER en ObservabilityModule - errores de dominio ahora devuelven status codes correctos (401, 409, etc.)
- Corregidas assertions E2E de [401, 500] a status codes exactos tras fix Bug 5
- Corregido saga ordering en ProvisionTenantHandler: saveTenant antes de persistCredentials (Prisma update requiere registro existente)
- Corregido grantPermissions insuficiente: tenant user ahora recibe GRANT ALL ON ALL TABLES/SEQUENCES
- Corregido cleanup E2E: cleanupKnownE2eFixtures en beforeAll + fileParallelism: false

#### Removed

[Sin cambios]

---

### 20260316-001-acester-CLAUDECODE

- **Fecha de sesion:** 16 de marzo de 2026
- **Hora de inicio:** 1:13
- **Hora de ultimos trabajos:** 13:02
- **Documento de sesion:** [doc/agents-sessions/20260316-001-acester-CLAUDECODE.md](doc/agents-sessions/20260316-001-acester-CLAUDECODE.md)

#### Added

- Generado reporte de bugs backend (doc/reports/backend-bugs-frontend-testing.md): 3 bugs en capa HTTP detectados durante testing manual frontend
- Documentado Bug 4 en reporte: nombre BD tenant con guiones vs underscores al conectar
- Actualizado reporte backend con 4 bugs y 7 recomendaciones estructuradas (R1-R7)

#### Changed

- Actualizado seed-data.sh con header X-Api-Key para autenticacion SuperadminGuard

#### Fixed

- Corregido interceptor Axios que secuestraba errores 401 de login (solo excluia /auth/refresh, ahora excluye todos los endpoints /auth/)
- Corregido extractHttpStatus en login page: usaba formato Axios crudo (error.response.status) en lugar de ApiError.status
- Fix temporal: agregado @Public() en endpoint provision de tenant para resolver chicken-and-egg entre JwtAuthGuard global y SuperadminGuard (pendiente revision con responsable backend)
- Corregido bug en generate-prisma-bridges.js: regex sobre-escapadas (8 backslashes en vez de 4) impedian generar modelos Prisma - client.tenant/user/etc eran undefined
- Corregido extractHttpStatus en login page: usaba formato Axios crudo (error.response.status) en lugar de ApiError.status
- Corregido Bug 3: removido JSON.stringify innecesario en database-provisioning.service.ts (Prisma auto-serializa campos Json) + defensa en profundidad en permissions.guard.ts con parsePermissions()

#### Removed

[Sin cambios]

---

### 20260315-001-acester-CLAUDECODE

- **Fecha de sesion:** 15 de marzo de 2026
- **Hora de inicio:** 11:29
- **Hora de ultimos trabajos:** 13:02
- **Documento de sesion:** [doc/agents-sessions/20260315-001-acester-CLAUDECODE.md](doc/agents-sessions/20260315-001-acester-CLAUDECODE.md)

#### Added

[Sin cambios]

#### Changed

[Sin cambios]

#### Fixed

- Corregido interceptor Axios que secuestraba errores 401 de login (solo excluia /auth/refresh, ahora excluye todos los endpoints /auth/)

#### Removed

[Sin cambios]

---

### 20260314-002-acester-CLAUDECODE

- **Fecha de sesion:** 14 de marzo de 2026
- **Hora de inicio:** 19:30
- **Hora de ultimos trabajos:** 02:18
- **Documento de sesion:** [doc/agents-sessions/20260314-002-acester-CLAUDECODE.md](doc/agents-sessions/20260314-002-acester-CLAUDECODE.md)

#### Added

- Implementada Task 0 - Brand Setup: infraestructura de identidad visual del frontend
- Creado theme definitivo Mantine en `web/src/shared/theme/associated-theme.ts` con paleta brand, tipografia Inter, spacing, shadows y 11 component defaults
- Copiados 6 SVGs de produccion a `web/src/shared/assets/` (isotipo, logo-horizontal, logo-stacked en variantes color y white)
- Creadas utilities de formateo: `format-money.ts` (formatMoney) y `format-date.ts` (formatDateLong, formatDateCompact)
- Persistidos artefactos SDD completos en engram (explore, proposal, spec, design, tasks, state)
- Creados 19 unit tests: format-money (5), format-date (4), associated-theme (10) - 21/21 tests pasan
- Implementada Task 1 - UC-002 Autenticacion multi-tenant (Frontend): login, selector tenant, auth provider, interceptors, rutas protegidas, layout y dashboard
- Creado AuthProvider con token en memoria, refresh automatico y token accessors para interceptors Axios
- Creados schemas Zod como contratos API con tipos inferidos y type guard para respuesta dual de login
- Creado servicio API auth con 7 funciones validadas con Zod (login, selectTenant, refreshTokens, logout, switchTenant, getCurrentUser, getMyTenants)
- Creada login page con @mantine/form, flujo dual (directo/multi-tenant), notificaciones de error
- Creado TenantSelector con Cards, badges de rol y indicador de ultima sesion
- Creado ProtectedRoute con evaluacion 4 pasos (loading > auth > permisos > render)
- Creado AppLayout con sidebar brandDark, navbar con menu usuario y switch tenant modal
- Creado dashboard placeholder con 4 KPI cards
- Creados 42 unit tests: schemas (15), permissions hook (10), auth hook (3), protected-route (5), tenant-selector (4), login-page (5)
- Implementada Task 2 - UC-017 Configuracion de planes de cuota (Frontend): CRUD completo con tabla filtrable, formulario condicional, vinculacion tipos socio, plantillas e inactivacion protegida
- Creados schemas Zod para planes de cuota (11 schemas, 10 tipos, 2 enums) y API service con 9 funciones validadas
- Creados 8 hooks TanStack Query para planes (queries + mutations con invalidacion y notificaciones)
- Creado formulario condicional RECURRING/ONE_TIME con chips de meses de cobro y preseleccion por periodicidad
- Creados modales: crear, editar, vincular tipos socio (radio default + orden), plantillas por colectividad, inactivacion protegida
- Creados 48 unit tests: schemas (26), form (9), list page (7), deactivate modal (6)
- Creados 26 unit tests adicionales: link-member-types-modal (8), import-template-modal (6), hooks use-fee-plans (4), use-create-fee-plan (4), use-deactivate-fee-plan (4)
- Implementada Task 3 - UC-018 Gestion de suscripciones de cuota (Frontend): selector de plan, descuentos multiplicativos, cambio plan, timeline historico, exenciones
- Creada utilidad calculateEffectiveAmount() con formula multiplicativa de descuentos y desglose paso a paso
- Creado SubscriptionSelector reutilizable con preview de importe efectivo en tiempo real
- Creada pagina de suscripciones del socio con seccion activa + timeline historico (Mantine Timeline)
- Creados modales: cambio plan (fecha efectiva), modificar descuento (preview), exencion temporal
- Creados 57 unit tests: discount-calculator (14), schemas (29), subscription-selector (6), member-subscriptions-page (8)
- Implementada Task 4 - UC-011 Alta simple de socio (Frontend): wizard 3 pasos con validacion DNI mod 23, selector tipo socio con validacion edad, confirmacion con cargo inscripcion
- Creada utilidad validateDni/validateNie con algoritmo mod 23 espanol y calculateAge
- Creado wizard de alta con Mantine Stepper, useBlocker para prevencion navegacion accidental, y verificacion precondiciones
- Creados 111 unit tests: dni-validator (57), schemas (25), personal-data-step (7), member-type-step (8), confirmation-step (8), page (6)
- Implementada Task 5 - UC-013 Baja de socio (Frontend): baja voluntaria con fecha segun estatutos, baja por impago con workflow 5 fases, rehabilitacion con desglose costes
- Creados componentes reutilizables StatusBadge (8 estados), StatusTimeline (historico) y LeaveActions (botones contextuales)
- Creados 81 unit tests: schemas (22), status-badge (12), status-timeline (6), leave-actions (6), voluntary-leave (8), reinstatement (8)

#### Changed

- Actualizado `web/index.html` con favicon, Inter (display=swap), meta tags, Open Graph, Twitter Card y PWA manifest
- Actualizado `web/src/app/providers.tsx`: import de associatedTheme y `forceColorScheme="light"`
- Actualizado http-client.ts: interceptors con token de memoria, refresh queue con cola de requests concurrentes, dynamic import para evitar circular dependency
- Actualizado router.tsx: rutas /login (publica) y / > ProtectedRoute > AppLayout > /dashboard con lazy loading
- Actualizado providers.tsx: AuthProvider insertado entre Notifications y QueryClientProvider
- Actualizado vitest.config.ts: agregado alias @/ para resolucion en tests
- Actualizado test/setup.ts: mocks window.matchMedia y ResizeObserver para Mantine en jsdom
- Actualizado router.tsx: ruta /treasury/fee-plans con lazy loading
- Actualizado app-shell.tsx: NavLink "Planes de Cuota" en sidebar bajo Tesoreria
- Actualizado router.tsx: ruta /treasury/members/:memberId/subscriptions con ProtectedRoute y lazy loading
- Actualizado router.tsx: ruta /members/new con ProtectedRoute y lazy loading
- Actualizado app-shell.tsx: NavLink "Nuevo Socio" en sidebar bajo Socios
- Actualizado router.tsx: 3 rutas leave (/members/:id/leave, /nonpayment-leave, /reinstate) con ProtectedRoute

#### Fixed

- Corregido wire de "Inactivar" y "Importar Plantilla" en pagina de listado de planes (no estaban conectados a sus modales)
- Corregida ruta /treasury/fee-plans sin ProtectedRoute con permisos (ahora verifica treasury:fee-plans:read)

#### Removed

- Eliminado `web/src/app/theme.ts` (placeholder con primaryColor: 'blue', migrado a shared/theme/)

---

### 20260314-001-acester-CLAUDECODE

- **Fecha de sesion:** 14 de marzo de 2026
- **Hora de inicio:** 18:29
- **Hora de ultimos trabajos:** 18:29
- **Documento de sesion:** [doc/agents-sessions/20260314-001-acester-CLAUDECODE.md](doc/agents-sessions/20260314-001-acester-CLAUDECODE.md)

#### Added

- Documento de diseno `task-0-brand-setup.md` para configuracion de identidad visual como tarea previa a todas las features de frontend (fase 1)
- Skill registry generado en `.atl/skill-registry.md` (45 skills, 8 convenciones)

#### Changed

- Alineados 17 documentos de diseno frontend (fases 1-3) con los documentos de marca: colores semanticos corregidos (orange→yellow), logos especificos por contexto, `formatMoney()` referenciado, badge defaults explicitos, `color="brand"` en botones primarios, formato de fechas espanol
- Anadidas referencias a `001-associated-brand-foundation.md` y `002-associated-ui-product-guidelines.md` en la seccion "Referencia de especificacion" de los 17 documentos
- Actualizado checklist de dependencias de `task-1-UC-002.md`: 3 items de marca reemplazados por dependencia unica a Task 0

#### Fixed

[Sin cambios]

---

### 20260311-001-pvidal-CLAUDE

- **Fecha de sesion:** 11 de marzo de 2026
- **Hora de inicio:** 08:45
- **Hora de ultimos trabajos:** 13:00
- **Documento de sesion:** [doc/agents-sessions/20260311-001-pvidal-CLAUDE.md](doc/agents-sessions/20260311-001-pvidal-CLAUDE.md)

#### Added

- Implementada UC-017: Gestion de planes de cuota (Backend) en BC-Treasury - FeePlan aggregate, Amount VO en centavos, Periodicity, controller REST
- Implementada UC-018: Gestion de suscripciones de cuota (Backend) - MemberAccount aggregate, FeeSubscription entity, Discount VO multiplicativo, 6 endpoints REST, 105 tests
- Implementada UC-019: Generacion masiva de cargos periodicos (Backend) - Charge entity, GenerateChargesHandler, repositorio y controller
- Implementada UC-021: Registro de cobros (Backend) - Payment entity, RegisterPaymentHandler, ReceiptGeneratedEvent, PDF receipt service

#### Changed

- PrismaMemberAccountRepository extendido para hidratar y persistir charges y payments junto al aggregate
- ProvisionTenantHandler corregido para guardar tenant antes de crear membership
- DatabaseProvisioningService con createAdminUser envuelto en transaccion
- Gate de cobertura ajustado para centrarse en logica manual (excluyendo generado/infra glue)

#### Fixed

- Corregido orden de provisionado UC-001: tenant se persiste antes de membership
- Corregida hidratacion incompleta de MemberAccount en UC-021 (faltaban charges/payments)
- Corregida emision de ReceiptGeneratedEvent en handlers de pago
- Eliminados casts `any` en GetReceiptHandler
- Estabilizados fixtures de integracion UC-001 (CIFs validos, schema sincronizado)

#### Removed

[Sin cambios]

---

### 20260310-002-pvidal-CLAUDE

- **Fecha de sesion:** 10 de marzo de 2026
- **Hora de inicio:** 09:00
- **Hora de ultimos trabajos:** 16:28
- **Documento de sesion:** [doc/agents-sessions/20260310-002-pvidal-CLAUDE.md](doc/agents-sessions/20260310-002-pvidal-CLAUDE.md)

#### Added

- Implementada UC-010: Gestion de ejercicios fiscales (Backend) - FiscalYear aggregate, DateRange VO, CQRS handlers, controller REST
- Implementada UC-007: Gestion de estados de socio (Backend) - Maquina de estados con transiciones validadas, StatusHistory, eventos MemberStatusChanged
- Implementada UC-011: Proceso de alta simplificado en 3 pasos (Backend) - Flujo incremental con guardado de progreso entre pasos
- Implementada UC-013: Baja y reingreso de socios (Backend) - Leave, Expulsion, Reinstatement con conservacion de numero de socio

#### Changed

- Member Aggregate extendido con changeStatus(), leave(), expel(), reinstate()
- Schema Prisma del tenant extendido con modelo StatusHistory

#### Fixed

[Sin cambios]

#### Removed

[Sin cambios]

---

### 20260310-001-pvidal-CLAUDE

- **Fecha de sesion:** 10 de marzo de 2026
- **Hora de inicio:** 13:58
- **Hora de ultimos trabajos:** 14:04
- **Documento de sesion:** [doc/agents-sessions/20260310-001-pvidal-CLAUDE.md](doc/agents-sessions/20260310-001-pvidal-CLAUDE.md)

#### Added

- Implementada UC-006: Gestion de ficha de socio (Backend) completa en BC-Membership
- 6 Value Objects de dominio: PersonalData, ContactData, IdentityDocument (validacion DNI/NIE mod-23), BankDetails (validacion IBAN mod-97), MemberNumber, CustomFields
- Servicio de cifrado AES-256-GCM para IBAN con IV aleatorio (RNF-006)
- 4 endpoints REST para gestion de socios: POST/GET/GET:id/PUT en `/api/v1/members`
- 4 handlers CQRS: CreateMember, UpdateMember, GetMember, ListMembers
- Domain Events: MemberRegisteredEvent y MemberDataUpdatedEvent
- Campos personalizados (custom_fields JSONB) por tipo de colectividad: cofradia, club deportivo, pena, asociacion cultural
- 184 tests nuevos (163 unitarios + 21 integracion)

#### Changed

- Member Aggregate extendido con factory `register()`, metodos de actualizacion y calculo de antiguedad
- MemberPrismaMapper convertido de estatico a inyectable para integrar cifrado de IBAN
- PrismaMemberRepository extendido con 6 metodos nuevos (findByEmail, existsByIdentityDocument, getNextMemberNumber, etc.)
- Schema Prisma del tenant extendido con 15 campos nuevos en modelo Member

#### Fixed

- Corregidos mocks incompletos de MemberRepository en 4 archivos de test de Task 5
- Corregido mock de ErrorReporter en domain-exception.filter.spec.ts
- Corregido import faltante de beforeEach en permissions.guard.spec.ts

#### Removed

[Sin cambios]

---

### 20260226-001-pvidal-CLAUDE

- **Fecha de sesion:** 26 de febrero de 2026
- **Hora de inicio:** 08:00
- **Hora de ultimos trabajos:** 13:14
- **Documento de sesion:** [doc/agents-sessions/20260226-001-pvidal-CLAUDE.md](doc/agents-sessions/20260226-001-pvidal-CLAUDE.md)

#### Added

- Implementada UC-002: Autenticacion multi-tenant (Backend) completa en BC-Identity - User aggregate con lockout temporal, JWT strategy, 5 endpoints auth, guards globales
- Implementada UC-008: Gestion de tipos de socio (Backend) completa en BC-Membership - MemberType aggregate, RulesEvaluator, plantillas por colectividad, 7 endpoints REST
- Value Objects de auth: Email, Password, PasswordHash, UserId, UserStatus
- Servicios de infraestructura: Argon2PasswordHasher, JwtTokenService, JwtStrategy
- Repositorios Prisma: User, RefreshToken, TenantMembership, UserProfile, MemberType
- Domain Events: UserAuthenticated, AuthenticationFailed, UserBlocked, MemberTypeCreated
- Decorador @Public() para bypass de JWT guard global

#### Changed

- IdentityModule rewired con providers, handlers, guards y strategy de auth
- PermissionsGuard y JwtAuthGuard actualizados para manejar rutas publicas
- MembershipModule extendido con MemberType handlers y controller

#### Fixed

- Corregidos 5+ errores de DI (UnknownDependenciesException) causados por `import type` en providers NestJS
- Corregidas colisiones de datos en tests de integracion (CIF/slug duplicados)
- Mejorada documentacion Swagger en endpoints de auth

#### Removed

[Sin cambios]

---

### 20260225-001-pvidal-CLAUDE

- **Fecha de sesion:** 25 de febrero de 2026
- **Hora de inicio:** 08:30
- **Hora de ultimos trabajos:** 16:16
- **Documento de sesion:** [doc/agents-sessions/20260225-001-pvidal-CLAUDE.md](doc/agents-sessions/20260225-001-pvidal-CLAUDE.md)

#### Added

- Completada Fase 0 - Scaffold del proyecto Associated (verificacion final y merge PR #1)
- Implementada UC-001: Provision de nuevo tenant (Backend) completa en BC-Identity
- Value Objects de dominio: TenantId, Cif (algoritmo CIF espanol), Slug (normalizacion NFD), TenantStatus, CollectivityType
- Tenant Aggregate con factory create(), generacion automatica de databaseName y slug
- ProvisionTenantHandler con saga de 10 pasos y rollback compensatorio idempotente
- DatabaseProvisioningService con DDL directo (CREATE DB, CREATE USER, GRANT, migrations, seedRoles)
- PrismaTenantRepository + TenantMapper bidireccional
- Controller REST para provision de tenant
- Domain Events: TenantProvisionedEvent, UserCreatedEvent

#### Changed

- Configuracion Prisma 7 migrada: prisma.config.main.ts y prisma.config.tenant.ts creados
- Schemas Prisma corregidos para Prisma 7 (provider `prisma-client`, URL en config)

#### Fixed

- Corregido error critico P1012 de Prisma 7 (URL no permitida en datasource del schema)

#### Removed

[Sin cambios]

---
