# Task 8 — UC-024: Gestión de devoluciones SEPA (Frontend)

## Información general

- **Fase:** 2
- **Tipo:** Frontend
- **UC:** UC-024
- **Bounded Context:** BC-Treasury
- **Prioridad:** Must

## Alcance

### Incluido

- Sección de devoluciones dentro de la página de detalle de remesa (`/treasury/remittances/:id`)
- Formulario de registro de devolución manual: selección de adeudo, código de motivo SEPA, fecha, gastos bancarios
- Select de códigos SEPA con descripción y acción sugerida para cada código
- Panel de acciones automáticas post-devolución: mandato revocado, cargo de penalización, sugerencia de reintento
- Formulario de programación de reintento: fecha, notificación previa
- Informe de devoluciones agrupado por código de motivo con acciones sugeridas
- Descarga de informe en PDF/CSV
- Indicadores visuales: badges de estado de adeudo (COLLECTED=`color="green"`, RETURNED=`color="red"`) con `variant="light"` y `radius="sm"`, alertas por tipo de acción
- Historial de reintentos por cargo
- TanStack Query hooks para registro, reintento e informe
- Validación Zod de DTOs
- Tests unitarios (componentes + hooks)

### Excluido

- Procesamiento automático de ficheros pain.002 (en MVP, registro manual)
- Dashboard de métricas de devoluciones (KPIs de tasa de devolución, evolución)
- Notificaciones automáticas al socio (depende de BC-Communication)
- Workflow de morosidad automatizado

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F2-Back Task 5 — UC-024** | Endpoints REST: returns, retry, return-report |
| **F2-Front Task 7 — UC-023** | Página de detalle de remesa, hooks de remesa |
| **F2-Front Task 4 — UC-020** | Formulario de cargo manual (para penalización integrada) |
| **F2-Front Task 3 — UC-019** | Componente `ChargeStatusBadge` |

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Sección de devoluciones en detalle de remesa | UC-023 frontend |
| Componente `ReturnCodeSelect` reutilizable | Standalone |
| Hook `useRecordReturn()`, `useScheduleRetry()` | Standalone |
| Componente `ReturnReportDownload` | Standalone |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `doc/brand/001-associated-brand-foundation.md` | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |
| `uc/uc-024.md` | Flujo: registro manual, clasificación por código (Tabla 9), reintento, informe |
| `us/us-066.md` | Criterios: registro de devolución, clasificación, reintento |
| `us/us-067.md` | Criterios: gastos bancarios, informe |
| `bc/bc-treasury.md` | Entity SepaDebit con returnReason/returnDate, eventos |

## Puntos críticos

1. **Select de código SEPA informativo.** Cada opción del select muestra código + descripción + icono de acción. Ejemplo: "AM04 - Fondos insuficientes `IconRefresh` (Reintento posible)" vs "MS02 - Rechazo del deudor `IconLock` (Mandato revocado automáticamente)". Tooltip con más detalle al hover. En la implementación, usar iconos de `@tabler/icons-react` en lugar de emoji (`IconRefresh`, `IconLock`, `IconAlertTriangle`).

2. **Acciones automáticas visibles.** Tras registrar devolución, el sistema muestra un panel con las acciones ejecutadas: "Mandato revocado", "Cargo de penalización de `formatMoney(350)` → 3,50 € creado", "Reintento sugerido en 15 días". Importes formateados con `formatMoney()` de `@/shared/utils/format-money.ts`. El usuario ve el resultado de cada acción con confirmación visual.

3. **Bloqueo de reintento por motivo no resuelto.** Si el código es AC01 (IBAN incorrecto) y el IBAN no ha cambiado, el botón "Programar reintento" se muestra disabled con tooltip: "Actualice el IBAN del socio antes de reintentar". Link directo a la ficha del socio.

## Plan de implementación

### Paso 1: Schemas y tipos

- `recordReturnSchema`: debitId, returnCode (enum de códigos SEPA), returnDate, bankFees?, repercutirGastos, notifySocio
- `scheduleRetrySchema`: chargeId, retryDate, notifyBeforeDays
- `returnResponseSchema`: debitId, chargeId, memberId, memberName, returnCode, actions
- `returnReportSchema`: groups[] con { code, description, count, total, members[] }

### Paso 2: API hooks

- `useRecordReturn()`: mutation para registrar devolución
- `useScheduleRetry()`: mutation para programar reintento
- `useReturnReport(remittanceId, format)`: query para informe (JSON o blob PDF/CSV)
- `useRetryHistory(chargeId)`: query para historial de reintentos

