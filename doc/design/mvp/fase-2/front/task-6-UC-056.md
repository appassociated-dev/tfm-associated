# Task 6 — UC-056: Importación masiva de socios (Frontend)

## Información general

- **Fase:** 2
- **Tipo:** Frontend
- **UC:** UC-056
- **Bounded Context:** Transversal (BC-Membership)
- **Prioridad:** Must

## Alcance

### Incluido

- Asistente de importación paso a paso (`/tools/import/members`) con 5 pasos: Subir → Mapear → Validar → Revisar → Importar
- Paso 1 — Subida: Dropzone para archivos Excel/CSV con validación de formato y tamaño (max 10MB)
- Paso 2 — Mapeo: interfaz de mapeo columna origen → campo destino con drag-and-drop o selects
- Paso 3 — Validación: preview de datos con resaltado de errores por fila y columna
- Paso 4 — Revisión: resumen de registros válidos, inválidos y duplicados con estrategia de duplicados (ignorar/sobrescribir/crear)
- Paso 5 — Ejecución: barra de progreso, resultado final, descarga de informe de errores
- Plantillas de mapeo guardadas y reutilizables
- Indicador de progreso para importaciones asíncronas (polling)
- Descarga de informe de errores como Excel
- TanStack Query hooks para cada paso del wizard
- Validación Zod de DTOs de cada paso
- Tests unitarios (componentes + hooks)

### Excluido

- Importación de datos financieros (cargos, pagos)
- Drag-and-drop para reordenar columnas en mapeo (usar selects simples)
- Edición inline de datos en preview
- Descarga de plantilla Excel vacía con columnas esperadas

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F2-Back Task 3 — UC-056** | Endpoints REST: upload, mapping, validate, execute, status, errors, templates |
| **F1-Front Task 1 — UC-002** | AuthProvider, usePermissions(), HttpClient |

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/tools/import/members` | Navegación de herramientas |
| Componente `FileDropzone` reutilizable | Futuras importaciones |
| Componente `ColumnMapper` reutilizable | Futuras importaciones |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `doc/brand/001-associated-brand-foundation.md` | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |
| `uc/uc-056.md` | Flujo completo de importación: 5 pasos del wizard |
| `us/us-148.md` a `us/us-151.md` | Criterios por paso: subida, mapeo, validación, ejecución |

## Puntos críticos

1. **Mapeo visual de columnas.** El usuario ve las columnas del archivo a la izquierda y los campos del sistema a la derecha. Usa selects para mapear. Los campos obligatorios (nombre, apellidos, DNI/email) se marcan con asterisco y deben mapearse para continuar.

2. **Preview con errores resaltados.** La tabla de preview muestra las primeras 10 filas con celdas erróneas resaltadas en rojo. Al hover, muestra tooltip con el error específico. Contador de errores totales visible.

3. **Estrategia de duplicados clara.** Radio buttons con explicación: "Ignorar (no importar)", "Sobrescribir (actualizar datos)", "Crear nuevo (con advertencia)". Contador de duplicados detectados visible.

## Plan de implementación

### Paso 1: Schemas y tipos

- `importUploadResponseSchema`: importId, detectedColumns, sampleRows, totalRows
- `columnMappingSchema`: sourceColumn, targetField, isRequired
- `importValidationSchema`: totalRows, validRows, invalidRows, duplicates, errors[]
- `importExecutionSchema`: totalCreated, totalUpdated, totalSkipped, totalErrors, jobId?

### Paso 2: API hooks

- `useUploadImportFile()`: mutation (multipart/form-data)
- `useSetImportMapping()`: mutation
- `useValidateImport(importId)`: query
- `useExecuteImport()`: mutation
- `useImportStatus(importId)`: query con polling 3s
- `useImportErrors(importId)`: query para descargar errores (blob Excel)
- `useMappingTemplates()`: query para listar plantillas
- `useSaveMappingTemplate()`: mutation

### Paso 3: Componentes

- **`ImportWizard.tsx`**: Stepper de 5 pasos con Mantine Stepper
  - Paso 1: **`FileUploadStep.tsx`** — Dropzone con validación de formato/tamaño, muestra nombre y tamaño del archivo
  - Paso 2: **`ColumnMappingStep.tsx`** — Tabla de mapeo: columna origen (texto) → select de campo destino. Campos obligatorios marcados. Opción de cargar plantilla guardada
  - Paso 3: **`ValidationPreviewStep.tsx`** — Tabla de preview con 10 filas, celdas erróneas resaltadas (celdas con error usan `color="red"` con fondo `red.0`), contador de errores, resumen de duplicados
  - Paso 4: **`ReviewStep.tsx`** — Resumen: válidos/inválidos/duplicados con radio de estrategia de duplicados. Opción "Importar solo válidos". Botón "Guardar plantilla" usa `color="brand"` (nunca `variant="gradient"`). Indicadores de estado usan `Badge` con `variant="light"` y `radius="sm"`
  - Paso 5: **`ExecutionStep.tsx`** — Barra de progreso, resultado final, botón de descarga de informe de errores. Botón "Importar" usa `color="brand"` (nunca `variant="gradient"`)
- **`FileDropzone.tsx`**: Componente Mantine Dropzone configurado para Excel/CSV, max 10MB. Iconos del dropzone usan `@tabler/icons-react` (ej: `IconUpload`, `IconFileSpreadsheet`)
- **`ColumnMapper.tsx`**: Fila de mapeo: label columna origen + Select de campo destino
- **`ValidationErrorsTable.tsx`**: Tabla con celdas erróneas resaltadas y tooltips. Celdas con error usan `color="red"` con fondo `red.0` para resaltar
- **`ImportResultCard.tsx`**: Card con resumen final: creados, actualizados, saltados, errores. Todos los iconos deben usar `@tabler/icons-react` exclusivamente

### Paso 4: Página principal

- **`MemberImportPage.tsx`**: Página `/tools/import/members` con el ImportWizard como contenido principal

### Paso 5: Tests

- FileDropzone: acepta xlsx/csv, rechaza otros formatos, rechaza >10MB
- ColumnMapper: mapeo funciona, campos obligatorios validados
- ValidationPreview: errores resaltados, tooltip funciona
- ReviewStep: radio de estrategia funciona, conteos correctos
- ExecutionStep: polling funciona, resultado se muestra, descarga de errores

## Criterios de aceptación

1. **Subida de archivo:** Se puede subir un archivo Excel o CSV. Se muestran las columnas detectadas y las primeras filas.

2. **Mapeo de columnas:** El usuario mapea columnas del archivo a campos del sistema. No puede continuar sin mapear campos obligatorios.

3. **Preview con errores:** Los errores se muestran resaltados en la tabla de preview con detalle por celda.

4. **Gestión de duplicados:** Se muestran los duplicados detectados y el usuario elige estrategia antes de importar.

5. **Resultado con informe:** Tras importar, se muestra resultado con conteos y se puede descargar informe de errores.
