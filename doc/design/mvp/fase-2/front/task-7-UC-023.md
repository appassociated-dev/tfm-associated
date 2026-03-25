# Task 7 - UC-023: Generación de remesas SEPA (Frontend)

## Información general

- **Fase:** 2
- **Tipo:** Frontend
- **UC:** UC-023
- **Bounded Context:** BC-Treasury
- **Prioridad:** Must

## Alcance

### Incluido

- Página de configuración SEPA (`/settings/sepa`) con formulario de identificador de acreedor y cuenta bancaria
- Página de gestión de mandatos SEPA accesible desde ficha de socio (`/members/:id/mandate`)
- Formulario de registro de mandato: IBAN del deudor, titular, fecha firma, documento firmado (PDF)
- Página de remesas SEPA (`/treasury/remittances`) con listado, generación y detalle
- Asistente de generación de remesa: selección de cargos → validación → preview → generación → descarga XML
- Preview de remesa con desglose: total adeudos, importe, tipos de secuencia (FRST/RCUR/OOFF), socios sin mandato
- Descarga del fichero XML y botón "Marcar como enviada al banco"
- Instrucciones paso a paso para enviar al banco (texto informativo)
- Validación Zod del identificador de acreedor (formato español), IBAN, fecha de cobro (>= 3 días hábiles)
- Detalle de remesa con estadísticas: enviada, cobrada, devuelta
- TanStack Query hooks para todas las operaciones
- Tests unitarios (componentes + hooks)

### Excluido

- Envío automático al banco (el fichero se descarga y el usuario lo sube manualmente a su banca online)
- Calendario de festivos configurable (se usa el cálculo del backend)
- Procesamiento de ficheros pain.002 de respuesta (UC-024)
- Gestión avanzada de mandatos (caducidad automática, revisión batch)

## Dependencias

### Tareas previas requeridas

| Tarea                        | Artefacto necesario                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **F2-Back Task 4 - UC-023**  | Endpoints REST: sepa/config, mandatos, remittances/preview, remittances, remittances/:id/xml, remittances/:id/sent |
| **F1-Front Task 1 - UC-002** | AuthProvider, usePermissions(), HttpClient                                                                         |
| **F2-Front Task 1 - UC-006** | Página de ficha de socio (para integrar sección de mandato)                                                        |

### Artefactos producidos

| Artefacto                                        | Consumido por                                 |
| ------------------------------------------------ | --------------------------------------------- |
| Página `/settings/sepa`                          | Navegación de configuración                   |
| Página `/treasury/remittances`                   | Navegación de tesorería                       |
| Sección de mandato en ficha de socio             | UC-006 (ficha de socio)                       |
| Hook `useRemittances()`, `useRemittanceDetail()` | UC-024 (devoluciones, para ver remesa origen) |

## Referencia de especificación

| Documento                                           | Contenido relevante                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `doc/brand/001-associated-brand-foundation.md`      | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición                          |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |
| `uc/uc-023.md`                                      | Flujo completo: configuración, mandatos, generación, tipos de secuencia, descarga                                                  |
| `us/us-061.md` a `us/us-065.md`                     | Criterios por funcionalidad                                                                                                        |
| `bc/bc-treasury.md`                                 | Aggregates SepaRemittance, SepaDebit, SepaMandate, CreditorIdentifier                                                              |

## Puntos críticos

1. **Validación del identificador de acreedor en UI.** El formato español (ES + 2 dígitos + 000 + CIF) debe validarse en tiempo real con feedback visual: checks válidos en verde (`color="green"`), inválidos en rojo (`color="red"`), pendientes en amarillo (`color="yellow"`) para cada sección (prefijo, longitud, dígito control, CIF). Usar schema Zod con `refine()` y mostrar desglose de validación. Todos los iconos usan `@tabler/icons-react` exclusivamente.

2. **Preview de remesa informativo.** Antes de generar, mostrar: total de adeudos, importe total (formateado con `formatMoney()` de `@/shared/utils/format-money.ts`), desglose por tipo de secuencia (FRST: X, RCUR: Y, OOFF: Z), socios excluidos por falta de mandato. El usuario debe poder revisar antes de confirmar.

3. **Flujo post-generación.** Tras generar: mostrar instrucciones claras para enviar al banco, botón de descarga XML, y botón "Marcar como enviada" que es un paso separado y voluntario.

