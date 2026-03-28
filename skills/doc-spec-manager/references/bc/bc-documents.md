## 7. BC-Documents: Gestión Documental

### 7.1 Descripción

Repositorio centralizado de documentos de la entidad: estatutos, actas, facturas, justificantes. Incluye gestión del libro de actas obligatorio.

### 7.2 Aggregates

#### 7.2.1 Aggregate: Document

```
┌─────────────────────────────────────────────────────────────┐
│ DOCUMENT (Aggregate Root)                                   │
├─────────────────────────────────────────────────────────────┤
│ Identity: DocumentId                                        │
│                                                             │
│ Value Objects:                                              │
│   - MetadatosDocumento (nombre, descripcion, etiquetas)     │
│   - ArchivoFisico (path, tamaño, mimeType, hash)            │
│                                                             │
│ Properties:                                                 │
│   - categoriaId: CategoriaId                                │
│   - fechaDocumento: Date                                    │
│   - fechaSubida: DateTime                                   │
│   - subidoPor: UserId                                       │
│   - version: int                                            │
│   - documentoAnterior: DocumentId? (para versionado)        │
│   - estado: EstadoDocumento                                 │
│                                                             │
│ Invariants:                                                 │
│   - Tamaño <= límite del tenant                             │
│   - MimeType en lista permitida                             │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-038 (`documents`) [placeholder]

#### 7.2.2 Aggregate: Categoria

```
┌─────────────────────────────────────────────────────────────┐
│ CATEGORIA (Aggregate Root)                                  │
├─────────────────────────────────────────────────────────────┤
│ Identity: CategoriaId                                       │
│                                                             │
│ Properties:                                                 │
│   - nombre: string                                          │
│   - descripcion: string                                     │
│   - categoriaPadre: CategoriaId? (jerarquía)                │
│   - orden: int                                              │
│   - rolesAcceso: RolId[] (quién puede ver)                  │
│   - esSistema: boolean                                      │
│                                                             │
│ Invariants:                                                 │
│   - No ciclos en jerarquía                                  │
│   - Categorías sistema no eliminables                       │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-039 (`document_categories`) [placeholder]

#### 7.2.3 Aggregate: Acta

```
┌─────────────────────────────────────────────────────────────┐
│ ACTA (Aggregate Root)                                       │
├─────────────────────────────────────────────────────────────┤
│ Identity: ActaId                                            │
│                                                             │
│ Value Objects:                                              │
│   - NumeroActa (correlativo automático)                     │
│                                                             │
│ Entities:                                                   │
│   - Asistente[] (memberId, firma?)                          │
│   - Acuerdo[] (descripcion, votacion?)                      │
│                                                             │
│ Properties:                                                 │
│   - tipoReunion: TipoReunion                                │
│   - fecha: Date                                             │
│   - lugar: string                                           │
│   - horaInicio: Time                                        │
│   - horaFin: Time                                           │
│   - ordenDelDia: string[]                                   │
│   - estado: EstadoActa                                      │
│   - documentoId: DocumentId? (PDF generado)                 │
│   - firmadaPor: UserId? (secretario)                        │
│   - vistobuenoPor: UserId? (presidente)                     │
│                                                             │
│ Invariants:                                                 │
│   - Número correlativo único                                │
│   - Quórum mínimo según tipo reunión                        │
└─────────────────────────────────────────────────────────────┘
```

**Tabla Prisma:** ENT-040 (`meeting_minutes`) [placeholder]

### 7.3 Domain Events

BC-Documents emite eventos relacionados con la generación y gestión de documentos:
| Evento | Trigger | Payload | Consumidores |
|--------|---------|---------|--------------|
| `AssemblyReportGenerated` | Informe de Asamblea General generado | informeId, fiscalYearId, tipoInforme, fechaGeneracion, generadoPor | BC-Documents (almacenar en repositorio) |

**Notas:**

- `AssemblyReportGenerated`: Genera informe de Asamblea General con datos económicos y de membresía del ejercicio

### 7.4 Trazabilidad RF

| RF        | Elemento de Dominio                              |
| --------- | ------------------------------------------------ |
| N7RF01-03 | Document (Aggregate), MetadatosDocumento         |
| N7RF04-05 | ArchivoFisico, previsualización                  |
| N7RF06-07 | Búsqueda por metadatos, Categoria.rolesAcceso    |
| N7RF08    | Límite almacenamiento (configuración tenant)     |
| N7RF09-12 | Versionado, OCR, búsqueda full-text (avanzado)   |
| N6RF17-23 | Acta (Aggregate) - movido desde BC-Communication |
