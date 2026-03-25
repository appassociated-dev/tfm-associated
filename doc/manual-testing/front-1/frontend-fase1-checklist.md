# Checklist de Verificacion Manual - Frontend Fase 1

> **Fecha:** 15 de marzo de 2026
> **Branch:** mvp/frontend-fase1
> **Prerequisitos:** Docker Compose up, API running (localhost:3000), Frontend dev (localhost:5173)

## Prerequisitos

- [ ] Docker Compose levantado (`docker compose up -d`)
- [ ] PostgreSQL healthy
- [ ] API arrancada (`npm run -w api start:dev`) sin errores
- [ ] Frontend arrancado (`npm run -w web dev`) sin errores ni warnings de theme/imports
- [ ] Al menos 1 tenant provisionado con usuario admin
- [ ] Al menos 1 tipo de socio configurado (con rango de edad definido)
- [ ] Al menos 1 plan de cuota RECURRING configurado
- [ ] Al menos 1 plan de cuota ONE_TIME (inscripcion) configurado
- [ ] Ejercicio fiscal activo abierto
- [ ] Permisos seedeados: `membership:members:read`, `membership:members:create`, `membership:members:deactivate`, `membership:members:reinstate`, `treasury:fee-plans:read`, `treasury:fee-plans:create`, `treasury:fee-plans:update`, `treasury:subscriptions:read`, `treasury:subscriptions:create`, `treasury:subscriptions:update`

---

## Task 0 - Brand Setup

### T0-01 Identidad visual - Fuente Inter

- [ ] T0-01-01 La fuente Inter se carga correctamente (DevTools > Computed > font-family contiene "Inter")
- [ ] T0-01-02 La carga de Inter usa `display=swap` (no bloquea el render)
- [ ] T0-01-03 `<link rel="preconnect" href="https://fonts.googleapis.com" />` presente en `<head>`
- [ ] T0-01-04 `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />` presente en `<head>`
- [ ] T0-01-05 La URL de Google Fonts incluye pesos 400, 500, 600, 700

### T0-02 Identidad visual - Favicon y meta tags

- [ ] T0-02-01 El favicon SVG de Associated aparece en la pestana del navegador
- [ ] T0-02-02 Favicon PNG 96x96 referenciado en `<head>` (`favicon-96x96.png`)
- [ ] T0-02-03 Favicon ICO referenciado en `<head>` (`favicon.ico`)
- [ ] T0-02-04 Apple touch icon referenciado (`apple-touch-icon.png`, 180x180)
- [ ] T0-02-05 El titulo de la pestana es "Associated - Gestion para colectividades"
- [ ] T0-02-06 Meta description presente: "ERP ligero para asociaciones culturales..."
- [ ] T0-02-07 Meta theme-color es `#27343E`

### T0-03 Identidad visual - Open Graph y Twitter Card

- [ ] T0-03-01 `og:title` = "Associated - Gestion para colectividades"
- [ ] T0-03-02 `og:description` = "ERP ligero para asociaciones culturales, penas festeras, clubes deportivos y cofradias."
- [ ] T0-03-03 `og:image` = "/og-image.png"
- [ ] T0-03-04 `og:type` = "website"
- [ ] T0-03-05 `twitter:card` = "summary_large_image"
- [ ] T0-03-06 `twitter:title` presente
- [ ] T0-03-07 `twitter:description` presente
- [ ] T0-03-08 `twitter:image` = "/og-image.png"

### T0-04 Identidad visual - PWA

- [ ] T0-04-01 `<link rel="manifest" href="/site.webmanifest" />` presente en `<head>`
- [ ] T0-04-02 El webmanifest es accesible desde el navegador (`/site.webmanifest`)

### T0-05 Theme Mantine - Colores

