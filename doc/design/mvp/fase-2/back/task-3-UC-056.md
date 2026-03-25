# Task 3 - UC-056: Importación masiva de socios (Backend)

## Información general

- **Fase:** 2
- **Tipo:** Backend
- **UC:** UC-056
- **Bounded Context:** Transversal (BC-Membership + BC-Identity)
- **Application Service:** `ImportacionService`
- **Aggregates:** `Member` (BC-Membership)
- **Prioridad:** Must

## Alcance

### Incluido

- Application Service `ImportacionService` con flujo completo: análisis de archivo, mapeo de columnas, validación, preview y ejecución
- Parseo de archivos Excel (.xlsx, .xls) y CSV con detección automática de codificación
- Endpoint REST para subida y análisis: `POST /api/v1/tenants/:tenantId/imports/upload`
- Endpoint REST para mapeo de columnas: `POST /api/v1/tenants/:tenantId/imports/:importId/mapping`
- Endpoint REST para validación y preview: `GET /api/v1/tenants/:tenantId/imports/:importId/validate`
- Endpoint REST para ejecución: `POST /api/v1/tenants/:tenantId/imports/:importId/execute`
- Gestión de duplicados por DNI (prioritario) y email (secundario): ignorar, sobrescribir o crear nuevo
- Plantillas de mapeo reutilizables por tenant
- Procesamiento síncrono para <500 registros, asíncrono con Bull Queue para >500
- Validación reutilizando Value Objects del dominio: `Dni.create()`, `Email.create()`, `Iban.validate()`
- Batch inserts: 100 registros por transacción
- Generación de informe de errores descargable
- Rollback transaccional completo en caso de fallo (FE-2)
- Auditoría completa de la operación
- Tests unitarios + tests de integración (importación de 100 socios)

### Excluido

- Frontend del asistente de importación (se implementa como task-6-UC-056 en frontend de Fase 2)
- Importación de datos financieros (cargos, pagos, suscripciones)
- Importación de mandatos SEPA
- Importación de campos personalizados específicos de colectividad (solo campos base)
- Creación automática de `MemberAccount` y `FeeSubscription` durante importación (se crea solo el Member)
- Progress bar en tiempo real vía WebSocket (el frontend consulta estado por polling)

## Dependencias

### Tareas previas requeridas

| Tarea                                       | Artefacto necesario                                                                               |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Fase 0 - Scaffold**                       | Estructura de módulos NestJS, Shared kernel, Bull Queue, MinIO/S3 para almacenamiento de archivos |
| **Fase 1 - UC-001 (Provisión de tenant)**   | Tenant provisionado con BD aislada                                                                |
| **Fase 1 - UC-008 (Tipos de socio)**        | `MemberType` configurados (para asignar tipo a socios importados)                                 |
| **Fase 1 - UC-011 (Alta simple de socio)**  | Aggregate `Member` con Value Objects (PersonalData, ContactData, IdentityDocument, BankDetails)   |
| **Fase 1 - UC-010 (Gestión de ejercicios)** | Ejercicio fiscal abierto (precondición para alta de socios)                                       |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `api/src/membership/domain/aggregates/member.ts` existe con factory method `Member.create()`
- [ ] `api/src/membership/domain/value-objects/identity-document.ts` existe con validación DNI/NIE mod23
- [ ] `api/src/membership/domain/value-objects/bank-details.ts` existe con validación IBAN mod97 y cifrado AES-256-GCM
- [ ] `api/src/shared/domain/value-objects/email.ts` existe con validación RFC 5322
- [ ] Bull Queue está configurado en el proyecto
- [ ] MinIO/S3 está configurado para almacenamiento de archivos temporales
- [ ] `api/prisma/tenant/schema.prisma` contiene modelo `Member` con campos obligatorios
- [ ] Librerías de parsing disponibles: `xlsx` (SheetJS) y `csv-parse` en `package.json`

### Artefactos producidos

