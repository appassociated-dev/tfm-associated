# Task 2 — UC-010: Gestión de ejercicios (Frontend)

## Información general

- **Fase:** 3
- **Tipo:** Frontend
- **UC:** UC-010
- **Bounded Context:** BC-Membership
- **Prioridad:** Must

## Alcance

### Incluido

- Página de gestión de ejercicios (`/settings/fiscal-years`) con listado de ejercicios y su estado
- Formulario de apertura de ejercicio con configurador de tipo (año natural, temporada deportiva, cofrade, personalizado)
- Opciones de arrastre: checkbox de arrastre automático de socios activos + transiciones automáticas de categoría
- Preview de apertura: socios que se arrastrarán, transiciones que se aplicarán, ejercicio anterior de referencia
- Página de detalle de ejercicio (`/settings/fiscal-years/:id`) con resumen: socios al inicio/fin, cuotas generadas, estado
- Flujo de cierre de ejercicio con validaciones pre-cierre (Tabla 2: cuotas conciliadas, remesas cerradas, actas completas)
- Panel de advertencias no bloqueantes con opción de forzar cierre
- Confirmación de cierre con generación de memoria de ejercicio
- Comparativa entre ejercicios: tabla con indicadores y tendencias (hasta 3 ejercicios)
- Selector de ejercicio activo (contexto global para filtrado en toda la app)
- TanStack Query hooks para todas las operaciones
- Validación Zod de formularios (fechas no solapadas, fecha fin > fecha inicio)
- Tests unitarios (componentes + hooks)

### Excluido

