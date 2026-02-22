---
name: doc-spec-generator
description: >
  Generación, actualización y creación guiada de documentos de especificación en spec/ asi como la generación de los archivos fragmentados para doc-spec-manager a partir de los documentos fuente en spec/.
  Usar cuando: 
  (1) se hayan modificado documentos en spec/,
  (2) se necesite regenerar las referencias del doc-spec-manager,
  (3) se quiera validar la integridad de las referencias actuales,
  (4) se quiera crear un nuevo documento spec/ o añadir entidades a uno existente.
---

# Doc Spec Generator

Transforma los documentos de `spec/` en fragmentos atómicos optimizados para
agentes en `doc-spec-manager/references/`. Toda la generación es determinista
(scripts Python, sin LLM): la misma entrada siempre produce la misma salida.

También guía la creación de nuevos documentos spec/ y la extensión de los
existentes, asegurando que la estructura sea parseable por los extractores.

## Workflows

### 1. Regeneración Completa

Ejecutar después de cualquier modificación en `spec/`:

```bash
python3 .agents/skills/doc-spec-generator/scripts/generate_all.py
```

Pasos automáticos:
1. Verificar que los 8 archivos spec/ existen.
2. Limpiar references/ (elimina huérfanos).
3. Ejecutar 8 scripts `extract_*.py` → 619 fragmentos.
4. Ejecutar 8 scripts `gen_head_*.py` → 8 head files.
5. Validar integridad → 627 archivos, ~6 segundos.

### 2. Solo Validación

```bash
python3 .agents/skills/doc-spec-generator/scripts/validate_references.py
```

### 3. Crear un Nuevo Documento spec/

Workflow guiado para crear un nuevo archivo en `spec/` que sea parseable.

#### Paso 1: Estructura del documento

Todo documento spec/ DEBE seguir esta estructura:

```markdown
# Título del Documento

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas
**Versión:** 1.0
**Fecha:** {Mes} {Año}
**Inputs:** {documentos de entrada, ej: KB-003 (Requisitos Funcionales)}
**Estado:** {Borrador | Validado | Aprobado | Verificado}
**Total {Tipo}:** {N}

---

## Índice

1. [{Sección 1}](#{anchor})
2. [{Sección 2}](#{anchor})
...

---

## {Sección H2}

### {Código}: {Título}

{Contenido del item...}

---

### {Código}: {Título}

{Contenido del item...}
```

**Requisitos críticos para el parser:**
- El header H1 + metadatos van ANTES del primer H2.
- El Índice es una sección H2 cuyo título empieza con "Índice".
- Cada item tiene un heading con un **código único** seguido de `:` y título.
- Los items se separan opcionalmente con `---`.

#### Paso 2: Patrones de heading por tipo de entidad

El parser divide por headings con regex. Cada tipo de entidad tiene su patrón:

| Tipo | Nivel | Patrón del heading | Ejemplo |
|------|-------|-------------------|---------|
| RF | H3 | `### N{x}RF{yy}: {título}` | `### N2RF01: Aislamiento Multi-Tenant` |
| RNF | H3 | `### RNF-{xxx}: {título}` | `### RNF-001: Autenticación de Usuarios` |
| BC | H2 | `## {N}. BC-{Name}: {título}` | `## 3. BC-Membership: Gestión de Socios` |
| ADR | H2 | `## ADR-{xxx}: {título}` | `## ADR-001: Arquitectura General` |
| Stack | H2 | `## {N}. {título}` | `## 2. Backend` |
| RNFT | H3 | `### {N}.{M} RNFT-{xxx}: {título}` | `### 2.1 RNFT-001: Autenticación con JWT` |
| US | H4 | `#### US-{xxx}: {título}` | `#### US-001: Aislamiento de datos` |
| UC | H3 | `### UC-{xxx}: {título}` | `### UC-001: Provisión de nuevo tenant` |

**IMPORTANTE**: Si el heading no sigue exactamente el patrón, el parser NO lo detectará.

#### Paso 3: Campos de trazabilidad obligatorios

Cada tipo de entidad debe incluir campos de trazabilidad en su contenido:

**RF:**
```markdown
### N{x}RF{yy}: {Título}

**Qué es:** {descripción}
**Problema que resuelve:** {problema}
```

**RNF:**
```markdown
### RNF-{xxx}: {Título}

**Descripción:** {descripción}
**Criterios de aceptación:**
- {criterio 1}
- {criterio 2}
**Trazabilidad RF:** {N{x}RF{yy}, ...}
```

**RNFT:**
```markdown
### {N}.{M} RNFT-{xxx}: {Título}

**RNF Base:** RNF-{xxx} ({nombre del RNF})
{Implementación técnica con código...}
**Métricas:**
- {métrica 1}
```

**US:**
```markdown
#### US-{xxx}: {Título}
**RF Origen:** N{x}RF{yy}
**Prioridad:** {Must | Should | Could | Won't}

> Como **{rol}**,
> quiero {acción},
> para {beneficio}.

**Criterios de Aceptación:**
```gherkin
Scenario: {nombre}
  Given {contexto}
  When {acción}
  Then {resultado}
```
```