| Artefacto                      | Consumido por                                |
| ------------------------------ | -------------------------------------------- |
| Endpoint de upload y análisis  | Frontend UC-056 (paso 1 del wizard)          |
| Endpoint de mapeo de columnas  | Frontend UC-056 (paso 2 del wizard)          |
| Endpoint de validación/preview | Frontend UC-056 (paso 3 del wizard)          |
| Endpoint de ejecución          | Frontend UC-056 (paso 4 del wizard)          |
| Socios creados en BD           | Todos los UCs de BC-Membership y BC-Treasury |
| Plantillas de mapeo guardadas  | Futuras importaciones del mismo tenant       |
| Informe de errores             | Frontend para descarga por el usuario        |

## Referencia de especificación

| Documento             | Contenido relevante                                                         |
| --------------------- | --------------------------------------------------------------------------- |
| `uc/uc-056.md`        | Flujo completo: subida, mapeo, validación, ejecución, gestión de duplicados |
| `us/us-148.md`        | Subida y análisis de estructura del archivo                                 |
| `us/us-149.md`        | Mapeo flexible de columnas                                                  |
| `us/us-150.md`        | Validación exhaustiva con preview                                           |
| `us/us-151.md`        | Ejecución con rollback y auditoría                                          |
| `bc/bc-membership.md` | Aggregate Member - estructura, Value Objects, invariantes                   |
| `adr/adr-002.md`      | Multi-tenant por BD: la importación opera sobre la BD del tenant            |

## Puntos críticos

1. **Atomicidad de la importación.** La importación opera como una transacción global. Si falla la creación de >5% de los registros, se ejecuta rollback completo: no se importa ningún socio (FE-2). Para importaciones parciales (FA-3), el usuario debe elegir explícitamente "Importar solo válidos". Batch inserts de 100 registros por transacción para performance.

2. **Reutilización de Value Objects para validación.** Las validaciones no se reimplementan: se reutilizan `Dni.create()`, `Email.create()`, `Iban.validate()` del dominio. Esto garantiza consistencia entre la importación y el alta individual. Un DNI inválido en importación se rechaza por la misma regla que en UC-011.

3. **Detección de duplicados.** Se detectan por DNI (prioritario) y email (secundario). El sistema ofrece 3 estrategias: ignorar (skip), sobrescribir (update) o crear nuevo (con advertencia). La estrategia se aplica globalmente a toda la importación, no por registro individual.

4. **Mapeo flexible de columnas.** El archivo puede tener cualquier estructura. El sistema analiza las columnas del archivo y el usuario mapea cada columna a un campo del sistema. Los campos obligatorios (nombre, apellidos, DNI/email) deben estar mapeados para poder continuar. Las plantillas de mapeo se guardan para reutilización.

5. **Seguridad en archivos subidos.** Validar extensión (.xlsx, .xls, .csv), tamaño máximo 10MB. El archivo se almacena temporalmente en MinIO/S3 y se elimina tras 24 horas. Nunca ejecutar contenido del archivo como código.

6. **Cifrado de datos sensibles.** Los IBAN importados deben cifrarse con AES-256-GCM antes de almacenar (RNF-006), igual que en el alta individual. El servicio de cifrado se reutiliza del existente.

## Riesgos

| Riesgo                                             | Probabilidad | Impacto | Mitigación                                                                                      |
| -------------------------------------------------- | ------------ | ------- | ----------------------------------------------------------------------------------------------- |
| Archivo con codificación no detectada              | Media        | Medio   | Usar `chardet` para detección automática. Fallback a UTF-8 con warning                          |
| Timeout en importaciones de >5000 registros        | Media        | Alto    | Bull Queue para >500 registros. Timeout del job: 5 minutos                                      |
| Datos inconsistentes en archivo (formatos mixtos)  | Alta         | Medio   | Validación exhaustiva con informe detallado de errores por fila y columna                       |
| Archivo con macros maliciosas (Excel)              | Baja         | Alto    | Usar solo lectura de datos con `xlsx` (SheetJS), que no ejecuta macros. Validar extensión       |
| Socios importados sin MemberAccount ni suscripción | Media        | Bajo    | Documentar que la importación solo crea el Member. La asignación de planes es un paso posterior |

