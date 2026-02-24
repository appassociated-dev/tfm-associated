---
name: release-generator
description: >
  Cierra una versión del proyecto generando toda la documentación de release.
  Ejecuta un proceso secuencial de 4 pasos: genera el documento detallado de release
  en doc/releases/X.Y.Z.md (usando doc/releases/template.md), mueve los bloques de
  [Unreleased] íntegramente a doc/agents-sessions/changelog-sessions.md mediante script,
  crea la sección versionada agregada en CHANGELOG.md y limpia [Unreleased].
  Trigger: cerrar versión, generar release, crear release notes, publicar versión,
  release X.Y.Z, cerrar sprint, documentar release.
metadata:
  author: Adrián Cester
  version: "1.0.0"
  scope: [root]
allowed-tools: Read, Edit, Write, Bash
---

# Release Generator

Genera la documentación completa al cerrar una versión. Orquesta 4 pasos
sobre 4 archivos usando los archivos de sesión y el `[Unreleased]` del CHANGELOG.md
como fuente única de verdad.

## Archivos implicados

| Archivo | Rol |
|---------|-----|
| `CHANGELOG.md` | Fuente de sesiones → recibe sección versionada → `[Unreleased]` queda vacío |
| `doc/agents-sessions/YYYYMMDD-XXX-*.md` | Fuente de detalle para el release note |
| `doc/agents-sessions/changelog-sessions.md` | Destino de los bloques de `[Unreleased]` (íntegros) |
| `doc/releases/template.md` | Base para generar el release note |
| `doc/releases/X.Y.Z.md` | Release note generado (nuevo archivo) |

---

## Workflow (secuencial, respetar orden)

### Paso 0: Verificar prerrequisitos y confirmar con el usuario

Este skill requiere que los skills `session-manager` y `changelog-updater` hayan estado activos
durante el desarrollo del periodo a liberar. Sin ellos, no existirán archivos de sesión ni el
`[Unreleased]` del CHANGELOG.md tendrá el formato esperado.

**Verificaciones previas (detener si alguna falla):**

1. `CHANGELOG.md` existe en la raíz del proyecto
2. `CHANGELOG.md` contiene una sección `## [Unreleased]` con al menos un bloque de sesión
   con formato `### YYYYMMDD-XXX-{user}-{agent}` — si está vacía o solo dice
   `[Vacío pendiente...]`, no hay nada que liberar
3. Los archivos de sesión referenciados en los bloques (`**Documento de sesión:**`) existen
   en `doc/agents-sessions/`

Si alguna verificación falla, informar al usuario indicando exactamente qué falta y detener
el proceso.

**Una vez verificado, confirmar con el usuario:**
- Número de versión (`X.Y.Z`)
- Tipo de release: Patch | Minor | Major
- Si dispone de métricas de tests/cobertura (o si deben obtenerse por comandos)

### Paso 1: Recopilar información

Leer y extraer:
1. Bloques de sesión de `[Unreleased]` en `CHANGELOG.md`
2. Archivos de sesión `doc/agents-sessions/` referenciados en esos bloques
3. Commits del periodo con `git log --oneline` entre hashes inicial y final
4. Fecha actual: `date +%Y-%m-%d` y `date "+%d de %B de %Y"`

Ver guía completa de recopilación: [`references/release-process.md`](references/release-process.md)

### Paso 2: Generar `doc/releases/X.Y.Z.md`

1. Leer `doc/releases/template.md`
2. Crear `doc/releases/X.Y.Z.md` con el contenido del template
3. Rellenar todos los placeholders `[...]` con información real
4. Las secciones VARIABLES (Características, Mejoras, Historial, Lecciones) se redactan
   consolidando la información de todos los archivos de sesión
5. Las secciones FIJAS (Testing, Contribuidores, Migración, Checklist) se rellenan
   con datos del proyecto

Ver detalle de secciones: [`references/release-process.md`](references/release-process.md)

### Paso 3: Generar borrador de sección versionada en `CHANGELOG.md`

Ejecutar el script desde la raíz del proyecto:

```bash
# Con Python (preferido)
python3 scripts/create_release_draft.py X.Y.Z --type [Patch|Minor|Major]

# Con shell (si Python no está disponible)
bash scripts/create_release_draft.sh X.Y.Z --type [Patch|Minor|Major]
```

El script genera automáticamente:
- La cabecera `## [X.Y.Z]` con fecha, periodo de desarrollo y enlaces a sesiones
- Las entradas en bruto de Added/Changed/Fixed/Removed extraídas de todos los bloques
- Un aviso `⚠️ BORRADOR` con los campos `[COMPLETAR]` pendientes

### Paso 4: Revisar y refinar el borrador

El agente revisa la sección `## [X.Y.Z]` generada en `CHANGELOG.md`:
1. Deduplicar entradas repetidas entre sesiones
2. Mejorar redacción si es necesario
3. Completar los campos `[COMPLETAR]` (tests, cobertura) — solicitar al usuario o ejecutar comandos
4. Eliminar el aviso `⚠️ BORRADOR`

Ver formato final esperado: [`references/changelog-closure-format.md`](references/changelog-closure-format.md)

### Paso 5: Mover `[Unreleased]` a `changelog-sessions.md`

**CRÍTICO: Ejecutar solo después de que el borrador esté revisado y finalizado.**

```bash
# Con Python (preferido)
python3 scripts/move_unreleased.py X.Y.Z

# Con shell (si Python no está disponible)
bash scripts/move_unreleased.sh X.Y.Z
```

El script:
- Crea `doc/agents-sessions/changelog-sessions.md` si no existe
- Mueve los bloques de sesión íntegramente con su cabecera de versión
- Limpia `[Unreleased]` en `CHANGELOG.md`

> Los scripts están en `release-generator/scripts/`, copiarlos al proyecto si es necesario.

---

## Principios CRÍTICOS

- **Fuente de verdad**: `[Unreleased]` + archivos de sesión → no inventar información
- **Íntegridad al mover**: los bloques de sesión van a `changelog-sessions.md` SIN modificar
- **Agregación en CHANGELOG.md**: la sección versionada consolida todas las sesiones, no las lista por separado
- **Orden de pasos**: respetar secuencia (no actualizar CHANGELOG.md antes de generar el release note)
- **Confirmación previa**: siempre confirmar versión con el usuario antes de ejecutar

---

## Referencias Completas

- [`references/release-process.md`](references/release-process.md) — Guía detallada por paso: qué recopilar, cómo redactar secciones, comandos git
- [`references/changelog-closure-format.md`](references/changelog-closure-format.md) — Formato exacto del CHANGELOG.md tras el cierre
- [`scripts/create_release_draft.py`](scripts/create_release_draft.py) — Genera borrador de sección versionada (Paso 3)
- [`scripts/create_release_draft.sh`](scripts/create_release_draft.sh) — Ídem, fallback shell sin Python
- [`scripts/move_unreleased.py`](scripts/move_unreleased.py) — Mueve [Unreleased] y limpia CHANGELOG.md (Paso 5)
- [`scripts/move_unreleased.sh`](scripts/move_unreleased.sh) — Ídem, fallback shell sin Python