**UC:**
```markdown
### UC-{xxx}: {Título}

#### Metadatos
- **User Stories:** US-{xxx}, US-{yyy}
- **Bounded Context:** BC-{Name}
- **Application Service:** `{NombreService}`
- **Aggregates:** **{NombreAggregate}**
- **Prioridad:** {Must | Should | Could}

**Descripción:** {descripción}

#### Actores
#### Precondiciones
#### Flujo Normal
#### Flujos Alternativos
#### Flujos de Excepción
#### Domain Events Emitidos
#### Postcondiciones
```

#### Paso 4: Codificación secuencial

Para determinar el siguiente código disponible:

```
# Último RF de sección N4:
ls references/rf/n4rf*.md | sort | tail -1
# → n4rf38.md → siguiente: N4RF39

# Último RNF:
ls references/rnf/ | sort | tail -1
# → rnf-066.md → siguiente: RNF-067

# Último US:
ls references/us/ | sort | tail -1
# → us-202.md → siguiente: US-203

# Último UC:
ls references/uc/ | sort | tail -1
# → uc-076.md → siguiente: UC-077
```

#### Paso 5: Contexto de secciones padre

Los items H3/H4 heredan contexto de sus secciones H2 (y H3 para US):

```markdown
## N4: Necesidades de Tesorería        ← contexto H2 para RFs H3

### N4RF01: Configuración de Cuotas     ← RF dentro de sección N4
```

```markdown
## 3. BC-Treasury                       ← contexto H2 para USs

### 3.1 Configuración de Planes         ← contexto H3 para USs H4

#### US-042: Crear plan de cuota        ← US con contexto dual (H2 + H3)
```

El parser captura automáticamente este contexto y lo añade como blockquote
al inicio del fragmento extraído.

### 4. Añadir Entidades a un Documento Existente

1. **Leer el documento spec/** correspondiente para entender la estructura.
2. **Usar doc-spec-manager** para verificar reglas de consistencia y trazabilidad.
3. **Añadir las nuevas entidades** respetando el patrón de heading exacto.
4. **Regenerar**: `python3 scripts/generate_all.py`.
5. **Verificar** que los nuevos fragmentos aparecen en references/.

### 5. Añadir un Nuevo Tipo de Documento spec/

Si se crea un archivo completamente nuevo (ej. `011_nuevo.md`):

1. Crear el documento siguiendo la estructura de Paso 1.
2. Crear `extract_nuevo.py`:
   - Importar `lib_parser` (split_by_heading o split_h2_sections).
   - Definir SPEC_FILE, HEADING_PATTERN, HEADING_LEVEL, OUTPUT_SUBDIR.
   - Implementar `extract(spec_dir, output_dir) -> list[str]`.
3. Crear `gen_head_nuevo.py`:
   - Usar extract_header_block, extract_index_section, extract_trailing_sections.
   - Implementar `generate(spec_dir, output_dir) -> str`.
4. Registrar en `generate_all.py` (imports + listas).
5. Registrar en `validate_references.py` (ENTITY_TYPES + EXPECTED_HEAD_FILES).
6. Crear subdirectorio en references/ (se crea automáticamente en FRAGMENT_SUBDIRS).
7. Actualizar SKILL.md de doc-spec-manager con el nuevo tipo.
8. Ejecutar `generate_all.py` y verificar.

## Mapeo Fuente → Fragmentos

| Fuente en spec/ | Script | Output en references/ |
|---|---|---|
| `003_requisitos-funcionales.md` | `extract_rf.py` + `gen_head_rf.py` | `rf/` + `head-requisitos-funcionales.md` |
| `004_rnf-base.md` | `extract_rnf.py` + `gen_head_rnf.py` | `rnf/` + `head-requisitos-no-funcionales.md` |
| `005_modelo-dominio.md` | `extract_bc.py` + `gen_head_bc.py` | `bc/` + `head-modelo-dominio.md` |
| `006_adrs.md` | `extract_adr.py` + `gen_head_adr.py` | `adr/` + `head-adrs.md` |
| `007_stack.md` | `extract_stack.py` + `gen_head_stack.py` | `stack/` + `head-stack.md` |
| `008_rnf-tecnicos.md` | `extract_rnft.py` + `gen_head_rnft.py` | `rnft/` + `head-requisitos-no-funcionales-tech.md` |
| `009_user-stories.md` | `extract_us.py` + `gen_head_us.py` | `us/` + `head-user-stories.md` |
| `010_casos-uso.md` | `extract_uc.py` + `gen_head_uc.py` | `uc/` + `head-use-cases.md` |

## Scripts

| Script | Función |
|---|---|
| `lib_parser.py` | Librería compartida: parsing, split por heading, code fence handling |
| `extract_*.py` | Fragmentan un documento spec/ en archivos individuales |
| `gen_head_*.py` | Generan head-*.md (metadatos + índice + resúmenes) |
| `generate_all.py` | Orquestador: limpia + genera + valida |
| `validate_references.py` | Validación de integridad post-generación |
| `test_lib_parser.py` | 108 tests para lib_parser.py |

### Ejecutar tests

```bash
python3 .agents/skills/doc-spec-generator/scripts/test_lib_parser.py
```

## Principios de Diseño

- **Determinismo**: sin LLM, sin timestamps, sin estado. Idempotente.
- **spec/ es la fuente de verdad**: nunca editar references/ directamente.
- **Code fence awareness**: el parser ignora `#` dentro de bloques ```.
- **Lowercase kebab-case**: todos los nombres de archivo generados.