## Plan de implementación

### Paso 1: Schemas y tipos

- `sepaConfigSchema`: creditorIdentifier (validación completa), creditorName, creditorAddress, creditorIban
- `mandateCreateSchema`: debtorIban (mod97), debtorName, signatureDate, mandateType
- `remittancePreviewSchema`: totalDebits, totalAmount, firstDebits, recurringDebits, oneOffDebits, membersWithoutMandate
- `remittanceResponseSchema`: id, chargeDate, status, totalDebits, totalAmount

### Paso 2: API hooks

- `useSepaConfig()`, `useSaveSepaConfig()`: configuración del acreedor
- `useMandate(memberId)`, `useRegisterMandate()`, `useRevokeMandate()`: gestión de mandatos
- `useRemittances(filters)`: listado de remesas
- `useRemittanceDetail(id)`: detalle con estadísticas
- `useRemittancePreview(selection)`: preview antes de generar
- `useGenerateRemittance()`: mutation de generación
- `useDownloadRemittanceXml(id)`: query para descargar blob XML
- `useMarkRemittanceSent(id)`: mutation

### Paso 3: Componentes

- **`SepaConfigForm.tsx`**: Formulario de configuración con validación en tiempo real del identificador
- **`CreditorIdValidator.tsx`**: Componente visual que muestra desglose de validación (prefijo, longitud, etc.). Checks válidos en verde (`color="green"`). Items inválidos/pendientes en rojo (`color="red"`) o amarillo de advertencia (`color="yellow"`). Todos los iconos usan `@tabler/icons-react` exclusivamente (ej: `IconCheck`, `IconX`, `IconAlertTriangle`)
- **`MandateForm.tsx`**: Formulario de registro de mandato con upload de documento firmado
- **`MandateCard.tsx`**: Card en ficha de socio mostrando estado del mandato (activo/revocado/sin mandato). Badges de estado usan `variant="light"` y `radius="sm"`: activo=`color="green"`, revocado=`color="red"`, sin mandato=`color="gray"`
- **`RemittanceWizard.tsx`**: Stepper de 3 pasos
  - Paso 1: `RemittanceSelectionStep` - fecha de cobro + selección de cargos (radio: todos/vencidos/mes actual/manual)
  - Paso 2: `RemittanceValidationStep` - resultado de validación, advertencias, socios sin mandato
  - Paso 3: `RemittancePreviewStep` - preview con desglose, botón "Generar" usa `color="brand"` (nunca `variant="gradient"`). Importes formateados con `formatMoney()` de `@/shared/utils/format-money.ts`
- **`RemittanceResultCard.tsx`**: Post-generación: instrucciones + descarga XML + botón "Marcar enviada". Botones primarios usan `color="brand"` (nunca `variant="gradient"`)
- **`RemittanceDetailPage.tsx`**: Detalle de remesa con estadísticas y lista de adeudos. Importes formateados con `formatMoney()` de `@/shared/utils/format-money.ts`. Fechas en formato español: `dd/MM/yyyy` usando `Intl.DateTimeFormat('es-ES')` o `dayjs` con locale `es`

### Paso 4: Páginas

- **`SepaConfigPage.tsx`**: `/settings/sepa` - formulario de configuración
- **`RemittancesPage.tsx`**: `/treasury/remittances` - listado + wizard de generación
- Integrar `MandateCard` en `MemberDetailPage` (UC-006) como nueva pestaña/sección

### Paso 5: Tests

- SepaConfigForm: validación del identificador funciona en tiempo real
- MandateForm: validación IBAN, upload documento, submit
- RemittanceWizard: 3 pasos navegan, preview se carga, generación funciona
- RemittanceResult: descarga XML funciona, marcar enviada funciona

## Criterios de aceptación

1. **Configuración SEPA validada:** El identificador de acreedor se valida en tiempo real con desglose visual de cada parte.

2. **Mandato registrado:** Se puede registrar un mandato con IBAN validado y documento firmado adjunto desde la ficha del socio.

3. **Remesa generada con preview:** El wizard muestra preview con desglose de tipos de secuencia antes de generar.

4. **XML descargable:** Tras generar, se puede descargar el fichero XML para subirlo al banco.

5. **Flujo post-generación claro:** Las instrucciones para enviar al banco son claras y el botón "Marcar como enviada" es un paso separado.
