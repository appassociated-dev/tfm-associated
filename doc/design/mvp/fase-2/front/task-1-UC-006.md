# Task 1 — UC-006: Gestión de ficha de socio (Frontend)

## Información general

- **Fase:** 2
- **Tipo:** Frontend
- **UC:** UC-006
- **Bounded Context:** BC-Membership
- **Prioridad:** Must

## Alcance

### Incluido

- Página de listado de socios (`/members`) con tabla paginada, búsqueda y filtros
- Página de detalle/edición de ficha de socio (`/members/:memberId`)
- Formulario de edición de datos personales, contacto y bancarios
- Campos personalizados dinámicos según tipo de colectividad (cofradía, peña, club, asociación cultural) renderizados desde configuración JSONB
- Validación en cliente con Zod: DNI mod23, email RFC 5322, IBAN mod97
- Vista de ficha en modo lectura para socio (perfil propio)
- Sección de historial de estados del socio (timeline visual)
- Protección de campos no editables: DNI, número de socio
- TanStack Query hooks para CRUD de socios
- Feedback visual: loading states, errores de validación por campo, toast de confirmación
- Componente `MemberSearchCombobox` reutilizable para buscar socios (usado en otras features)
- Tests unitarios (componentes + hooks)

### Excluido

- Formulario de alta de socio (ya implementado en Fase 1 front task-4-UC-011)
- Formulario de baja de socio (ya implementado en Fase 1 front task-5-UC-013)
- Portal del socio completo (solo vista básica de perfil propio)
- Adjuntar archivos (certificados médicos, documentos) — diferido post-MVP
- Solicitud de cambios por parte del socio (FA-2, formulario que genera notificación) — diferido post-MVP
- Exportación de listado a Excel/CSV — diferido post-MVP

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Proyecto React + Vite + Mantine, HttpClient, TanStack Query, Router, Zod |
| **F1-Back Task 6 — UC-006** | Endpoints REST: `GET /members` (listado paginado), `GET /members/:id` (detalle), `PUT /members/:id` (actualización), `GET /members/:id/status-history` (historial). DTOs definidos |
| **F1-Front Task 1 — UC-002** | AuthProvider, ProtectedRoute, HttpClient con interceptors, usePermissions() |
| **F1-Front Task 4 — UC-011** | Componentes base de formulario de socio (parcialmente reutilizables) |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] Endpoints `GET /api/v1/tenants/:tenantId/members` y `GET /api/v1/tenants/:tenantId/members/:id` responden correctamente
- [ ] Endpoint `PUT /api/v1/tenants/:tenantId/members/:id` acepta actualización parcial
- [ ] Endpoint `GET /api/v1/tenants/:tenantId/members/:id/status-history` retorna historial
- [ ] `web/src/shared/api/http-client.ts` existe con interceptors de auth
- [ ] `web/src/features/auth/hooks/use-auth.ts` exporta `useAuth()` y `usePermissions()`
- [ ] Mantine DataTable o Table componente disponible
- [ ] Zod instalado con schemas base de validación de DNI, email, IBAN

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/members` (listado) | Navegación principal, layout |
| Página `/members/:memberId` (detalle) | Links desde cualquier referencia a un socio |
| Componente `MemberSearchCombobox` | UC-020 (seleccionar socio para cargo manual), UC-021 (buscar socio para cobro), UC-023 (mandato SEPA) |
| Hooks `useMembers()`, `useMember()`, `useUpdateMember()` | Otras features que necesiten datos de socios |
| Schemas Zod de validación de socio | Reutilizables en UC-011 (alta), UC-056 (importación frontend) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `doc/brand/001-associated-brand-foundation.md` | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |
| `uc/uc-006.md` | Flujo completo: creación, actualización, consulta, campos específicos por colectividad |
| `us/us-009.md` | Criterios: datos obligatorios, validaciones |
| `us/us-010.md` | Criterios: campos específicos de cofradías |
| `us/us-011.md` | Criterios: campos específicos de clubes deportivos |
| `us/us-012.md` | Criterios: campos específicos de peñas festeras |
| `us/us-013.md` | Criterios: campos específicos de asociaciones culturales |
| `bc/bc-membership.md` | Aggregate Member, Value Objects PersonalData, ContactData, IdentityDocument, BankDetails |
| `adr/adr-009.md` | Clean Architecture frontend: features/hooks/components |

## Puntos críticos

1. **Campos personalizados dinámicos.** Cada tipo de colectividad tiene campos específicos (cofradía: datos religiosos; club: datos federativos; peña: datos logísticos; asociación: perfil profesional). Estos se almacenan en JSONB `custom_fields` y deben renderizarse dinámicamente desde la configuración del tipo de colectividad del tenant. Usar un componente `DynamicFieldsRenderer` que interprete la configuración y genere los inputs de Mantine correspondientes.

2. **Validación DNI con algoritmo mod23.** La letra del DNI se valida con `"TRWAGMYFPDXBNJZSQVHLCKE"[numero % 23]`. El schema Zod debe implementar esta validación como `refine()`. También soportar NIE (X→0, Y→1, Z→2 antes del cálculo).

3. **Campos protegidos.** El DNI y el número de socio no son editables tras la creación. El formulario debe mostrarlos como `disabled` con tooltip explicativo. El backend rechaza cambios a estos campos, pero el frontend debe prevenirlo visualmente.

4. **Componente MemberSearchCombobox.** Componente reutilizable de búsqueda con debounce (300ms) que permite buscar socios por nombre, apellidos, DNI o número de socio. Usa `Mantine Combobox` con búsqueda asíncrona. Este componente se reutiliza en UC-020, UC-021, UC-023 y UC-024.

5. **Rendimiento del listado.** La tabla de socios puede tener miles de registros. Usar paginación server-side con TanStack Query (`keepPreviousData: true`). Búsqueda con debounce de 400ms. Filtros: estado, tipo de socio, fecha de alta.

6. **Biblioteca de iconos.** Todos los iconos deben usar exclusivamente `@tabler/icons-react`. No usar `lucide-react`, emojis ni ninguna otra biblioteca de iconos.

7. **Formato de fechas.** Todas las fechas se muestran en formato español: formato largo "8 de marzo de 2026", formato compacto "08/03/2026" (dd/MM/yyyy). Nunca usar formato anglosajón (MM/dd/yyyy).

8. **Botones de acción primaria.** Todos los botones de acción primaria deben usar `color="brand"`. Nunca usar `variant="gradient"`.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Campos dinámicos con tipos no previstos | Media | Medio | Definir tipos soportados: text, number, date, select, checkbox, textarea. Fallback a text para tipos desconocidos |
| Formulario complejo con muchos campos causa UX pobre | Media | Medio | Organizar en secciones colapsables con Mantine Accordion. Datos personales siempre visible, campos custom colapsados |
| Búsqueda lenta con muchos socios | Baja | Medio | Server-side search con índices. Debounce de 400ms. Mostrar máximo 50 resultados |

## Plan de implementación

### Paso 1: Schemas Zod y tipos

Crear en `web/src/features/members/schemas/`:

- **`member.schemas.ts`**:
  - `memberSearchParamsSchema`: paginación, búsqueda, filtros (estado, tipo, fecha)
  - `memberResponseSchema`: datos completos del socio incluyendo custom_fields
  - `memberUpdateSchema`: datos editables (excluye DNI, memberNumber)
  - `memberListResponseSchema`: array paginado con `data`, `total`, `page`, `pageSize`
  - Validaciones Zod: DNI mod23 (`refine()`), email, IBAN mod97, fechas
- Tipos TypeScript inferidos: `Member`, `MemberUpdate`, `MemberSearchParams`

### Paso 2: API hooks con TanStack Query

Crear en `web/src/features/members/api/`:

- **`member.api.ts`**: funciones de llamada HTTP
  - `fetchMembers(params: MemberSearchParams): Promise<MemberListResponse>`
  - `fetchMember(memberId: string): Promise<Member>`
  - `updateMember(memberId: string, data: MemberUpdate): Promise<Member>`
  - `fetchStatusHistory(memberId: string): Promise<StatusHistoryEntry[]>`
  - `searchMembers(query: string): Promise<MemberSearchResult[]>` (para combobox)

- **`member.hooks.ts`**: hooks de TanStack Query
  - `useMembers(params)`: `useQuery` con paginación server-side, `keepPreviousData: true`
  - `useMember(memberId)`: `useQuery` para detalle individual
  - `useUpdateMember()`: `useMutation` con invalidación de caché
  - `useStatusHistory(memberId)`: `useQuery` para historial
  - `useMemberSearch(query)`: `useQuery` con debounce 300ms, para combobox

### Paso 3: Componente MemberSearchCombobox

Crear en `web/src/features/members/components/`:

- **`MemberSearchCombobox.tsx`**: Componente reutilizable
  - Props: `onSelect(member: MemberSearchResult)`, `label?`, `placeholder?`, `excludeIds?`
  - Usa `Mantine Combobox` con búsqueda asíncrona
  - Debounce de 300ms en input
  - Muestra: nombre completo, número de socio, DNI (parcial)
  - Loading state mientras busca
  - Opción "Sin resultados" si no hay coincidencias

### Paso 4: Página de listado de socios

Crear en `web/src/features/members/pages/`:

- **`MembersListPage.tsx`**: Página principal `/members`
  - Tabla con columnas: nº socio, nombre, apellidos, DNI, tipo, estado, fecha alta
    - Columnas numéricas y de fecha: `fontVariantNumeric: 'tabular-nums'`, `textAlign: 'right'`
    - Headers de columna: `uppercase`, `fz="xs"`, `fw={600}`, `c="dimmed"`
  - Barra de búsqueda con debounce 400ms
  - Filtros: Select de estado (Activo, Baja voluntaria, etc.), Select de tipo de socio, DatePicker rango de fecha
  - Paginación con selector de tamaño de página (10, 25, 50)
  - Clic en fila → navega a `/members/:memberId`
  - Badge de color según estado (verde=Activo, rojo=Baja, amarillo=Pendiente). Todos los badges: `variant="light"`, `radius="sm"` según guía de marca
  - `usePermissions()` para mostrar/ocultar botones de acción

### Paso 5: Página de detalle/edición de ficha

Crear en `web/src/features/members/pages/`:

- **`MemberDetailPage.tsx`**: Página `/members/:memberId`
  - Cabecera: nombre completo, nº socio, estado (badge con `variant="light"`, `radius="sm"`), foto placeholder
  - Tabs con Mantine Tabs:
    - **Datos personales**: formulario editable con datos base (nombre, apellidos, fecha nacimiento, DNI disabled)
    - **Contacto**: email, teléfono, dirección completa
    - **Datos bancarios**: IBAN (campo con máscara ES00 0000 0000 0000 0000 0000), titular
    - **Campos específicos**: renderizado dinámico según tipo de colectividad
    - **Historial**: timeline visual de cambios de estado
  - Botones: Guardar (`color="brand"`, nunca `variant="gradient"`), Cancelar (volver a listado)
  - Formulario con `useForm` de Mantine + resolver Zod
  - Loading skeleton mientras carga datos
  - Toast de confirmación tras guardar exitoso

### Paso 6: Componente DynamicFieldsRenderer

Crear en `web/src/features/members/components/`:

- **`DynamicFieldsRenderer.tsx`**: Renderizado dinámico de campos custom
  - Props: `fields: CustomFieldConfig[]`, `values: Record<string, unknown>`, `onChange(field, value)`
  - Soporta tipos: `text`, `number`, `date`, `select`, `checkbox`, `textarea`, `multiselect`
  - Para cada field, renderiza el componente Mantine correspondiente (TextInput, NumberInput, DateInput, Select, Checkbox, Textarea, MultiSelect)
  - Validación Zod generada dinámicamente según tipo de campo

### Paso 7: Componente StatusTimeline

Crear en `web/src/features/members/components/`:

- **`StatusTimeline.tsx`**: Timeline visual del historial de estados
  - Props: `entries: StatusHistoryEntry[]`
  - Usa `Mantine Timeline` con iconos y colores según tipo de transición
  - Cada entrada: fecha, estado anterior → nuevo, usuario que realizó el cambio, motivo
  - Orden cronológico descendente (más reciente primero)

### Paso 8: Tests

**Tests unitarios (componentes):**
- `MemberSearchCombobox`: renderiza, búsqueda con debounce, selección de resultado
- `DynamicFieldsRenderer`: renderiza campos de cada tipo, onChange funciona
- `StatusTimeline`: renderiza entradas correctamente, orden correcto
- `MembersListPage`: renderiza tabla con datos mock, filtros funcionan, navegación a detalle
- `MemberDetailPage`: renderiza formulario con datos, campos protegidos disabled, submit llama API

**Tests unitarios (hooks):**
- `useMembers`: llama API con params correctos, paginación funciona
- `useUpdateMember`: mutation exitosa invalida caché
- `useMemberSearch`: debounce funciona, resultados correctos

**Tests de validación:**
- Schema Zod: DNI válido e inválido (mod23), IBAN válido e inválido (mod97), email
- Campos obligatorios: formulario no se envía sin datos requeridos

## Criterios de aceptación

1. **Listado paginado con búsqueda:** La página de socios muestra una tabla con datos reales, paginación server-side y búsqueda funcional por nombre, DNI o número de socio.

2. **Edición de ficha con validación:** Al modificar datos de un socio y guardar, los cambios se persisten y se muestra confirmación. Las validaciones de DNI, email e IBAN se ejecutan en cliente antes de enviar.

3. **Campos protegidos no editables:** El DNI y número de socio se muestran como campos disabled y no se pueden modificar.

4. **Campos específicos según colectividad:** Para cofradías se muestran campos religiosos, para clubes datos federativos, etc. Los campos se renderizan dinámicamente.

5. **Historial de estados visible:** La pestaña de historial muestra un timeline visual con todas las transiciones de estado del socio.

6. **MemberSearchCombobox reutilizable:** El componente de búsqueda funciona con debounce y se puede usar desde cualquier feature.
