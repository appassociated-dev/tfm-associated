# Task 5 — UC-021: Registro de cobros (Frontend)

## Información general

- **Fase:** 2
- **Tipo:** Frontend
- **UC:** UC-021
- **Bounded Context:** BC-Treasury
- **Prioridad:** Must

## Alcance

### Incluido

- Página de registro de cobros (`/treasury/payments`) con listado de pagos y filtros
- Asistente de registro de cobro: búsqueda de socio → selección de cargos → método de pago → confirmación
- Métodos de pago: Efectivo, Transferencia, Bizum, Domiciliación SEPA, Tarjeta TPV
- Gestión de pagos parciales: registrar importe menor al cargo, estado PARCIAL
- Pago que cubre múltiples cargos: seleccionar varios cargos y pagar en una operación
- Generación y descarga de recibo PDF tras registrar cobro
- Adjuntar justificante de pago (PDF, JPG, PNG, max 5MB)
- Visualización de estados de pago con badges de color (`variant="light"`, `radius="sm"`)
- Componente `MemberSearchCombobox` (de UC-006) para buscar socio
- Componentes `ChargeStatusBadge`, `ChargeDetailDrawer` (de UC-019) reutilizados. Todos los badges de estado usan `variant="light"` y `radius="sm"`
- Formateo de importes centavos → euros usando `formatMoney()` de `@/shared/utils/format-money.ts` (el backend envía centavos como enteros: 34500 → "345,00 €")
- TanStack Query hooks para registro y consulta de pagos
- Validación Zod: importe > 0, fecha no futura, método de pago válido
- Tests unitarios (componentes + hooks)

### Excluido

- Cobro automático desde pasarela online (fuera del MVP)
- Generación masiva de recibos (FA-4, diferido)
- Cobro anticipado sin cargo existente (FA-3, diferido)
- Anulación de pagos (requiere autorización especial, diferido)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F1-Back Task 12 — UC-021** | Endpoints REST: `POST /payments`, `GET /payments`, `GET /payments/:id`, `GET /payments/:id/receipt` (PDF), `POST /payments/:id/attachment` |
| **F2-Front Task 1 — UC-006** | Componente `MemberSearchCombobox` |
| **F2-Front Task 3 — UC-019** | Componentes `ChargeStatusBadge`, `ChargeDetailDrawer`, hooks `useCharges()` |

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/treasury/payments` | Navegación de tesorería |
| Asistente de registro de cobro | Standalone, reutilizable |
| Hook `useRecordPayment()` | UC-024 (cobro tras devolución SEPA) |
| Componente `PaymentMethodSelect` | Reutilizable |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `doc/brand/001-associated-brand-foundation.md` | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |
| `uc/uc-021.md` | Flujo: cobro efectivo, transferencia, Bizum, pagos parciales, múltiples cargos, recibos |
| `us/us-053.md` a `us/us-057.md` | Criterios por método de pago, estados, justificantes, recibos |
| `bc/bc-treasury.md` | Entity Payment, PaymentMethod, PaymentStatus |

## Puntos críticos

1. **Flujo de registro en 4 pasos.** Búsqueda de socio → visualización de cargos pendientes (checkboxes) → formulario de pago (método, importe, fecha, observaciones) → confirmación con generación de recibo. Usar Mantine Stepper.

2. **Pago parcial vs pago completo.** Si el importe no coincide con el total seleccionado, preguntar: "¿Registrar como pago parcial?" o "¿Pago completo con descuento?". Mostrar claramente el importe pendiente tras pago parcial.

3. **Recibo PDF.** Tras registrar, ofrecer: Descargar PDF, Imprimir, Enviar por email. El PDF se genera en backend, el frontend lo solicita y abre en nueva pestaña o descarga.

## Plan de implementación

### Paso 1: Schemas y tipos

- `paymentCreateSchema`: chargeIds[], amount, paymentMethod, paymentDate, reference?, observations?
- `paymentResponseSchema`: id, chargeId, amount, method, date, status, receiptNumber
- `paymentMethodEnum`: CASH, TRANSFER, BIZUM, SEPA_DIRECT_DEBIT, CARD_TPV

### Paso 2: API hooks

- `usePayments(filters)`: listado paginado
- `useRecordPayment()`: mutation para registrar cobro
- `usePaymentReceipt(paymentId)`: query para descargar PDF (blob)
- `useUploadAttachment(paymentId)`: mutation para adjuntar justificante

### Paso 3: Componentes

- **`PaymentWizard.tsx`**: Stepper de 4 pasos
  - Paso 1: `MemberSearchCombobox` para buscar socio
  - Paso 2: Lista de cargos pendientes del socio con checkboxes y totales
  - Paso 3: Formulario de pago: `PaymentMethodSelect`, importe, fecha, referencia, observaciones
  - Paso 4: Resumen y confirmación con botones de recibo. Botón de confirmar cobro usa `color="brand"` (nunca `variant="gradient"`)
- **`PaymentMethodSelect.tsx`**: Select con iconos por método (Efectivo, Transferencia, Bizum, etc.). En la implementación, reemplazar emoji por iconos de `@tabler/icons-react` (ej: `IconCash`, `IconBuildingBank`, `IconDeviceMobile`)
- **`PendingChargesList.tsx`**: Lista de cargos pendientes con checkbox, concepto, importe, vencimiento, estado. Las columnas de importes usan `fontVariantNumeric: 'tabular-nums'` y `textAlign: 'right'`. Importes formateados con `formatMoney()` de `@/shared/utils/format-money.ts`
- **`PaymentConfirmation.tsx`**: Card con resumen del pago + botones Descargar/Imprimir/Email recibo. Botón principal usa `color="brand"` (nunca `variant="gradient"`)
- **`AttachmentUpload.tsx`**: Dropzone para subir justificante (PDF/JPG/PNG, max 5MB)

### Paso 4: Página principal

- **`PaymentsPage.tsx`**: Tabs: "Pagos registrados" (listado) + "Registrar cobro" (wizard)
  - Listado con filtros: socio, método de pago, fecha, estado
  - Las columnas de importes en la tabla usan `fontVariantNumeric: 'tabular-nums'` y `textAlign: 'right'`
  - Fechas formateadas en formato español: `dd/MM/yyyy` (ej: "14/03/2026") usando `Intl.DateTimeFormat('es-ES')` o `dayjs` con locale `es`
  - Clic en pago → detalle con recibo descargable

### Paso 5: Tests

- Wizard: navega 4 pasos correctamente, selección de cargos actualiza total
- Pago parcial: detecta diferencia de importe, pregunta al usuario
- Recibo: descarga PDF correctamente
- Justificante: upload funciona, validación de formato y tamaño

## Criterios de aceptación

1. **Cobro registrado con recibo:** Al completar el wizard, se registra el cobro y se genera un recibo PDF descargable.

2. **Selección de múltiples cargos:** Se pueden seleccionar varios cargos pendientes y pagar en una sola operación.

3. **Pago parcial gestionado:** Si el importe es menor al total, el sistema pregunta si es pago parcial y actualiza el estado correctamente.

4. **Métodos de pago funcionales:** Se puede registrar cobro por cualquiera de los 5 métodos disponibles.

5. **Justificante adjuntable:** Se puede adjuntar un justificante PDF/JPG/PNG al pago registrado.
