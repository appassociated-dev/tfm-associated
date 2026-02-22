# Task 2 — UC-008: Configuración de tipos de socio (Frontend)

## Información general

- **Fase:** 2
- **Tipo:** Frontend
- **UC:** UC-008
- **Bounded Context:** BC-Membership
- **Prioridad:** Must

## Alcance

### Incluido

- Página de configuración de tipos de socio (`/settings/member-types`)
- Listado de tipos existentes con indicador de socios asignados por tipo
- Formulario de creación/edición de tipo de socio adaptado al tipo de colectividad (cofradía, peña, club, asociación)
- Configuración de reglas: rango de edad, derechos (voto, elegibilidad), carencia, transiciones automáticas
- Plantillas predefinidas por tipo de colectividad (FA-1) con modal de selección
- Inactivación de tipos (FA-3) con advertencia de socios afectados
- Validación en cliente con Zod: rangos de edad coherentes, unicidad de código, antigüedad lógica
- TanStack Query hooks para CRUD de tipos de socio
- Feedback visual: loading states, errores de validación, confirmación
- Tests unitarios (componentes + hooks)

### Excluido

- Motor de reglas de evaluación automática en frontend (las reglas se evalúan en backend)
- Simulación de transiciones automáticas en UI
- Importación/exportación de configuraciones de tipos
- Drag-and-drop para reordenar tipos

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 0 — Scaffold** | Proyecto React + Vite + Mantine, HttpClient, TanStack Query, Router, Zod |
| **F1-Back Task 3 — UC-008** | Endpoints REST: `GET /member-types`, `POST /member-types`, `PUT /member-types/:id`, `DELETE /member-types/:id`. DTOs definidos |
| **F1-Front Task 1 — UC-002** | AuthProvider, ProtectedRoute, usePermissions() |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] Endpoints de member-types responden correctamente
- [ ] AuthProvider disponible con `usePermissions()`
- [ ] Tipo de colectividad del tenant accesible desde contexto de auth (`tenant.collectivityType`)

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/settings/member-types` | Navegación de configuración |
| Hooks `useMemberTypes()`, `useCreateMemberType()`, `useUpdateMemberType()` | UC-011 (select de tipo en alta), UC-006 (filtro por tipo), UC-056 (importación) |
| Select component `MemberTypeSelect` reutilizable | Formularios que necesiten seleccionar tipo de socio |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-008.md` | Flujo completo: formularios por colectividad, plantillas, reglas, transiciones |
| `us/us-015.md` a `us/us-019.md` | Criterios por tipo de colectividad y motor de reglas |
| `bc/bc-membership.md` | Aggregate MemberType — estructura, reglas, invariantes |

## Puntos críticos

1. **Formulario adaptativo por colectividad.** El formulario cambia según el tipo de colectividad del tenant. Cofradías muestran carencia de voto y antigüedad para cargos. Clubes deportivos muestran requisitos federativos. Peñas muestran rangos de edad con transición. Usar un componente `MemberTypeFormFields` que renderice las secciones adecuadas según `tenant.collectivityType`.

2. **Validación de rangos de edad.** `edadMinima < edadMaxima` cuando ambos están definidos. `antiguedadVoto <= antiguedadCargos`. El schema Zod debe incluir `refine()` cross-field para estas validaciones.

3. **Plantillas predefinidas.** Al crear el primer tipo, ofrecer plantillas según colectividad (cofradía: Numerario, Honorario, Aspirante, Menor; peña: Adulto, Juvenil, Infantil, Honor; etc.). Modal con cards seleccionables que pre-rellenan el formulario.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Configuración de transiciones automáticas confusa para el usuario | Media | Medio | UI clara con select de tipo destino y condición (edad). Tooltip explicativo |
| Inactivación de tipo con socios asignados no entendida | Baja | Bajo | Diálogo de confirmación mostrando conteo de socios afectados y explicación |

## Plan de implementación

### Paso 1: Schemas Zod y tipos

Crear en `web/src/features/member-types/schemas/`:

- **`member-type.schemas.ts`**:
  - `memberTypeResponseSchema`: datos completos del tipo
  - `memberTypeCreateSchema`: con validaciones cross-field (edades, antigüedades)
  - `memberTypeUpdateSchema`: actualización parcial
  - Tipos inferidos: `MemberType`, `MemberTypeCreate`, `MemberTypeUpdate`

### Paso 2: API hooks

Crear en `web/src/features/member-types/api/`:

- `useMemberTypes()`: listado con conteo de socios por tipo
- `useMemberType(id)`: detalle individual
- `useCreateMemberType()`: mutation con invalidación de caché
- `useUpdateMemberType()`: mutation
- `useDeleteMemberType()`: mutation con confirmación previa

### Paso 3: Componentes

Crear en `web/src/features/member-types/components/`:

- **`MemberTypesList.tsx`**: Tabla con tipos, código, nombre, conteo socios, estado (activo/inactivo), acciones
- **`MemberTypeForm.tsx`**: Formulario adaptativo según colectividad. Secciones: datos básicos, rango de edad, derechos, transiciones
- **`MemberTypeFormFields.tsx`**: Renderiza secciones específicas por colectividad (cofradía/peña/club/asociación)
- **`TemplateSelector.tsx`**: Modal con cards de plantillas predefinidas por colectividad
- **`MemberTypeSelect.tsx`**: Componente reutilizable Select con tipos del tenant

### Paso 4: Página principal

Crear en `web/src/features/member-types/pages/`:

- **`MemberTypesPage.tsx`**: Página `/settings/member-types`
  - Listado de tipos con botón "Nuevo tipo"
  - Modal/Drawer lateral para creación/edición
  - Botón de plantillas si no hay tipos creados
  - Diálogo de confirmación para inactivación con conteo de socios

### Paso 5: Tests

- Formulario: renderiza campos correctos por colectividad, validación funciona
- Plantillas: modal muestra opciones correctas, selección pre-rellena formulario
- Lista: renderiza tipos, acciones de editar/inactivar funcionan
- `MemberTypeSelect`: carga tipos y selección funciona

## Criterios de aceptación

1. **Formulario adaptado a colectividad:** Para cofradías se muestran campos de carencia y antigüedad. Para clubes, requisitos federativos. El formulario se adapta automáticamente.

2. **Plantillas disponibles:** Al crear el primer tipo, se ofrecen plantillas predefinidas según colectividad que pre-rellenan el formulario.

3. **Validación de rangos coherentes:** No se permite guardar si edad mínima > edad máxima o si antigüedad de voto > antigüedad de cargos.

4. **Inactivación con advertencia:** Al inactivar un tipo con socios, se muestra diálogo con conteo de afectados y confirmación explícita.

5. **Select reutilizable:** El componente `MemberTypeSelect` funciona correctamente en formularios de alta y filtros.