### Paso 3: Componentes

- **`ReturnCodeSelect.tsx`**: Select con opciones enriquecidas
  - Cada opción: código + descripción + badge de acción (`IconRefresh` Reintento / `IconLock` Bloqueo / `IconAlertTriangle` Manual) de `@tabler/icons-react`. En la implementación, usar iconos de `@tabler/icons-react` en lugar de emoji. Badges de acción usan `variant="light"` y `radius="sm"`
  - Al seleccionar, muestra panel informativo con la acción automática que se ejecutará
- **`RecordReturnForm.tsx`**: Formulario de registro de devolución
  - Select de adeudo devuelto (lista de adeudos de la remesa)
  - `ReturnCodeSelect` para código de motivo
  - DateInput para fecha de devolución. Fechas en formato español: `dd/MM/yyyy` (ej: "14/03/2026") usando `Intl.DateTimeFormat('es-ES')` o `dayjs` con locale `es`
  - NumberInput para gastos bancarios. Importes formateados con `formatMoney()` de `@/shared/utils/format-money.ts`
  - Checkboxes: repercutir gastos, notificar socio
- **`ReturnActionsPanel.tsx`**: Panel post-registro con acciones ejecutadas
  - Cards con icono + descripción: "Mandato revocado", "Penalización creada: `formatMoney(350)` → 3,50 €", "Reintento sugerido: 05/03/2025". Iconos usan `@tabler/icons-react` exclusivamente
  - Botones: "Programar reintento" usa `color="brand"`, "Ir a ficha del socio", "Contactar socio". Nunca `variant="gradient"` para botones primarios
- **`RetryScheduleForm.tsx`**: Formulario de programación de reintento
  - DateInput para fecha de reintento (precargado con fecha sugerida)
  - NumberInput para días de notificación previa
  - Nota informativa: "El cargo se incluirá automáticamente en la remesa de esa fecha"
  - Disabled si el cargo no permite reintento (código no retriable o límite alcanzado)
- **`ReturnReportSection.tsx`**: Sección en detalle de remesa
  - Agrupado por código de motivo: título + count + importe total formateado con `formatMoney()`. Columnas de importes usan `fontVariantNumeric: 'tabular-nums'` y `textAlign: 'right'`
  - Lista de socios afectados con enlaces a sus fichas
  - Botones: "Descargar PDF", "Descargar CSV". Botones primarios usan `color="brand"`, acciones destructivas usan `color="red"` (nunca `variant="gradient"`)
- **`RetryHistoryTimeline.tsx`**: Timeline de reintentos de un cargo
  - Cada entrada: fecha devolución, código, fecha reintento, resultado. Fechas en formato español: `dd/MM/yyyy` usando `Intl.DateTimeFormat('es-ES')` o `dayjs` con locale `es`. Importes formateados con `formatMoney()` de `@/shared/utils/format-money.ts`

### Paso 4: Integración en página de remesa

Ampliar `RemittanceDetailPage` (de UC-023) con:

- Tab "Devoluciones" con sección de registro + informe
- Estadísticas actualizadas: cobrados / devueltos / pendientes
- Botón "+ Registrar devolución" que abre formulario, usa `color="red"` por ser acción destructiva
- Sección de informe descargable

### Paso 5: Tests

- ReturnCodeSelect: renderiza opciones con badges, selección muestra panel informativo
- RecordReturnForm: validación funciona, submit llama API, acciones post-registro se muestran
- ReturnActionsPanel: muestra acciones correctas según código (AM04 → reintento, MS02 → mandato revocado)
- RetryScheduleForm: disabled si no retriable, enabled si AM04, fecha precargada
- ReturnReportSection: agrupación correcta, descarga funciona

## Criterios de aceptación

1. **Devolución registrada con código SEPA:** Al registrar con código AM04, se muestra panel con sugerencia de reintento en 15 días.

2. **Acciones automáticas visibles:** Tras registrar con MS02, se muestra que el mandato fue revocado automáticamente.

3. **Gastos repercutidos:** Al marcar "repercutir gastos" con 3.50€, se muestra confirmación del cargo de penalización creado.

4. **Reintento programable:** Se puede programar un reintento con fecha y notificación previa. El botón se desactiva si el código no lo permite.

5. **Bloqueo por motivo no resuelto:** Para AC01 sin cambio de IBAN, el reintento está bloqueado con mensaje explicativo y link a ficha del socio.

6. **Informe descargable:** El informe de devoluciones se agrupa por código de motivo y se puede descargar en PDF o CSV.