- Cálculo de fecha de ejercicio cofrade (Domingo de Resurrección) — lo calcula el backend
- Visualización/descarga de la memoria de ejercicio generada (depende de BC-Documents, fuera del MVP)
- Modificación de ejercicio cerrado (bloqueado por backend)
- Gestión de eventos y actas dentro del ejercicio (BC-Events y BC-Documents fuera del MVP)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F1-Back Task 4 — UC-010** | Endpoints REST: fiscal-years CRUD, open, close, compare, pre-close-validations |
| **F1-Front Task 1 — UC-002** | AuthProvider, usePermissions(), HttpClient |
| **Fase 0 — Scaffold** | Proyecto React + Vite + Mantine, TanStack Query, Router, Zod |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] Endpoint `POST /api/v1/tenants/:tenantId/fiscal-years` crea ejercicio con configurador completo
- [ ] Endpoint `POST /api/v1/tenants/:tenantId/fiscal-years/:id/open` ejecuta apertura con arrastre y transiciones
- [ ] Endpoint `POST /api/v1/tenants/:tenantId/fiscal-years/:id/close` ejecuta cierre con validaciones previas
- [ ] Endpoint `GET /api/v1/tenants/:tenantId/fiscal-years/:id/pre-close-validations` retorna resultado de validaciones
- [ ] Endpoint `GET /api/v1/tenants/:tenantId/fiscal-years/compare` acepta array de IDs y retorna comparativa
- [ ] JWT incluye permisos `fiscal-year:read`, `fiscal-year:write` para control de acceso

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/settings/fiscal-years` | Navegación de configuración |
| Página `/settings/fiscal-years/:id` | Navegación interna |
| Componente `FiscalYearSelector` | Layout global (selector de contexto de ejercicio) |
| Componente `FiscalYearTypeConfigurator` | Reutilizable en otros contextos de configuración |
| Hook `useFiscalYears()`, `useActiveFiscalYear()` | UC-064, UC-065 (dashboard necesita contexto de ejercicio) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `doc/brand/001-associated-brand-foundation.md` | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |
| `uc/uc-010.md` | Flujo completo: configurador, apertura con arrastre, cierre con validaciones, comparativas |
| `us/us-023.md` a `us/us-027.md` | Criterios: concepto de ejercicio, apertura, cierre, comparativas, transiciones |
| `bc/bc-membership.md` | Aggregate FiscalYear — estados (PREPARACION, ABIERTO, CERRADO), tipo de ejercicio |

## Puntos críticos

1. **Configurador de tipo de ejercicio.** El formulario debe adaptar las fechas automáticamente según el tipo seleccionado: año natural (01/01 - 31/12), temporada deportiva (01/09 - 31/08), personalizado (fechas libres). Para tipo cofrade, el backend calcula las fechas y el frontend las muestra como solo lectura. Validar solapamiento con ejercicios existentes.

2. **Preview de apertura informativo.** Antes de confirmar la apertura, mostrar resumen de impacto: "Se arrastrarán 340 socios activos, se aplicarán 8 transiciones de categoría (juvenil → adulto), 12 socios de baja NO serán arrastrados". El usuario debe revisar y confirmar. Usar endpoint de preview del backend.

3. **Validaciones pre-cierre no bloqueantes.** Las validaciones de cierre (Tabla 2) son advertencias, no bloqueos. El frontend debe mostrar el resultado de cada validación con icono (check verde / advertencia amarilla) y permitir forzar el cierre con un checkbox de confirmación explícito: "Confirmo que deseo cerrar el ejercicio a pesar de las advertencias".

4. **Selector de ejercicio como contexto global.** El ejercicio activo determina el contexto de toda la app (qué datos se ven en listados, dashboard, etc.). El selector debe estar en el layout principal y su cambio debe invalidar las queries de TanStack Query que dependen del ejercicio.

## Plan de implementación

### Paso 1: Schemas y tipos

Crear en `web/src/features/settings/schemas/`:

- **`fiscal-year.schemas.ts`**:
  - `fiscalYearTypeSchema`: enum `NATURAL | SPORTS_SEASON | COFRADE | CUSTOM`
  - `createFiscalYearSchema`: name (min 2 chars), type, startDate, endDate (refine: endDate > startDate), previousFiscalYearId?, carryOverMembers (boolean), applyTransitions (boolean)
  - `fiscalYearResponseSchema`: id, name, type, startDate, endDate, status, membersAtStart, membersAtEnd, createdAt
  - `preCloseValidationSchema`: validations[] con { name, description, passed, severity }
  - `compareResponseSchema`: fiscalYears[], indicators[] con { name, values: Record<string, number>, trend }
  - Tipos inferidos: `CreateFiscalYearInput`, `FiscalYearResponse`, `PreCloseValidation`, `CompareResponse`

### Paso 2: API hooks

Crear en `web/src/features/settings/api/`:

- `useFiscalYears()`: query para listado de ejercicios del tenant
- `useActiveFiscalYear()`: query para el ejercicio con status ABIERTO (usado globalmente)
- `useFiscalYearDetail(id)`: query para detalle de un ejercicio
- `useCreateFiscalYear()`: mutation para crear ejercicio
- `useOpenFiscalYear()`: mutation para apertura (arrastre + transiciones)
- `usePreCloseValidations(id)`: query para validaciones pre-cierre
- `useCloseFiscalYear()`: mutation para cierre (acepta `force: boolean`)
- `useCompareFiscalYears(ids)`: query para comparativa entre ejercicios

### Paso 3: Componentes

Crear en `web/src/features/settings/components/`:

- **`FiscalYearTypeConfigurator.tsx`**: Radio group con 4 opciones de tipo
  - Al seleccionar tipo, auto-rellena fechas (año natural → 01/01-31/12 del año seleccionado, temporada → 01/09-31/08)
  - Tipo cofrade: muestra fechas calculadas por el backend como solo lectura con nota explicativa
  - Tipo personalizado: DatePicker libre para inicio y fin
  - Validación de solapamiento en tiempo real contra ejercicios existentes
- **`OpenFiscalYearForm.tsx`**: Formulario de apertura
  - `FiscalYearTypeConfigurator` para configurar tipo y fechas
  - Select de ejercicio anterior como referencia
  - Checkboxes: "Arrastrar socios activos" y "Aplicar transiciones automáticas de categoría"
  - Botón "Vista previa" que carga preview del backend
- **`OpenFiscalYearPreview.tsx`**: Panel de preview pre-apertura
  - Card de resumen: socios a arrastrar, transiciones a aplicar, socios excluidos (baja)
  - Lista detallada de transiciones: "Juan García: Juvenil → Adulto (cumple 35 años)"
  - Botones: "Confirmar apertura" / "Cancelar"
- **`CloseFiscalYearWizard.tsx`**: Stepper de 2 pasos
  - Paso 1: `PreCloseValidationsPanel` — resultado de validaciones con icono por cada una
  - Paso 2: Confirmación — resumen del ejercicio + checkbox de forzar cierre si hay advertencias + botón "Cerrar ejercicio"
- **`PreCloseValidationsPanel.tsx`**: Panel con lista de validaciones
  - Cada validación: icono (✓ verde / ⚠️ amarillo), nombre, descripción, estado
  - Resumen: "2 de 3 validaciones superadas"
  - Si todas pasan: botón "Continuar" habilitado directamente
  - Si alguna falla: mostrar advertencia y checkbox de confirmación
- **`FiscalYearCompareTable.tsx`**: Tabla comparativa
  - Selector múltiple de ejercicios a comparar (máximo 3)
  - Tabla con filas: socios activos, altas, bajas, tasa retención, recaudación total
  - Columna de tendencia con icono (↑ verde, ↓ rojo, → gris) y porcentaje
- **`FiscalYearSelector.tsx`**: Select global para el layout
  - Muestra ejercicio activo con badge de estado
  - Dropdown con ejercicios disponibles
  - Al cambiar, invalida queries dependientes de ejercicio vía TanStack Query `queryClient.invalidateQueries`
- **`FiscalYearStatusBadge.tsx`**: Badge de estado con color
  - PREPARACION: gris, ABIERTO: verde, CERRADO: azul

### Paso 4: Páginas

Crear en `web/src/features/settings/pages/`:

- **`FiscalYearsPage.tsx`**: `/settings/fiscal-years`
  - Tabla de ejercicios con nombre, tipo, fechas, estado, socios
  - Botón "+ Nuevo ejercicio" (abre formulario)
  - Acciones por fila: ver detalle, cerrar (si abierto)
- **`FiscalYearDetailPage.tsx`**: `/settings/fiscal-years/:id`
  - Card de resumen: tipo, fechas, estado, socios al inicio/fin
  - Sección de comparativa (accesible desde detalle)
  - Botón "Cerrar ejercicio" si estado es ABIERTO
  - Indicador de ejercicio cerrado (bloqueado, solo lectura)

### Paso 5: Integración global

- Integrar `FiscalYearSelector` en el layout principal (sidebar o header)
- Crear contexto React `FiscalYearContext` con el ejercicio seleccionado
- Las queries de otras features (socios, cargos, pagos) reciben `fiscalYearId` del contexto

### Paso 6: Tests

- FiscalYearTypeConfigurator: auto-rellena fechas según tipo, valida solapamiento
- OpenFiscalYearForm: submit llama API, preview muestra datos correctos
- OpenFiscalYearPreview: muestra transiciones, confirmar llama apertura
- PreCloseValidationsPanel: muestra validaciones con iconos correctos, checkbox de forzar si advertencias
- CloseFiscalYearWizard: 2 pasos navegan, cierre funciona con y sin forzar
- FiscalYearCompareTable: selector limita a 3, tabla muestra tendencias correctas
- FiscalYearSelector: cambio invalida queries dependientes

## Criterios de aceptación

1. **Configurador de tipo funcional:** Al seleccionar tipo de ejercicio, las fechas se auto-rellenan correctamente. El tipo personalizado permite fechas libres. Se valida solapamiento.

2. **Apertura con preview:** Antes de abrir, se muestra resumen de impacto (socios arrastrados, transiciones). El usuario confirma tras revisar.

3. **Cierre con validaciones:** Las validaciones pre-cierre se muestran con estado visual. Las advertencias no bloquean, pero requieren confirmación explícita para forzar cierre.

4. **Comparativa entre ejercicios:** Se pueden comparar hasta 3 ejercicios en tabla con indicadores y tendencias.

5. **Selector global de ejercicio:** El ejercicio activo se selecciona desde el layout principal y afecta el contexto de toda la aplicación.

6. **Estados visuales claros:** Los badges de estado (preparación, abierto, cerrado) son visualmente distintos. Un ejercicio cerrado se muestra como solo lectura.
