# Task 1 — UC-001: Provisión de nuevo tenant (Frontend)

## Información general

- **Fase:** 3
- **Tipo:** Frontend
- **UC:** UC-001
- **Bounded Context:** BC-Identity
- **Prioridad:** Must

## Alcance

### Incluido

- Página de provisión de tenant (`/admin/tenants/new`) accesible desde panel de superadmin
- Formulario de creación: datos de la colectividad (nombre, tipo, CIF, email contacto) + datos del administrador inicial (nombre, email, password)
- Validación CIF español en cliente con Zod (formato + unicidad vía API)
- Selector de tipo de colectividad con iconos/cards descriptivas (Peña, Cofradía, Club Deportivo, Asociación Cultural)
- Indicador de progreso durante provisión (loading state con pasos: creando BD → migrando → seedeando → finalizando)
- Pantalla de resultado: éxito con URL de acceso y resumen, o error con mensaje descriptivo
- Listado de tenants existentes (`/admin/tenants`) con estado, fecha de creación, tipo
- TanStack Query hooks para provisión y consulta de tenants
- Validación Zod de todos los campos del formulario
- Tests unitarios (componentes + hooks)

### Excluido

- Configuración personalizada durante provisión (FA-2: ejercicio fiscal, branding) — el tenant se crea con defaults
- Gestión avanzada de tenants (suspender, eliminar, migrar)
- Envío del email de bienvenida desde frontend (lo hace el backend automáticamente)
- Dashboard de superadmin con métricas de tenants

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Proyecto React + Vite + Mantine, HttpClient, TanStack Query, Router, Zod |
| **F1-Back Task 1 — UC-001** | Endpoint `POST /api/v1/tenants` con flujo completo de provisión |
| **F1-Front Task 1 — UC-002** | AuthProvider (el superadmin usa autenticación estándar con permisos especiales) |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] Endpoint `POST /api/v1/tenants` responde correctamente con flujo completo de provisión
- [ ] Endpoint `GET /api/v1/tenants` lista tenants existentes (para superadmin)
- [ ] Mecanismo de autenticación de superadmin funcional (API key o credencial especial)
- [ ] Validación de CIF duplicado funcional en backend (409 Conflict)

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/admin/tenants/new` | Panel de superadmin |
| Página `/admin/tenants` | Panel de superadmin |
| Componente `CollectivityTypeSelector` | Reutilizable si se necesita selector de tipo en otros contextos |
| Hook `useProvisionTenant()` | Standalone |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `doc/brand/001-associated-brand-foundation.md` | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |
| `uc/uc-001.md` | Flujo completo de provisión: datos, validaciones, seed, resultado |
| `us/us-001.md` | Criterios de aceptación: BD aislada, roles seedeados, admin funcional |
| `bc/bc-identity.md` | Aggregate Tenant — DatosEntidad, ConfiguracionTenant, CollectivityType |
| `adr/adr-002.md` | Multi-tenant por BD: cada provisión crea una BD independiente |

## Puntos críticos

1. **Validación de CIF español.** El formato CIF tiene múltiples variantes (letra + 7 dígitos + dígito/letra de control). El schema Zod debe validar el formato y adicionalmente verificar unicidad contra el backend (llamada asíncrona onBlur). Mostrar feedback inmediato: formato válido/inválido + disponible/duplicado.

2. **Provisión larga con feedback.** La provisión puede tardar 10-30 segundos (crear BD, migrar, seedear). El frontend debe mostrar un indicador de progreso con pasos descriptivos para que el superadmin no cierre la página. Usar loading state con stepper visual: "Creando base de datos... → Aplicando migraciones... → Configurando roles... → Finalizando..."

3. **Manejo de error con rollback.** Si la provisión falla, el backend hace rollback automático. El frontend muestra error descriptivo con opción de reintentar. No debe quedar en estado intermedio.

## Plan de implementación

### Paso 1: Schemas y tipos

Crear en `web/src/features/admin/schemas/`:

- **`tenant.schemas.ts`**:
  - `provisionTenantSchema`: nombre (min 3 chars), collectivityType (enum), cif (regex + refine), contactEmail, adminName, adminEmail, adminPassword (min 8 chars, mayúscula, número)
  - `tenantResponseSchema`: id, name, slug, type, status, createdAt
  - Tipos inferidos: `ProvisionTenantInput`, `TenantResponse`

### Paso 2: API hooks

Crear en `web/src/features/admin/api/`:

- `useProvisionTenant()`: mutation con `onSuccess` navega a resultado, `onError` muestra mensaje
- `useTenants()`: query para listado de tenants
- `useCheckCifAvailability(cif)`: query con debounce para validación de unicidad

### Paso 3: Componentes

Crear en `web/src/features/admin/components/`:

- **`CollectivityTypeSelector.tsx`**: 4 cards con icono, nombre y descripción de cada tipo
  - Peña Festera: "Gestión de fiestas, catering, logística"
  - Cofradía: "Gestión hermandad, procesiones, reglas"
  - Club Deportivo: "Licencias, categorías, competiciones"
  - Asociación Cultural: "Actividades, talleres, eventos"
  - Selección con borde resaltado y checkmark
- **`ProvisionForm.tsx`**: Formulario con secciones
  - Sección 1: Datos de la colectividad (nombre, tipo, CIF con validación async, email)
  - Sección 2: Datos del administrador (nombre, email, password con requisitos visibles)
  - Botón "Provisionar" con confirmación previa
- **`ProvisionProgress.tsx`**: Stepper visual con 4 pasos
  - Paso 1: "Creando base de datos..." (spinner)
  - Paso 2: "Aplicando migraciones..."
  - Paso 3: "Configurando roles y permisos..."
  - Paso 4: "Finalizando..."
  - Al completar: checkmark verde con resumen
- **`ProvisionResult.tsx`**: Card de resultado
  - Éxito: nombre del tenant, URL de acceso, credenciales del admin, botón "Copiar URL"
  - Error: mensaje descriptivo, botón "Reintentar"

### Paso 4: Páginas

Crear en `web/src/features/admin/pages/`:

- **`TenantsListPage.tsx`**: `/admin/tenants` — tabla de tenants con nombre, tipo, estado, fecha
- **`ProvisionTenantPage.tsx`**: `/admin/tenants/new` — formulario + progress + resultado

### Paso 5: Tests

- CollectivityTypeSelector: renderiza 4 opciones, selección funciona
- ProvisionForm: validación CIF (formato + unicidad), validación password, submit
- ProvisionProgress: muestra pasos secuencialmente
- ProvisionResult: éxito muestra URL, error muestra mensaje con reintento

## Criterios de aceptación

1. **Formulario con validación completa:** El CIF se valida en formato y unicidad (feedback visual inmediato). El password muestra requisitos.

2. **Selector de tipo descriptivo:** Las 4 opciones de colectividad se muestran como cards con descripción clara.

3. **Feedback durante provisión:** Se muestra un stepper visual con el progreso de la provisión (10-30 segundos).

4. **Resultado claro:** Tras provisión exitosa, se muestra la URL de acceso y credenciales. Tras error, se muestra mensaje con opción de reintentar.

5. **Listado de tenants:** Se pueden ver todos los tenants existentes con su estado y tipo.
