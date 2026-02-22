# Task 4 — UC-020: Gestión de cargos manuales (Frontend)

## Información general

- **Fase:** 2
- **Tipo:** Frontend
- **UC:** UC-020
- **Bounded Context:** BC-Treasury
- **Prioridad:** Must

## Alcance

### Incluido

- Página de cargos manuales (`/treasury/charges/manual`) con listado y filtros
- Formulario de creación de cargo manual individual con selección de socio, concepto, importe y vencimiento
- Asistente de cargo masivo (derrama) con 3 pasos: selección de destinatarios → configuración del cargo → preview y confirmación
- Filtro de destinatarios: todos los activos, por tipo de socio, filtro personalizado
- Preview de cargo masivo con conteo de destinatarios e importe total antes de confirmar
- Indicador de progreso para cargos masivos asíncronos (polling del estado del job)
- Componente `MemberSearchCombobox` (de UC-006) para seleccionar socio en cargo individual
- Validación Zod: importe > 0, fecha vencimiento >= fecha emisión
- Formateo de importes centavos → euros con `Intl.NumberFormat`
- TanStack Query hooks para CRUD y preview
- Tests unitarios (componentes + hooks)

### Excluido

- Cargo de penalización por devolución SEPA (se gestiona desde UC-024 frontend)
- Cargos programados con fecha futura (FA-4, diferido)
- Descuentos individuales en cargos manuales (FA-3, diferido)
- Descarga de lista de destinatarios como CSV

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F2-Back Task 2 — UC-020** | Endpoints REST: `POST /charges/manual`, `POST /charges/bulk/preview`, `POST /charges/bulk`, `GET /charges/bulk/jobs/:jobId` |
| **F2-Front Task 1 — UC-006** | Componente `MemberSearchCombobox` |
| **F2-Front Task 2 — UC-008** | Componente `MemberTypeSelect` para filtro por tipo de socio |
| **F2-Front Task 3 — UC-019** | Componentes `ChargeStatusBadge`, `ChargeDetailDrawer` |

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/treasury/charges/manual` | Navegación de tesorería |
| Formulario de cargo individual reutilizable | UC-024 (cargo de penalización desde devolución) |
| Asistente de cargo masivo | Standalone |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-020.md` | Flujo: cargo individual, cargo masivo (derrama), cargo de penalización |
| `us/us-051.md` | Criterios: cargos manuales individuales y masivos |
| `bc/bc-treasury.md` | Entity Charge con isManual, Domain Service ManualChargeGenerator |

## Puntos críticos

1. **Importe en euros en UI → centavos en API.** El usuario introduce importes en euros (75.00). El frontend convierte a centavos (`Math.round(amount * 100)`) antes de enviar al backend. Al mostrar, convierte de centavos a euros.

2. **Preview obligatorio antes de cargo masivo.** El asistente de 3 pasos requiere que el usuario vea el preview (conteo + total) antes de confirmar. El botón de confirmación solo se habilita tras cargar el preview.

3. **Polling para cargos masivos asíncronos.** Si >500 destinatarios, el backend responde con `202 Accepted` y un `jobId`. El frontend hace polling cada 3 segundos al endpoint de estado del job, mostrando barra de progreso.

## Plan de implementación

### Paso 1: Schemas y tipos

- `manualChargeCreateSchema`: concepto, importe > 0, fechas
- `bulkChargeFilterSchema`: targetType, memberTypeId, customFilters
- `bulkChargePreviewSchema`: totalRecipients, totalAmount
- `bulkChargeResultSchema`: totalCreated, totalAmount, jobId?

### Paso 2: API hooks

- `useCreateManualCharge()`: mutation para cargo individual
- `useBulkChargePreview(filter)`: query para preview
- `useCreateBulkCharges()`: mutation para cargo masivo
- `useBulkChargeJobStatus(jobId)`: query con polling 3s (enabled solo si jobId existe)

### Paso 3: Componentes

- **`ManualChargeForm.tsx`**: Formulario de cargo individual con `MemberSearchCombobox`, inputs de concepto/importe/vencimiento
- **`BulkChargeWizard.tsx`**: Stepper de 3 pasos con Mantine Stepper
  - Paso 1: `BulkChargeTargetStep` — selección de destinatarios (radio: todos/por tipo/personalizado)
  - Paso 2: `BulkChargeDataStep` — concepto, importe, vencimiento, referencia de aprobación
  - Paso 3: `BulkChargePreviewStep` — preview con conteo y total, botón confirmar
- **`BulkChargeProgressModal.tsx`**: Modal con barra de progreso para jobs asíncronos

### Paso 4: Página principal

- **`ManualChargesPage.tsx`**: Tabs: "Cargos manuales" (listado) + "Nuevo cargo" + "Cargo masivo"
  - Listado reutiliza componentes de UC-019 con filtro `isManual = true`
  - Tab "Nuevo cargo": formulario individual
  - Tab "Cargo masivo": wizard de derrama

### Paso 5: Tests

- Formulario individual: validación funciona, submit llama API con centavos
- Wizard masivo: 3 pasos navegan correctamente, preview se carga, confirmación funciona
- Polling: barra de progreso actualiza, resultado final se muestra

## Criterios de aceptación

1. **Cargo individual creado:** Al completar el formulario con socio, concepto e importe, se crea el cargo y se muestra confirmación.

2. **Preview de cargo masivo:** Al seleccionar destinatarios, se muestra el conteo y total antes de confirmar.

3. **Cargo masivo ejecutado:** Tras confirmar, se crean los cargos. Si es asíncrono, se muestra progreso.

4. **Importes correctos:** Los importes se muestran en euros y se envían en centavos al backend.