- [ ] T0-05-01 Los botones primarios usan color brand (#5B7682), NO azul default de Mantine
- [ ] T0-05-02 `primaryColor` es `'brand'` (verificar en DevTools que el color aplicado es la paleta brand)
- [ ] T0-05-03 `primaryShade` es `{ light: 7, dark: 5 }`
- [ ] T0-05-04 `autoContrast: true` funciona (texto sobre botones brand es legible)
- [ ] T0-05-05 `theme.other.brandDark` es `#27343E` (verificar que el sidebar usa este token, no hex hardcodeado)
- [ ] T0-05-06 Ningun boton usa `variant="gradient"` (prohibido por directrices de marca)

### T0-06 Theme Mantine - Tipografia y espaciado

- [ ] T0-06-01 El radius por defecto de los componentes es "sm" (4px)
- [ ] T0-06-02 Los inputs y selects tienen bordes redondeados consistentes (radius sm)
- [ ] T0-06-03 Spacing xs=8, sm=12, md=16, lg=24, xl=32 (verificar con DevTools en margenes/paddings)
- [ ] T0-06-04 Headings usan la escala de tamanos definida en el brand
- [ ] T0-06-05 `focusRing: 'auto'` - los elementos focuseados muestran anillo de foco
- [ ] T0-06-06 `respectReducedMotion: true` - si el OS tiene "reduce motion", las transiciones se desactivan
- [ ] T0-06-07 `cursorType: 'pointer'` - los elementos interactivos muestran cursor pointer

### T0-07 Theme Mantine - Component defaults

- [ ] T0-07-01 Button: defaults de color brand aplicados
- [ ] T0-07-02 Paper: sombra y radius por defecto
- [ ] T0-07-03 Card: configuracion por defecto del brand
- [ ] T0-07-04 Badge: `variant="light"`, `radius="sm"` por defecto
- [ ] T0-07-05 TextInput: defaults aplicados
- [ ] T0-07-06 Select: defaults aplicados
- [ ] T0-07-07 Table: defaults aplicados
- [ ] T0-07-08 Notification: defaults aplicados
- [ ] T0-07-09 Modal: defaults aplicados
- [ ] T0-07-10 SegmentedControl: defaults aplicados
- [ ] T0-07-11 Skeleton: defaults aplicados

### T0-08 Assets de marca

- [ ] T0-08-01 `web/src/shared/assets/isotipo.svg` existe y se renderiza correctamente
- [ ] T0-08-02 `web/src/shared/assets/isotipo-white.svg` existe
- [ ] T0-08-03 `web/src/shared/assets/logo-horizontal.svg` existe
- [ ] T0-08-04 `web/src/shared/assets/logo-horizontal-white.svg` existe
- [ ] T0-08-05 `web/src/shared/assets/logo-stacked.svg` existe
- [ ] T0-08-06 `web/src/shared/assets/logo-stacked-white.svg` existe
- [ ] T0-08-07 `isotipo-hq.svg` NO existe en el codebase de produccion
- [ ] T0-08-08 Los SVGs se pueden importar con alias `@/shared/assets/`

### T0-09 Utilities de formateo

- [ ] T0-09-01 `formatMoney(34500)` devuelve `"345,00 €"` (verificar en consola o test)
- [ ] T0-09-02 `formatMoney(0)` devuelve `"0,00 €"`
- [ ] T0-09-03 `formatMoney(100)` devuelve `"1,00 €"`
- [ ] T0-09-04 `formatDateLong(new Date('2026-03-08'))` devuelve `"8 de marzo de 2026"`
- [ ] T0-09-05 `formatDateCompact(new Date('2026-03-08'))` devuelve `"08/03/2026"` (dd/MM/yyyy, NO formato anglosajon)

### T0-10 Providers y dark mode

- [ ] T0-10-01 `MantineProvider` usa `forceColorScheme="light"`
- [ ] T0-10-02 Con OS en dark mode, la aplicacion sigue mostrando light mode
- [ ] T0-10-03 `web/src/app/theme.ts` eliminado (migrado a `shared/theme/associated-theme.ts`)
- [ ] T0-10-04 `web/src/app/providers.tsx` importa `associatedTheme` correctamente

### T0-11 Alias de importacion

- [ ] T0-11-01 Alias `@/` apunta a `web/src/` en Vite config
- [ ] T0-11-02 Alias `@/` funciona en `tsconfig.json`
- [ ] T0-11-03 Importaciones tipo `@/shared/theme/associated-theme` resuelven correctamente

---

## Task 1 - UC-002 Autenticacion

### T1-01 Login page - Layout

- [ ] T1-01-01 La URL `/login` muestra la pagina de login
- [ ] T1-01-02 Layout centrado en pantalla
- [ ] T1-01-03 Titulo "Iniciar sesion" visible
- [ ] T1-01-04 El logo `logo-stacked.svg` (isotipo arriba + texto debajo) aparece centrado con ancho 120-140px
- [ ] T1-01-05 El logo no usa la variante HQ

### T1-02 Login page - Formulario

- [ ] T1-02-01 Campo email con label "Correo electronico" (TextInput, type email)
- [ ] T1-02-02 Campo password con label "Contrasena" (PasswordInput)
- [ ] T1-02-03 Toggle de visibilidad en campo password
- [ ] T1-02-04 Boton "Acceder" con `color="brand"`, no azul default
- [ ] T1-02-05 Boton "Acceder" NO usa `variant="gradient"`

### T1-03 Login page - Validaciones

- [ ] T1-03-01 Al intentar login con campos vacios: errores de validacion inline
- [ ] T1-03-02 Al intentar login con email invalido (sin @): error de formato inline
- [ ] T1-03-03 Al intentar login con password vacio: error de validacion inline

### T1-04 Login page - Errores de autenticacion

- [ ] T1-04-01 Credenciales incorrectas: notificacion roja "Credenciales incorrectas"
- [ ] T1-04-02 Cuenta bloqueada: notificacion amarilla (`color="yellow"`, shade 6 `#FAB005`) "Cuenta bloqueada temporalmente. Reintente en X minutos"
- [ ] T1-04-03 Sin backend / error de red: notificacion roja "Error de conexion. Verifique su conexion a internet"
- [ ] T1-04-04 Error 5xx del servidor: notificacion descriptiva (reportado via ErrorReporter)

### T1-05 Login page - Flujo exitoso

- [ ] T1-05-01 Login exitoso con 1 tenant: redirige directamente a `/dashboard`
- [ ] T1-05-02 Login exitoso con multiples tenants: muestra selector de tenant (no redirige automaticamente)
- [ ] T1-05-03 Boton "Acceder" muestra loading state durante el submit
- [ ] T1-05-04 Boton "Acceder" se deshabilita durante el submit (prevencion doble click)

### T1-06 Selector de tenant

- [ ] T1-06-01 Muestra cards con nombre de la colectividad
- [ ] T1-06-02 Muestra tipo de colectividad (Pena, Cofradia, Club, Asociacion)
- [ ] T1-06-03 Muestra rol del usuario en cada colectividad (badge)
- [ ] T1-06-04 Al seleccionar tenant: redirige a `/dashboard`
- [ ] T1-06-05 Indicador "Ultima sesion" en el tenant usado previamente (persistido en localStorage)

### T1-07 Dashboard - Layout general

- [ ] T1-07-01 Se muestra el AppShell completo (sidebar + navbar + contenido)
- [ ] T1-07-02 Titulo "Dashboard" visible
- [ ] T1-07-03 Nombre de la colectividad como subtitulo del dashboard
- [ ] T1-07-04 4 cards placeholder de KPIs con texto "Proximamente"

### T1-08 Dashboard - Sidebar

- [ ] T1-08-01 Sidebar con fondo `theme.other.brandDark` (`#27343E`) - verificar que no es hex hardcodeado
- [ ] T1-08-02 Logo horizontal blanco (`logo-horizontal-white.svg`) visible cuando sidebar abierto, ancho 140-160px
- [ ] T1-08-03 Isotipo blanco (`isotipo-white.svg`) visible cuando sidebar colapsado, ancho 28-32px
- [ ] T1-08-04 Logos usan color `#EAF7FE` (brand.0), no blanco puro
- [ ] T1-08-05 Ancho del sidebar: 240px en desktop
- [ ] T1-08-06 Link activo tiene fondo `rgba(255,255,255,0.1)` y borde izquierdo semitransparente
- [ ] T1-08-07 Links activos con texto al 100% opacidad
- [ ] T1-08-08 Links inactivos con texto al 60% opacidad
- [ ] T1-08-09 Labels de seccion (ej: "Tesoreria", "Socios") con opacidad 30%

### T1-09 Sidebar - Navegacion y permisos

- [ ] T1-09-01 Link "Dashboard" siempre visible (todos los roles)
- [ ] T1-09-02 Link "Socios" visible solo si tiene permiso `membership:members:read`
- [ ] T1-09-03 Link "Nuevo Socio" visible solo si tiene permiso `membership:members:create`
- [ ] T1-09-04 Link "Planes de Cuota" visible solo si tiene permiso `treasury:fee-plans:read`
- [ ] T1-09-05 Link "Tesoreria" visible solo si tiene permiso `treasury:*:read`
- [ ] T1-09-06 Link "Configuracion" visible solo si tiene permiso `settings:*:read`
- [ ] T1-09-07 Verificar con usuario sin permisos de tesoreria: links de tesoreria NO aparecen
- [ ] T1-09-08 Cada link verifica permisos con `usePermissions()`

### T1-10 Navbar (header)

- [ ] T1-10-01 Nombre de la colectividad actual (tenant) visible en la navbar
- [ ] T1-10-02 Menu de usuario (dropdown) al hacer click en avatar/nombre
- [ ] T1-10-03 Dropdown muestra nombre del usuario
- [ ] T1-10-04 Dropdown muestra rol actual (badge)
- [ ] T1-10-05 Dropdown muestra opcion "Cambiar colectividad" (solo si multiples tenants)
- [ ] T1-10-06 Dropdown muestra opcion "Cerrar sesion"

### T1-11 Proteccion de rutas

- [ ] T1-11-01 Acceder a `/dashboard` sin login: redirige a `/login`
- [ ] T1-11-02 Acceder a cualquier ruta protegida sin login: redirige a `/login`
- [ ] T1-11-03 Acceder a ruta protegida sin permiso requerido: muestra pagina 403
- [ ] T1-11-04 No hay flash de contenido protegido antes de verificar auth (loading/splash durante verificacion)
- [ ] T1-11-05 `isLoading` true durante verificacion inicial: renderiza spinner/skeleton, no contenido
- [ ] T1-11-06 Recargar pagina con sesion activa: NO pide login de nuevo (refresh token funciona)
- [ ] T1-11-07 Recargar pagina sin refresh token valido: redirige a `/login`

### T1-12 Logout

- [ ] T1-12-01 "Cerrar sesion" en menu de usuario redirige a `/login`
- [ ] T1-12-02 Tras logout, acceder a `/dashboard` redirige a `/login`
- [ ] T1-12-03 Tras logout, el access token se limpia de memoria
- [ ] T1-12-04 Tras logout, el refresh token se elimina de localStorage

### T1-13 Switch tenant

- [ ] T1-13-01 "Cambiar colectividad" en menu abre modal con lista de tenants
- [ ] T1-13-02 Modal reutiliza el componente `TenantSelector`
- [ ] T1-13-03 Al seleccionar otro tenant: datos de la UI se actualizan inmediatamente
- [ ] T1-13-04 Cache de React Query se limpia (`queryClient.clear()`) al cambiar tenant
- [ ] T1-13-05 Nombre del tenant en navbar se actualiza
- [ ] T1-13-06 Rol del usuario se actualiza al nuevo tenant
- [ ] T1-13-07 Permisos del sidebar se recalculan para el nuevo tenant
- [ ] T1-13-08 Redirige a `/dashboard` tras cambiar tenant

### T1-14 Refresh token y sesion

- [ ] T1-14-01 Access token almacenado en memoria (no en localStorage)
- [ ] T1-14-02 Refresh token almacenado en localStorage con key `associated_refresh_token`
- [ ] T1-14-03 Token expirado: refresh transparente sin interrumpir al usuario
- [ ] T1-14-04 Refresh fallido: redirige a `/login`
- [ ] T1-14-05 Peticiones concurrentes con 401: cola de refresh (solo 1 refresh simultaneo)
- [ ] T1-14-06 Timer de refresh automatico antes de expiracion (ej: 1 minuto antes)

### T1-15 Interceptors Axios

- [ ] T1-15-01 Header `Authorization: Bearer {token}` se anade automaticamente en requests autenticados
- [ ] T1-15-02 Header `X-Tenant-Id: {tenantId}` se anade automaticamente en requests autenticados
- [ ] T1-15-03 Errores 5xx se reportan via `ErrorReporter.captureException()`
- [ ] T1-15-04 ZodError en parseo de respuesta se reporta via `ErrorReporter.captureException()` con detalle

---

## Task 2 - UC-017 Planes de Cuota

### T2-01 Listado - Layout y datos

- [ ] T2-01-01 Navegar a `/treasury/fee-plans` muestra la pagina
- [ ] T2-01-02 Titulo "Planes de Cuota" visible
- [ ] T2-01-03 Badge con conteo total de planes (`variant="light"`, `radius="sm"`)
- [ ] T2-01-04 Boton "Nuevo Plan" visible con permiso `treasury:fee-plans:create` y color brand
- [ ] T2-01-05 Boton "Nuevo Plan" NO visible sin permiso `treasury:fee-plans:create`
- [ ] T2-01-06 Boton "Nuevo Plan" NO usa `variant="gradient"`

### T2-02 Listado - Tabla

- [ ] T2-02-01 Tabla con columnas: Codigo, Nombre, Tipo, Importe, Periodicidad, Estado, Acciones
- [ ] T2-02-02 Headers de tabla en `uppercase`, `fz="xs"`, `fw={600}`, `c="dimmed"`
- [ ] T2-02-03 Codigo mostrado como badge monospace (`variant="light"`, `radius="sm"`)
- [ ] T2-02-04 Importes alineados a la derecha (`textAlign: 'right'`)
- [ ] T2-02-05 Importes con `fontVariantNumeric: 'tabular-nums'` (digitos alineados verticalmente)
- [ ] T2-02-06 Importes formateados con `formatMoney()` - centavos a euros (ej: 34500 -> "345,00 EUR")
- [ ] T2-02-07 Badge tipo "Periodico" en verde (`variant="light"`, `radius="sm"`)
- [ ] T2-02-08 Badge tipo "Unica" en azul (`variant="light"`, `radius="sm"`)
- [ ] T2-02-09 Badge estado "Activo" en verde (`variant="light"`, `radius="sm"`)
- [ ] T2-02-10 Badge estado "Inactivo" en gris (`variant="light"`, `radius="sm"`)

### T2-03 Listado - Filtros y estados

- [ ] T2-03-01 Switch "Mostrar inactivos" visible
- [ ] T2-03-02 Con switch OFF: solo planes activos en la tabla
- [ ] T2-03-03 Con switch ON: planes activos e inactivos en la tabla
- [ ] T2-03-04 Estado vacio (sin planes): mensaje "No hay planes de cuota configurados" + boton "Crear primer plan" (`color="brand"`)
- [ ] T2-03-05 Loading: skeleton de tabla con 5 filas
- [ ] T2-03-06 Error de carga: alerta roja con boton de reintentar

### T2-04 Creacion de plan - Modal y campos basicos

- [ ] T2-04-01 Boton "Nuevo Plan" abre modal
- [ ] T2-04-02 Campo `code` (TextInput): auto-transformacion a mayusculas, 1-20 chars alfanumericos
- [ ] T2-04-03 Campo `name` (TextInput): requerido, 1-100 chars
- [ ] T2-04-04 Campo `description` (Textarea): opcional, max 500 chars
- [ ] T2-04-05 Campo `type` (SegmentedControl): opciones "Periodico" / "Cuota Unica"
- [ ] T2-04-06 Campo `amount` (NumberInput): precision 2 decimales, sufijo "EUR"
- [ ] T2-04-07 Importe se guarda en centavos (verificar que 15.00 EUR se envia como 1500 al backend)

### T2-05 Creacion de plan - Campos condicionales RECURRING

- [ ] T2-05-01 Seleccionar "Periodico": aparecen campos `frequency` y `billingMonths`
- [ ] T2-05-02 Seleccionar "Cuota Unica": desaparecen `frequency` y `billingMonths`
- [ ] T2-05-03 Campo `frequency` (Select): opciones Mensual, Trimestral, Semestral, Anual, Personalizada
- [ ] T2-05-04 Campo `billingMonths` (Chip.Group): 12 chips con meses del ano
- [ ] T2-05-05 Seleccionar frecuencia "Mensual": preselecciona meses [1,2,3,4,5,6,7,8,9,10,11,12]
- [ ] T2-05-06 Seleccionar frecuencia "Trimestral": preselecciona meses [1,4,7,10]
- [ ] T2-05-07 Seleccionar frecuencia "Semestral": preselecciona meses [1,7]
- [ ] T2-05-08 Seleccionar frecuencia "Anual": preselecciona mes [1]
- [ ] T2-05-09 Seleccionar frecuencia "Personalizada": sin preseleccion
- [ ] T2-05-10 Texto informativo "Se generaran X cargos al ano" refleja la cantidad de meses seleccionados
- [ ] T2-05-11 Meses seleccionables manualmente tras preseleccion (se pueden agregar/quitar)

### T2-06 Creacion de plan - Validaciones

- [ ] T2-06-01 Codigo vacio: error de validacion inline
- [ ] T2-06-02 Nombre vacio: error de validacion inline
- [ ] T2-06-03 Importe negativo: error de validacion inline (>= 0)
- [ ] T2-06-04 Plan RECURRING sin meses seleccionados: error de validacion inline "Seleccione al menos un mes"
- [ ] T2-06-05 Boton "Guardar" con `color="brand"` y loading state durante submit
- [ ] T2-06-06 Boton "Guardar" NO usa `variant="gradient"`

### T2-07 Creacion de plan - Resultado

- [ ] T2-07-01 Al guardar exitoso: modal se cierra
- [ ] T2-07-02 Al guardar exitoso: plan aparece en la tabla
- [ ] T2-07-03 Al guardar exitoso: notificacion verde "Plan creado - El plan de cuota se ha creado correctamente"
- [ ] T2-07-04 Codigo duplicado: notificacion roja "Codigo duplicado - Ya existe un plan con ese codigo. Pruebe con otro."
- [ ] T2-07-05 Plan periodico mensual con 12 meses se almacena correctamente
- [ ] T2-07-06 Plan trimestral con meses [9,12,3,6] (temporada no natural) se almacena correctamente
- [ ] T2-07-07 Plan de cuota unica sin periodicidad ni meses se crea correctamente
- [ ] T2-07-08 Importes no proporcionales permitidos (mensual 12EUR, trimestral 35EUR, anual 120EUR)

### T2-08 Edicion de plan

- [ ] T2-08-01 Menu acciones > "Editar" abre modal con datos precargados
- [ ] T2-08-02 Campo `code` es read-only en edicion (no editable)
- [ ] T2-08-03 Importe se muestra en euros (convertido desde centavos del backend)
- [ ] T2-08-04 Al guardar: notificacion verde de exito
- [ ] T2-08-05 Al guardar: tabla actualizada con los nuevos datos
- [ ] T2-08-06 Invalidacion de queries `['fee-plans']` y `['fee-plans', id]` en onSuccess

### T2-09 Vinculacion a tipos de socio

- [ ] T2-09-01 Menu acciones > "Ver vinculaciones" abre modal
- [ ] T2-09-02 Titulo "Vincular a Tipos de Socio"
- [ ] T2-09-03 Lista de todos los tipos de socio activos (obtenidos via API)
- [ ] T2-09-04 Columna checkbox para seleccionar/deseleccionar vinculacion
- [ ] T2-09-05 Columna codigo del tipo de socio
- [ ] T2-09-06 Columna nombre del tipo de socio
- [ ] T2-09-07 Columna "Es Default" con radio buttons (mutuamente exclusivo)
- [ ] T2-09-08 Solo un plan puede ser default por tipo de socio
- [ ] T2-09-09 Campo orden (NumberInput) por tipo para prioridad en UI de alta
- [ ] T2-09-10 Advertencia amarilla (`color="yellow"`) si un tipo ya tiene otro plan como default
- [ ] T2-09-11 Botones "Cancelar" y "Guardar vinculaciones" (`color="brand"`) con loading state
- [ ] T2-09-12 Al guardar: notificacion verde de exito

### T2-10 Inactivacion de plan

- [ ] T2-10-01 Menu acciones > "Inactivar" abre modal de confirmacion
- [ ] T2-10-02 Si tiene suscripciones activas: alerta amarilla (`color="yellow"`) "Este plan tiene X suscripciones activas. No puede eliminarse, pero si marcarse como inactivo."
- [ ] T2-10-03 Si no tiene suscripciones: permite inactivacion directa
- [ ] T2-10-04 Texto informativo: "El plan dejara de aparecer en los selectores de alta pero las suscripciones existentes no se veran afectadas"
- [ ] T2-10-05 Boton "Marcar como Inactivo" con `color="yellow"`
- [ ] T2-10-06 Al confirmar: plan pasa a inactivo, badge cambia a gris en la tabla
- [ ] T2-10-07 Error 422 (suscripciones activas bloqueando eliminacion): notificacion descriptiva

### T2-11 Plantillas predefinidas

- [ ] T2-11-01 Boton "Importar Plantilla" visible solo si no hay planes y tiene permiso create
- [ ] T2-11-02 Boton "Importar Plantilla" con `color="brand"`, NO `variant="gradient"`
- [ ] T2-11-03 Modal con selector de tipo de colectividad (Select: Pena, Cofradia, Club Deportivo, Asociacion Cultural)
- [ ] T2-11-04 Al seleccionar tipo: preview de planes a crear en tabla
- [ ] T2-11-05 Tabla preview con headers `uppercase`, `fz="xs"`, `fw={600}`, `c="dimmed"`
- [ ] T2-11-06 Importes de plantilla formateados con `formatMoney()`, `textAlign: 'right'`, `tabular-nums`
- [ ] T2-11-07 Texto informativo "Se crearan X planes de cuota con la configuracion estandar para [tipo]"
- [ ] T2-11-08 Advertencia amarilla si ya existen planes: "Ya hay planes configurados. Los nuevos se anadiran a los existentes"
- [ ] T2-11-09 Boton "Importar" (`color="brand"`) con loading state y confirmacion
- [ ] T2-11-10 Al importar: planes creados, notificacion verde, modal se cierra, queries invalidadas

---

## Task 3 - UC-018 Suscripciones

### T3-01 Pagina de suscripciones - Acceso y layout

- [ ] T3-01-01 Navegar a `/treasury/members/:id/subscriptions` muestra la pagina
- [ ] T3-01-02 Breadcrumb: "Tesoreria > Cuentas de Socio > [Nombre] > Suscripciones"
- [ ] T3-01-03 Loading: skeleton completo
- [ ] T3-01-04 Error de carga: alerta con boton reintentar

### T3-02 Suscripcion activa - Detalle completo

- [ ] T3-02-01 Si hay suscripcion activa: card con detalle visible
- [ ] T3-02-02 Nombre del plan visible
- [ ] T3-02-03 Codigo del plan como badge (`variant="light"`, `radius="sm"`)
- [ ] T3-02-04 Tipo del plan como badge (`variant="light"`, `radius="sm"`)
- [ ] T3-02-05 Desglose de descuentos: importe base (formateado con `formatMoney()`)
- [ ] T3-02-06 Desglose: descuento por tipo mostrado si aplica
- [ ] T3-02-07 Desglose: subtotal despues de dto tipo
- [ ] T3-02-08 Desglose: descuento personal mostrado si aplica
- [ ] T3-02-09 Desglose: importe efectivo final
- [ ] T3-02-10 Importes del desglose con `fontVariantNumeric: 'tabular-nums'`
- [ ] T3-02-11 Importe efectivo destacado (tamano grande, formateado con `formatMoney()`)
- [ ] T3-02-12 Fecha registro en formato largo ("8 de marzo de 2026")
- [ ] T3-02-13 Cargos generados / total cobrado mostrados

### T3-03 Suscripcion activa - Botones de accion

- [ ] T3-03-01 Botones de accion visibles con permiso `treasury:subscriptions:update`
- [ ] T3-03-02 Botones de accion NO visibles sin permiso update
- [ ] T3-03-03 Boton "Cambiar Plan" presente (`color="brand"`)
- [ ] T3-03-04 Boton "Modificar Descuento" presente (`color="brand"`)
- [ ] T3-03-05 Boton "Exencion Temporal" presente (`color="brand"`)

### T3-04 Sin suscripcion activa

- [ ] T3-04-01 Si NO hay suscripcion activa: texto "Sin suscripcion activa"
- [ ] T3-04-02 Boton "Crear Suscripcion" (`color="brand"`) visible con permiso `treasury:subscriptions:create`
- [ ] T3-04-03 Boton "Crear Suscripcion" NO visible sin permiso create
- [ ] T3-04-04 Si ya existe suscripcion periodica activa: boton de creacion deshabilitado, sugiere "Cambiar Plan"

### T3-05 Crear suscripcion - SubscriptionSelector

- [ ] T3-05-01 Cards por cada plan disponible para el tipo de socio
- [ ] T3-05-02 Cada card muestra: nombre del plan, tipo (badge), importe base (`formatMoney()`)
- [ ] T3-05-03 Importe con descuento por tipo aplicado automaticamente
- [ ] T3-05-04 Badge "Recomendado" (`variant="light"`, `radius="sm"`) en el plan default
- [ ] T3-05-05 Campo descuento personalizado (NumberInput, 0-99%)
- [ ] T3-05-06 Campo motivo del descuento personalizado obligatorio si descuento > 0 (Textarea, min 3 chars)
- [ ] T3-05-07 Preview en tiempo real del importe efectivo actualizado al cambiar descuento

### T3-06 Crear suscripcion - Desglose de descuentos

- [ ] T3-06-01 Desglose paso a paso visible:
  - Importe base: 120,00 EUR
  - Descuento tipo (30%): -36,00 EUR
  - Subtotal: 84,00 EUR
  - Descuento personal (10%): -8,40 EUR
  - Importe efectivo: 75,60 EUR
  - Descuento total: 37%
- [ ] T3-06-02 Formula MULTIPLICATIVA correcta: 120 _ 0.70 _ 0.90 = 75.60 EUR (NO 72 EUR aditivo)
- [ ] T3-06-03 Solo dto tipo (30%): 120 \* 0.70 = 84.00 EUR
- [ ] T3-06-04 Solo dto personal (20%): 120 \* 0.80 = 96.00 EUR
- [ ] T3-06-05 Sin descuentos: 120.00 EUR sin desglose
- [ ] T3-06-06 Dto tipo 50% + dto personal 50%: 120 _ 0.50 _ 0.50 = 30.00 EUR (NO 0 EUR)
- [ ] T3-06-07 Importes con `fontVariantNumeric: 'tabular-nums'` y `textAlign: 'right'`

### T3-07 Crear suscripcion - Validaciones

- [ ] T3-07-01 Descuento total combinado >= 100%: error de validacion (maximo 99%)
- [ ] T3-07-02 Descuento personal sin motivo: error de validacion
- [ ] T3-07-03 Error 409 al crear segunda suscripcion periodica activa: notificacion roja "Ya existe una suscripcion periodica activa. Cierrela primero o cambie de plan."
- [ ] T3-07-04 Al crear exitoso: notificacion verde "Suscripcion creada - La suscripcion se ha creado correctamente"
- [ ] T3-07-05 Queries de suscripciones invalidadas tras creacion

### T3-08 Cambio de plan

- [ ] T3-08-01 Boton "Cambiar Plan" abre modal
- [ ] T3-08-02 Seccion "Plan actual" con nombre e importe (`formatMoney()`)
- [ ] T3-08-03 Selector de nuevo plan (Select, filtrado por planes vinculados al tipo de socio)
- [ ] T3-08-04 Preview del nuevo importe efectivo con descuentos actuales (`formatMoney()`)
- [ ] T3-08-05 3 opciones de fecha efectiva (SegmentedControl):
  - "Inmediato (proximo cargo)"
  - "Inicio proximo mes"
  - "Inicio proximo ejercicio"
- [ ] T3-08-06 Alerta informativa: "Los cargos futuros del plan actual se cancelaran"
- [ ] T3-08-07 Si hay cargos pendientes: alerta amarilla (`color="yellow"`) con opciones de mantener o cancelar
- [ ] T3-08-08 Opcion "Cancelar cargos pendientes" solo visible con permiso `treasury:subscriptions:cancel-charges`
- [ ] T3-08-09 Botones "Cancelar" y "Confirmar Cambio" (`color="brand"`) con loading state
- [ ] T3-08-10 Al confirmar: suscripcion actual se cierra con motivo PLAN_CHANGE
- [ ] T3-08-11 Al confirmar: nueva suscripcion creada con nuevo plan

### T3-09 Modificar descuento

- [ ] T3-09-01 Boton "Modificar Descuento" abre modal
- [ ] T3-09-02 Muestra descuento actual desglosado (por tipo + personalizado)
- [ ] T3-09-03 Campo nuevo descuento personalizado (NumberInput, 0-99%)
- [ ] T3-09-04 Campo motivo obligatorio (Textarea, min 3 chars)
- [ ] T3-09-05 Campo "Aprobado por" obligatorio (TextInput, ej: "Junta Directiva 15/03/2026")
- [ ] T3-09-06 Preview en tiempo real del nuevo importe efectivo con desglose (`formatMoney()`, `tabular-nums`)
- [ ] T3-09-07 Alerta informativa: "Los cargos ya generados mantienen su importe original. Solo los cargos futuros usaran el nuevo descuento."
- [ ] T3-09-08 Validacion: descuento combinado >= 100% rechazado
- [ ] T3-09-09 Botones "Cancelar" y "Guardar" (`color="brand"`) con loading state

### T3-10 Exencion temporal

- [ ] T3-10-01 Boton "Exencion Temporal" abre modal
- [ ] T3-10-02 Selector tipo exencion:
  - "Exencion total (sin suscripcion)" - cierra suscripcion con motivo EXEMPTION
  - "Exencion con trazabilidad (descuento 100%)" - modifica descuento
- [ ] T3-10-03 Campo motivo (Textarea, requerido)
- [ ] T3-10-04 Periodo de exencion: fecha inicio / fecha fin (DatePicker, formato compacto dd/MM/yyyy)
- [ ] T3-10-05 Campo "Aprobado por" (TextInput)
- [ ] T3-10-06 Alerta informativa: "No se generaran cargos durante el periodo de exencion"
- [ ] T3-10-07 Botones "Cancelar" y "Aplicar Exencion" (`color="brand"`) con loading state

### T3-11 Historico de suscripciones

- [ ] T3-11-01 Timeline (Mantine Timeline) con suscripciones cerradas visible debajo de la activa
- [ ] T3-11-02 Cada entrada muestra: periodo (formato compacto "dd/MM/yyyy"), plan, importe efectivo (`formatMoney()`)
- [ ] T3-11-03 Motivo de cierre como badge (PLAN_CHANGE, MEMBER_LEAVE, EXEMPTION, ONE_TIME_COMPLETED)
- [ ] T3-11-04 Entradas expandibles: al expandir muestra desglose de descuentos
- [ ] T3-11-05 Al expandir: cargos generados y total cobrado (`formatMoney()`, `tabular-nums`)
- [ ] T3-11-06 Si no hay suscripciones cerradas: seccion de historico oculta o mensaje "Sin historial"

---

## Task 4 - UC-011 Alta de Socio

### T4-01 Wizard - Layout general

- [ ] T4-01-01 Navegar a `/members/new` muestra el wizard
- [ ] T4-01-02 Stepper con 3 pasos visibles: "Datos Personales", "Tipo de Socio", "Confirmacion"
- [ ] T4-01-03 Paso 1 con icono de usuario
- [ ] T4-01-04 Paso 2 con icono de categoria
- [ ] T4-01-05 Paso 3 con icono de check
- [ ] T4-01-06 Progress bar visual del wizard

### T4-02 Wizard - Navegacion

- [ ] T4-02-01 Boton "Siguiente" deshabilitado hasta que el paso actual sea valido
- [ ] T4-02-02 Boton "Anterior" navega al paso previo sin perder datos
- [ ] T4-02-03 Boton "Anterior" con `variant="default"`
- [ ] T4-02-04 Boton "Siguiente" con `color="brand"`, NO `variant="gradient"`
- [ ] T4-02-05 Intentar navegar fuera del wizard: confirmacion de salida (`useBlocker` de React Router)
- [ ] T4-02-06 `beforeunload` event para advertir al cerrar pestana con datos sin guardar

### T4-03 Wizard - Precondiciones

- [ ] T4-03-01 Sin ejercicio activo abierto (FE-5): alerta bloqueante "No hay ejercicio abierto. Abra el ejercicio actual primero." con link a gestion de ejercicios
- [ ] T4-03-02 Sin tipos de socio configurados: alerta bloqueante con link a configuracion de tipos
- [ ] T4-03-03 Sin plan de inscripcion (UNICA): alerta bloqueante "Debe configurar un plan de cuota de inscripcion" con link a configuracion de planes (verificado en paso 3)

### T4-04 Paso 1 - Datos personales - Campos obligatorios

- [ ] T4-04-01 Campo `dni` (TextInput): obligatorio, max 20 chars
- [ ] T4-04-02 Campo `firstName` (TextInput): obligatorio, max 100 chars
- [ ] T4-04-03 Campo `lastName` (TextInput): obligatorio, max 200 chars
- [ ] T4-04-04 Campo `birthDate` (DateInput): obligatorio, fecha maxima = hoy
- [ ] T4-04-05 Campo `email` (TextInput, type email): obligatorio
- [ ] T4-04-06 Formato fecha de nacimiento: dd/MM/yyyy (NUNCA formato anglosajon)

### T4-05 Paso 1 - Datos personales - Campos opcionales

- [ ] T4-05-01 Campo `phone` (TextInput): opcional, max 20 chars
- [ ] T4-05-02 Campo `address` (TextInput): opcional, max 300 chars
- [ ] T4-05-03 Campo `postalCode` (TextInput): opcional, solo 5 digitos
- [ ] T4-05-04 Campo `city` (TextInput): opcional, max 100 chars

### T4-06 Paso 1 - Validacion DNI/NIE

- [ ] T4-06-01 DNI valido (ej: 12345678Z): check verde al perder foco
- [ ] T4-06-02 DNI con letra incorrecta (ej: 12345678A): error de formato inline
- [ ] T4-06-03 NIE valido (ej: X1234567L): check verde al perder foco
- [ ] T4-06-04 NIE con prefijo invalido (ej: A1234567L): error de formato
- [ ] T4-06-05 DNI vacio: error "DNI/NIE es obligatorio"
- [ ] T4-06-06 Algoritmo mod 23 para DNI: validacion client-side correcta
- [ ] T4-06-07 NIE: conversion X->0, Y->1, Z->2 para calculo de letra de control

### T4-07 Paso 1 - Verificacion unicidad DNI

- [ ] T4-07-01 Consulta debounced (500ms) al backend via `check-dni`
- [ ] T4-07-02 Indicador spinner mientras consulta al backend
- [ ] T4-07-03 Indicador check verde si DNI disponible
- [ ] T4-07-04 Indicador X roja si DNI duplicado
- [ ] T4-07-05 DNI existente: alerta roja con datos del socio existente ("Ya existe un socio con DNI 12345678A (Juan Garcia, #00142). Es una reactivacion?")
- [ ] T4-07-06 Consulta solo se ejecuta si DNI tiene al menos 8 caracteres

### T4-08 Paso 1 - Otras validaciones

- [ ] T4-08-01 Fecha nacimiento: muestra edad calculada "(30 anos)"
- [ ] T4-08-02 Email invalido: error de formato inline
- [ ] T4-08-03 Codigo postal con caracteres no numericos: error de formato
- [ ] T4-08-04 No permite avanzar al paso 2 con campos obligatorios vacios
- [ ] T4-08-05 No permite avanzar al paso 2 con errores de validacion

### T4-09 Paso 2 - Tipo de socio

- [ ] T4-09-01 Cards con todos los tipos de socio activos
- [ ] T4-09-02 Cada card muestra: nombre del tipo (titulo)
- [ ] T4-09-03 Cada card muestra: rango de edad (si definido): "Edad: 35+ anos" o "Edad: 18-34 anos"
- [ ] T4-09-04 Cada card muestra: derechos como badges: "Voto" (`color="green"`, `variant="light"`, `radius="sm"`) y "Elegible para cargos" (`color="blue"`, `variant="light"`, `radius="sm"`)
- [ ] T4-09-05 Cada card muestra: descripcion del tipo
- [ ] T4-09-06 Cards funcionan como radio buttons visuales (solo uno seleccionable)
- [ ] T4-09-07 Loading: skeleton de 3 tarjetas
- [ ] T4-09-08 Error de carga: alerta con reintentar

### T4-10 Paso 2 - Validacion de edad

- [ ] T4-10-01 Al seleccionar tipo compatible con edad del aspirante: indicador verde "Edad compatible"
- [ ] T4-10-02 Al seleccionar tipo incompatible: alerta amarilla (`color="yellow"`) con mensaje descriptivo (ej: "El aspirante tiene 30 anos, pero 'Adulto' requiere 35+ anos")
- [ ] T4-10-03 Tipos incompatibles con la edad: opacidad reducida
- [ ] T4-10-04 Sugerencia: resalta tipos compatibles con la edad del aspirante
- [ ] T4-10-05 No permite continuar si tipo seleccionado es incompatible con la edad

### T4-11 Paso 3 - Confirmacion - Resumen

- [ ] T4-11-01 Tarjeta de resumen con todos los datos del aspirante
- [ ] T4-11-02 Nombre completo visible
- [ ] T4-11-03 DNI visible
- [ ] T4-11-04 Fecha nacimiento + edad en formato largo ("8 de marzo de 2026", "(30 anos)")
- [ ] T4-11-05 Email visible
- [ ] T4-11-06 Tipo de socio seleccionado visible
- [ ] T4-11-07 Fecha de alta (hoy) visible
- [ ] T4-11-08 Fechas en formato largo (NUNCA formato anglosajon)

### T4-12 Paso 3 - Confirmacion - Cargo de inscripcion

- [ ] T4-12-01 Seccion "Cargos a generar" visible
- [ ] T4-12-02 Checkbox marcado por defecto (no editable): "Cuota de inscripcion: XXX,XX EUR (UNICA)"
- [ ] T4-12-03 Importe formateado con `formatMoney()` (centavos a euros)
- [ ] T4-12-04 Si no hay plan de inscripcion (FE-4): alerta roja bloqueante con link a configuracion de planes

### T4-13 Paso 3 - Confirmacion - Seccion informativa

- [ ] T4-13-01 Seccion "Al confirmar" con textos informativos:
  - "Se creara el socio en estado Activo"
  - "Se generara cargo de inscripcion"
  - "Se asignara numero de socio automaticamente"

### T4-14 Paso 3 - Confirmacion - Submit

- [ ] T4-14-01 Boton "Confirmar Alta" (`color="brand"`, NO `variant="gradient"`)
- [ ] T4-14-02 Boton muestra loading state durante submit
- [ ] T4-14-03 Boton se deshabilita durante submit (prevencion doble-click)
- [ ] T4-14-04 Error 409 (DNI duplicado): notificacion roja "Ya existe un socio con ese DNI. Es una reactivacion?"
- [ ] T4-14-05 Error 422 (datos invalidos): notificacion roja con detalle del error
- [ ] T4-14-06 Error 412 (sin ejercicio abierto): alerta bloqueante

### T4-15 Paso 3 - Confirmacion - Exito

- [ ] T4-15-01 Modal de exito con datos del socio creado
- [ ] T4-15-02 Numero de socio asignado visible (ej: #00343)
- [ ] T4-15-03 Cargo de inscripcion generado (pendiente) con importe (`formatMoney()`)
- [ ] T4-15-04 Boton "Dar de alta otro socio" (`color="brand"`): resetea wizard completo
- [ ] T4-15-05 Boton "Ver ficha del socio" (`color="brand"`): navega a detalle del socio
- [ ] T4-15-06 Queries de members invalidadas tras alta exitosa

---

## Task 5 - UC-013 Baja de Socio

### T5-01 Baja voluntaria - Layout y datos del socio

- [ ] T5-01-01 Pagina `/members/:id/leave` carga correctamente
- [ ] T5-01-02 Breadcrumb: "Socios > [Nombre del socio] > Baja Voluntaria"
- [ ] T5-01-03 Nombre del socio visible
- [ ] T5-01-04 Numero de socio visible
- [ ] T5-01-05 DNI visible
- [ ] T5-01-06 Estado actual mostrado con StatusBadge (color correcto)

### T5-02 Baja voluntaria - Proteccion de estado

- [ ] T5-02-01 Si estado actual permite baja voluntaria: formulario completo visible
- [ ] T5-02-02 Si estado NO permite baja: alerta roja "Este socio no puede darse de baja desde el estado actual"
- [ ] T5-02-03 Si estado no permite baja: muestra transiciones disponibles como alternativas
- [ ] T5-02-04 Solo accesible con permiso `membership:members:deactivate`

### T5-03 Baja voluntaria - Fecha efectiva

- [ ] T5-03-01 Radio Group con opciones de fecha efectiva segun estatutos del tenant
- [ ] T5-03-02 Opcion "Baja inmediata ([fecha])" - efectiva hoy
- [ ] T5-03-03 Opcion "Baja a fin de ejercicio ([fecha])" - efectiva 31/12/YYYY
- [ ] T5-03-04 Opcion "Baja tras preaviso de 30 dias ([fecha])" - efectiva hoy + 30 dias
- [ ] T5-03-05 Cada opcion muestra la fecha efectiva calculada (formato largo o compacto dd/MM/yyyy, NUNCA anglosajon)

### T5-04 Baja voluntaria - Impacto financiero

- [ ] T5-04-01 Alerta informativa: amarilla (`color="yellow"`) si hay deuda, verde si no hay
- [ ] T5-04-02 Tabla de suscripciones activas que se cerraran: plan, importe efectivo, periodicidad
- [ ] T5-04-03 Tabla de cargos pendientes que se mantienen: descripcion, importe, fecha vencimiento
- [ ] T5-04-04 Todos los importes formateados con `formatMoney()` (centavos a euros)
- [ ] T5-04-05 Total deuda pendiente destacado (tamano grande)
- [ ] T5-04-06 Total deuda en rojo si > 0
- [ ] T5-04-07 Nota: "Los cargos pendientes se mantienen como deuda"
- [ ] T5-04-08 Nota: "No se generaran nuevos cargos futuros"
- [ ] T5-04-09 Si endpoint `leave-summary` falla: alerta "Estado de cuotas temporalmente no disponible" con opcion reintentar
- [ ] T5-04-10 Boton "Confirmar" bloqueado si leave-summary no cargo

### T5-05 Baja voluntaria - Motivo y confirmacion

- [ ] T5-05-01 Campo motivo (Textarea, obligatorio, min 3 chars, max 500)
- [ ] T5-05-02 No permite confirmar sin motivo
- [ ] T5-05-03 Boton "Confirmar Baja Voluntaria" con `color="red"`, NO `variant="gradient"`
- [ ] T5-05-04 Boton muestra loading state durante submit

### T5-06 Baja voluntaria - Confirmacion doble paso

- [ ] T5-06-01 Al pulsar "Confirmar Baja Voluntaria": modal de confirmacion aparece
- [ ] T5-06-02 Modal muestra resumen: "Se dara de baja al socio [Nombre] (#XXXXX) con fecha efectiva [fecha]"
- [ ] T5-06-03 Modal muestra: "Esta accion cerrara X suscripciones activas"
- [ ] T5-06-04 Modal muestra: "Los cargos pendientes (XXX,XX EUR) se mantienen" (`formatMoney()`)
- [ ] T5-06-05 Boton "Confirmar" (rojo) y "Cancelar" en el modal
- [ ] T5-06-06 Al confirmar: notificacion verde con fecha efectiva y suscripciones cerradas
- [ ] T5-06-07 Al confirmar: estado del socio cambia (verificar con StatusBadge)
- [ ] T5-06-08 Error 422 (transicion no permitida): notificacion roja "No se puede procesar la baja desde el estado actual."

### T5-07 Baja por impago - Layout

- [ ] T5-07-01 Pagina `/members/:id/nonpayment-leave` carga correctamente
- [ ] T5-07-02 Solo accesible con permiso `membership:members:deactivate`
- [ ] T5-07-03 Solo accesible si el socio cumple condiciones del workflow de morosidad

### T5-08 Baja por impago - Timeline de fases

- [ ] T5-08-01 Timeline de fases del workflow de morosidad (5 fases)
- [ ] T5-08-02 Fase 1 (90 dias): Primera notificacion [fecha]
- [ ] T5-08-03 Fase 2 (180 dias): Segunda notificacion [fecha]
- [ ] T5-08-04 Fase 3 (365 dias): Aviso de expediente [fecha]
- [ ] T5-08-05 Fase 4 (730 dias): Certificado de descubierto [fecha]
- [ ] T5-08-06 Fase 5: Baja efectiva [pendiente]
- [ ] T5-08-07 Si no todas las fases completas: alerta "El workflow de morosidad no esta completo. Faltan X fases."

### T5-09 Baja por impago - Certificado y acciones

- [ ] T5-09-01 Preview del certificado de descubierto con datos del socio
- [ ] T5-09-02 Deuda detallada (cargos, importes, fechas) en el preview
- [ ] T5-09-03 Fechas de notificaciones enviadas en el preview
- [ ] T5-09-04 Boton "Generar Certificado PDF" (`color="brand"`, NO `variant="gradient"`)
- [ ] T5-09-05 Boton "Cancelar Baja - Regularizacion" (`color="brand"`) si socio paga antes del plazo
- [ ] T5-09-06 Al regularizar: confirmar que el proceso se cancela y socio vuelve a ACTIVO

### T5-10 Baja por impago - Confirmacion

- [ ] T5-10-01 Boton "Ejecutar Baja por Impago" con `color="red"`, NO `variant="gradient"`
- [ ] T5-10-02 Confirmacion de doble paso (modal con resumen de impacto)
- [ ] T5-10-03 Al confirmar: estado del socio cambia a NONPAYMENT_LEAVE

### T5-11 Rehabilitacion - Acceso y datos

- [ ] T5-11-01 Pagina `/members/:id/reinstate` carga correctamente
- [ ] T5-11-02 Solo accesible si estado es VOLUNTARY_LEAVE o NONPAYMENT_LEAVE
- [ ] T5-11-03 Si estado es DISCIPLINARY_LEAVE o DECEASED: alerta "Este socio no puede rehabilitarse"
- [ ] T5-11-04 Solo accesible con permiso `membership:members:reinstate`
- [ ] T5-11-05 Datos del ex-socio: nombre, numero
- [ ] T5-11-06 Fecha de baja visible (formato largo)
- [ ] T5-11-07 Tipo de baja visible (StatusBadge)

### T5-12 Rehabilitacion - Desglose de importe

- [ ] T5-12-01 Tabla desglosada (Mantine Table) con:
  - Deuda pendiente: XXX,XX EUR
  - Penalizacion: XXX,XX EUR (si aplica segun estatutos)
  - Nueva inscripcion: XXX,XX EUR (si aplica)
  - **Total a pagar: XXX,XX EUR** (destacado)
- [ ] T5-12-02 Todos los importes formateados con `formatMoney()` (centavos a euros)
- [ ] T5-12-03 Importes con `fontVariantNumeric: 'tabular-nums'` y `textAlign: 'right'`
- [ ] T5-12-04 Alerta amarilla (`color="yellow"`): "El pago debe ser completo. No se permiten pagos parciales." (FE-3)

### T5-13 Rehabilitacion - Antiguedad

- [ ] T5-13-01 Si `keepSeniority = true`: "Se recuperara la antiguedad anterior (XX meses)"
- [ ] T5-13-02 Si `keepSeniority = false`: "La antiguedad comenzara desde la fecha de rehabilitacion"

### T5-14 Rehabilitacion - Confirmacion

- [ ] T5-14-01 Checkbox: "Confirmo que el pago de XXX,XX EUR ha sido recibido" (obligatorio, `formatMoney()`)
- [ ] T5-14-02 Boton "Rehabilitar Socio" (`color="green"`, NO `variant="gradient"`)
- [ ] T5-14-03 Boton deshabilitado hasta que checkbox este marcado
- [ ] T5-14-04 Boton muestra loading state durante submit
- [ ] T5-14-05 Al confirmar exitoso: notificacion de exito
- [ ] T5-14-06 Al confirmar exitoso: redirige a ficha del socio
- [ ] T5-14-07 Error de pago incompleto (FE-3): notificacion de error

### T5-15 StatusBadge - Mapeo de colores

- [ ] T5-15-01 ACTIVE: `color="green"`, `variant="light"` -> badge verde claro
- [ ] T5-15-02 APPLICANT: `color="blue"`, `variant="light"` -> badge azul claro
- [ ] T5-15-03 PENDING_PAYMENT: `color="yellow"`, `variant="light"` -> badge amarillo claro
- [ ] T5-15-04 SUSPENDED: `color="red"`, `variant="light"` -> badge rojo claro
- [ ] T5-15-05 VOLUNTARY_LEAVE: `color="gray"`, `variant="light"` -> badge gris claro
- [ ] T5-15-06 NONPAYMENT_LEAVE: `color="red"`, `variant="filled"` -> badge rojo solido (diferente de SUSPENDED)
- [ ] T5-15-07 DISCIPLINARY_LEAVE: `color="dark"`, `variant="light"` -> badge oscuro claro
- [ ] T5-15-08 DECEASED: `color="dark"`, `variant="filled"` -> badge oscuro solido
- [ ] T5-15-09 Todos los badges con `radius="sm"` (default de marca)

### T5-16 StatusTimeline - Historial de estados

- [ ] T5-16-01 Timeline (Mantine Timeline) con entradas de historial de estados
- [ ] T5-16-02 Entradas ordenadas cronologicamente (mas reciente arriba)
- [ ] T5-16-03 Cada entrada muestra: icono de color segun el nuevo estado
- [ ] T5-16-04 Cada entrada muestra: fecha formateada (formato largo o compacto, NUNCA anglosajon)
- [ ] T5-16-05 Cada entrada muestra: transicion "Estado anterior -> Estado nuevo"
- [ ] T5-16-06 Cada entrada muestra: motivo del cambio
- [ ] T5-16-07 Cada entrada muestra: quien ejecuto el cambio (nombre o "Sistema")
- [ ] T5-16-08 Badge diferenciado para cambios automaticos ("Sistema") vs manuales
- [ ] T5-16-09 Badges con `variant="light"` y `radius="sm"` (defaults de marca)

### T5-17 LeaveActions - Acciones contextuales

- [ ] T5-17-01 Si socio puede darse de baja (transicion a VOLUNTARY_LEAVE disponible): boton "Procesar Baja Voluntaria" (`color="red"`, `variant="outline"`, icono `IconUserMinus`)
- [ ] T5-17-02 Boton de baja voluntaria enlaza a `/members/:id/leave`
- [ ] T5-17-03 Si socio en estado terminal rehabilitable (VOLUNTARY_LEAVE o NONPAYMENT_LEAVE): boton "Rehabilitar Socio" (`color="green"`, icono `IconUserPlus`)
- [ ] T5-17-04 Boton de rehabilitacion enlaza a `/members/:id/reinstate`
- [ ] T5-17-05 Si socio en estado terminal inmutable (DISCIPLINARY_LEAVE, DECEASED): texto "Este socio esta dado de baja de forma permanente"
- [ ] T5-17-06 Si socio en PENDING_PAYMENT y usuario es tesorero: boton "Procesar Baja por Impago" (`color="yellow"`)
- [ ] T5-17-07 Acciones ocultas si no tiene permisos correspondientes

---

## Cross-cutting

### CC-01 Responsive

- [ ] CC-01-01 Login page se adapta a mobile (< 768px)
- [ ] CC-01-02 Sidebar colapsa en < 768px (breakpoint `sm`)
- [ ] CC-01-03 Burger aparece en mobile para toggle sidebar
- [ ] CC-01-04 Logo cambia a isotipo cuando sidebar colapsado (mobile)
- [ ] CC-01-05 Tablas scroll horizontal en mobile (no se recortan columnas)
- [ ] CC-01-06 Modales se adaptan a pantallas pequenas (max-width responsive)
- [ ] CC-01-07 Wizard stepper se adapta a mobile
- [ ] CC-01-08 Cards de selector de tenant se apilan en mobile

### CC-02 Accesibilidad basica

- [ ] CC-02-01 Todos los inputs tienen labels asociados (for/htmlFor o wrapping)
- [ ] CC-02-02 Botones y links son focuseables por teclado (Tab)
- [ ] CC-02-03 Errores de formulario anunciados (aria-describedby o aria-live)
- [ ] CC-02-04 Contraste de colores aceptable en botones brand sobre fondo blanco
- [ ] CC-02-05 Contraste de texto en sidebar (blanco sobre brandDark)
- [ ] CC-02-06 Formularios navegables completamente con teclado (Tab, Enter, Escape)
- [ ] CC-02-07 Modales trampean el foco (focus trap)

### CC-03 Performance

- [ ] CC-03-01 Dashboard carga en < 2 segundos (RNFT-017)
- [ ] CC-03-02 No hay flash de contenido protegido antes de verificar auth
- [ ] CC-03-03 Lazy loading funciona (bundles separados visibles en Network tab de DevTools)
- [ ] CC-03-04 Fuente Inter no bloquea el render (`display=swap`)
- [ ] CC-03-05 Imagenes SVG de logos se cargan sin errores 404

### CC-04 Errores y edge cases

- [ ] CC-04-01 Cualquier error 5xx muestra notificacion descriptiva en la UI
- [ ] CC-04-02 Errores 5xx se reportan via `ErrorReporter.captureException()`
- [ ] CC-04-03 Perder conexion durante una operacion: notificacion de error de red
- [ ] CC-04-04 Token expirado: refresh transparente sin interrumpir al usuario
- [ ] CC-04-05 Refresh token expirado: redirige a login
- [ ] CC-04-06 Doble click en botones de submit: solo se ejecuta 1 vez (en TODOS los formularios)
- [ ] CC-04-07 ZodError en parseo de respuesta: reportado via ErrorReporter con detalle de campos fallidos
- [ ] CC-04-08 Errores de negocio (409, 422): notificaciones claras, NO reportados al ErrorReporter

### CC-05 Formateo de datos consistente

- [ ] CC-05-01 Todos los importes en la app usan `formatMoney()` (centavos a euros con separador decimal coma)
- [ ] CC-05-02 Todas las fechas largas usan `formatDateLong()` - "8 de marzo de 2026"
- [ ] CC-05-03 Todas las fechas compactas usan `formatDateCompact()` - "08/03/2026" (dd/MM/yyyy)
- [ ] CC-05-04 NUNCA se muestra formato de fecha anglosajon (MM/dd/yyyy o yyyy-MM-dd en UI)
- [ ] CC-05-05 Todas las columnas de importes en tablas: `tabular-nums`, `textAlign: 'right'`
- [ ] CC-05-06 Todos los headers de tabla: `uppercase`, `fz="xs"`, `fw={600}`, `c="dimmed"`
- [ ] CC-05-07 Todos los badges usan `variant="light"` y `radius="sm"` por defecto

### CC-06 Brand consistency

- [ ] CC-06-01 Ningun boton en la aplicacion usa `variant="gradient"` (prohibido por directrices)
- [ ] CC-06-02 Todos los botones de accion principal usan `color="brand"`
- [ ] CC-06-03 Botones destructivos usan `color="red"` (bajas, eliminaciones)
- [ ] CC-06-04 Botones de advertencia usan `color="yellow"` (inactivaciones)
- [ ] CC-06-05 Botones de rehabilitacion/exito usan `color="green"`
- [ ] CC-06-06 Sidebar usa `theme.other.brandDark`, nunca hex hardcodeado
- [ ] CC-06-07 Color brand base es #5B7682 (no azul default de Mantine)

---

## Resumen de items

| Seccion                         | Items   |
| ------------------------------- | ------- |
| Prerequisitos                   | 10      |
| Task 0 - Brand Setup            | 66      |
| Task 1 - UC-002 Autenticacion   | 82      |
| Task 2 - UC-017 Planes de Cuota | 89      |
| Task 3 - UC-018 Suscripciones   | 78      |
| Task 4 - UC-011 Alta de Socio   | 81      |
| Task 5 - UC-013 Baja de Socio   | 101     |
| Cross-cutting                   | 42      |
| **TOTAL**                       | **549** |