## Plan de implementación

### Paso 1: Capa de dominio - Value Objects de importación

Crear en `api/src/imports/domain/value-objects/`:

- **`ImportFile`**: Value Object con `fileName: string`, `fileType: 'xlsx' | 'xls' | 'csv'`, `fileSize: number`, `storagePath: string`. Validación: extensión permitida, tamaño <= 10MB
- **`ColumnMapping`**: Value Object con `sourceColumn: string`, `targetField: string`, `isRequired: boolean`. Validación: campos obligatorios mapeados
- **`ImportMapping`**: Value Object con `mappings: ColumnMapping[]`, `duplicateStrategy: 'SKIP' | 'OVERWRITE' | 'CREATE_NEW'`
- **`ImportResult`**: Value Object con `totalProcessed: number`, `totalCreated: number`, `totalUpdated: number`, `totalSkipped: number`, `totalErrors: number`, `errors: ImportError[]`
- **`ImportError`**: Value Object con `row: number`, `column: string`, `value: string`, `errorMessage: string`

### Paso 2: Capa de dominio - Import entity y estados

Crear en `api/src/imports/domain/entities/`:

- **`Import`**: Entity que representa una operación de importación en progreso
  - `id: ImportId` (UUID)
  - `tenantId: string`
  - `status: ImportStatus` - enum: `UPLOADED`, `MAPPED`, `VALIDATED`, `EXECUTING`, `COMPLETED`, `FAILED`
  - `file: ImportFile`
  - `mapping?: ImportMapping`
  - `validationResult?: ImportResult` (resultado del preview)
  - `executionResult?: ImportResult` (resultado final)
  - `detectedColumns: string[]` - columnas detectadas en el archivo
  - `sampleRows: Record<string, string>[]` - primeras 10 filas para preview
  - `createdBy: string`
  - `createdAt: Date`
  - Transiciones de estado: UPLOADED → MAPPED → VALIDATED → EXECUTING → COMPLETED/FAILED

### Paso 3: Capa de dominio - Domain Services

Crear en `api/src/imports/domain/services/`:

- **`FileAnalyzer`**: Domain Service para análisis de archivos
  - `analyze(file: Buffer, fileType: string): { columns: string[], sampleRows: Record<string, string>[], totalRows: number }`
  - Usa `xlsx` para Excel, `csv-parse` para CSV
  - Detecta codificación con `chardet`
  - Retorna solo primeras 10 filas como sample

- **`ImportValidator`**: Domain Service para validación de datos
  - `validate(rows: Record<string, string>[], mapping: ImportMapping): ImportResult`
  - Para cada fila, aplica validaciones reutilizando Value Objects:
    - DNI → `IdentityDocument.create(value)` (mod23)
    - Email → `Email.create(value)` (RFC 5322)
    - IBAN → `BankDetails.validateIban(value)` (mod97)
    - Nombre/Apellidos → no vacíos
    - Fecha nacimiento → formato válido, edad razonable
  - Detecta duplicados por DNI/email contra BD existente
  - Retorna `ImportResult` con errores detallados por fila

- **`ImportExecutor`**: Domain Service para ejecución de importación
  - `execute(rows: Record<string, string>[], mapping: ImportMapping, tenantId: string): ImportResult`
  - Procesa en lotes de 100 registros por transacción
  - Para cada registro: crear `Member` aggregate vía factory method
  - Aplica estrategia de duplicados (skip/overwrite/create)
  - Cifra IBANs con AES-256-GCM
  - Si >5% de errores en un lote: rollback completo (modo "todo o nada")
  - Retorna resultado final

### Paso 4: Capa de dominio - Plantillas de mapeo

Crear en `api/src/imports/domain/entities/`:

- **`MappingTemplate`**: Entity para plantillas reutilizables
  - `id: string`, `tenantId: string`, `name: string`, `mapping: ImportMapping`, `createdAt: Date`
  - Persistida en tabla `import_mapping_templates`

### Paso 5: Capa de aplicación - Commands y DTOs

Crear en `api/src/imports/application/`:

- **Commands:**
  - `UploadImportFileCommand`: `{ tenantId, file: Buffer, fileName: string }`
  - `SetImportMappingCommand`: `{ importId, mappings: ColumnMapping[], duplicateStrategy }`
  - `ValidateImportCommand`: `{ importId }`
  - `ExecuteImportCommand`: `{ importId }`
  - `SaveMappingTemplateCommand`: `{ tenantId, name, importId }`

- **DTOs:**
  - `ImportUploadResponseDto`: `{ importId, detectedColumns, sampleRows, totalRows }`
  - `ImportMappingDto`: validación con `class-validator`
  - `ImportValidationResultDto`: `{ totalRows, validRows, invalidRows, duplicates, errors[] }`
  - `ImportExecutionResultDto`: `{ totalCreated, totalUpdated, totalSkipped, totalErrors, jobId? }`
  - `ImportErrorReportDto`: descargable como Excel con errores por fila

### Paso 6: Capa de aplicación - Handlers

Crear en `api/src/imports/application/commands/`:

- **`UploadImportFileHandler`**:
  1. Verificar permisos: `membership:members:import`
  2. Validar extensión y tamaño del archivo
  3. Almacenar archivo en MinIO/S3 con TTL de 24 horas
  4. Invocar `FileAnalyzer.analyze()` para detectar columnas y sample
  5. Crear entity `Import` con status `UPLOADED`
  6. Retornar `ImportUploadResponseDto`

- **`SetImportMappingHandler`**:
  1. Obtener `Import` en status `UPLOADED`
  2. Validar que los campos obligatorios están mapeados (nombre, apellidos, DNI o email)
  3. Actualizar `Import` con mapping y status `MAPPED`

- **`ValidateImportHandler`**:
  1. Obtener `Import` en status `MAPPED`
  2. Leer archivo completo desde MinIO/S3
  3. Invocar `ImportValidator.validate()` con todas las filas
  4. Actualizar `Import` con resultado de validación y status `VALIDATED`
  5. Retornar `ImportValidationResultDto`

- **`ExecuteImportHandler`**:
  1. Obtener `Import` en status `VALIDATED`
  2. Si `totalRows > 500`: encolar en Bull Queue, retornar `jobId`
  3. Si `totalRows <= 500`: ejecutar síncrono
  4. Actualizar status a `EXECUTING`
  5. Invocar `ImportExecutor.execute()`
  6. Actualizar status a `COMPLETED` o `FAILED`
  7. Registrar en auditoría: archivo, mapeo, resultado
  8. Reportar errores vía `ErrorReporter.captureException()` si hay fallos
  9. Retornar `ImportExecutionResultDto`

### Paso 7: Capa de infraestructura - File storage y parsers

Crear en `api/src/imports/infrastructure/`:

- **`S3FileStorageService`**: Almacenamiento temporal en MinIO/S3
  - `upload(file: Buffer, key: string): Promise<string>` (retorna path)
  - `download(key: string): Promise<Buffer>`
  - `delete(key: string): Promise<void>`
  - TTL: 24 horas (configurar lifecycle policy)

- **`ExcelParser`**: Parser de archivos Excel usando `xlsx`
  - `parse(buffer: Buffer): { columns: string[], rows: Record<string, string>[] }`
  - Soporte para .xlsx y .xls

- **`CsvParser`**: Parser de archivos CSV usando `csv-parse`
  - `parse(buffer: Buffer, encoding?: string): { columns: string[], rows: Record<string, string>[] }`
  - Detección automática de separador (`,`, `;`, `\t`)
  - Detección de codificación con `chardet`

### Paso 8: Capa de infraestructura - Controller

Crear en `api/src/imports/infrastructure/controllers/`:

- **`ImportsController`**:
  - `POST /api/v1/tenants/:tenantId/imports/upload` → Subida y análisis (multipart/form-data)
  - `POST /api/v1/tenants/:tenantId/imports/:importId/mapping` → Configurar mapeo
  - `GET /api/v1/tenants/:tenantId/imports/:importId/validate` → Validar y preview
  - `POST /api/v1/tenants/:tenantId/imports/:importId/execute` → Ejecutar importación
  - `GET /api/v1/tenants/:tenantId/imports/:importId/status` → Estado actual
  - `GET /api/v1/tenants/:tenantId/imports/:importId/errors` → Descargar informe de errores (Excel)
  - `POST /api/v1/tenants/:tenantId/imports/templates` → Guardar plantilla de mapeo
  - `GET /api/v1/tenants/:tenantId/imports/templates` → Listar plantillas guardadas
  - Protegidos con `@RequirePermissions('membership:members:import')`
  - Upload con `@UseInterceptors(FileInterceptor('file'))` de Multer
  - Swagger decorators, max file size 10MB

### Paso 9: Capa de infraestructura - Bull Queue Processor

Crear en `api/src/imports/infrastructure/jobs/`:

- **`ImportExecutionProcessor`**: Worker de Bull Queue
  - Recibe `ExecuteImportCommand` como payload
  - Ejecuta la misma lógica que el handler síncrono
  - Actualiza progreso del job: `job.progress(processedCount / totalCount * 100)`
  - Timeout: 5 minutos
  - Retry: 0 (no reintentar automáticamente, la importación es idempotente por diseño)

### Paso 10: Tests

**Tests unitarios (dominio):**

- `FileAnalyzer.analyze()` con archivo Excel válido → columnas y sample detectados
- `FileAnalyzer.analyze()` con CSV separado por `;` → detección correcta de separador
- `ImportValidator.validate()` con datos válidos → 0 errores
- `ImportValidator.validate()` con DNI inválido → error en fila específica
- `ImportValidator.validate()` con duplicado → detección correcta
- `ImportExecutor.execute()` con datos válidos → socios creados

**Tests unitarios (aplicación):**

- `UploadImportFileHandler` → análisis correcto del archivo
- `ValidateImportHandler` → validación completa con errores detallados
- `ExecuteImportHandler` con <500 registros → ejecución síncrona
- `ExecuteImportHandler` con >500 registros → delegación a Bull Queue

**Tests de integración:**

- Subida de archivo Excel, mapeo, validación y ejecución de 100 socios
- Verificar que los 100 socios están creados en la BD con datos correctos
- Importación con duplicados: verificar estrategia skip, overwrite
- Importación con errores: verificar rollback completo
- Importación de CSV con codificación ISO-8859-1 → detección y conversión correcta
- Plantillas de mapeo: guardar y reutilizar

## Criterios de aceptación

Derivados de US-148, US-149, US-150, US-151:

1. **Análisis de archivo correcto:** Al subir un archivo Excel o CSV, el sistema detecta las columnas y muestra las primeras 10 filas como muestra.

2. **Mapeo flexible de columnas:** El usuario puede mapear cualquier columna del archivo a cualquier campo del sistema. Los campos obligatorios deben estar mapeados para continuar.

3. **Validación exhaustiva con preview:** Antes de ejecutar, el sistema muestra cuántos registros son válidos, cuántos tienen errores y cuáles son duplicados. Los errores están detallados por fila y columna.

4. **Detección de duplicados por DNI/email:** El sistema detecta socios ya existentes y aplica la estrategia elegida (ignorar, sobrescribir o crear nuevo).

5. **Rollback ante fallo:** Si la importación falla, no se importa ningún socio. El usuario puede corregir y reintentar.

6. **Plantillas reutilizables:** Una configuración de mapeo se puede guardar y reutilizar en futuras importaciones con la misma estructura de archivo.

7. **Informe de errores descargable:** Los errores de validación se pueden descargar como archivo Excel con detalle por fila.
