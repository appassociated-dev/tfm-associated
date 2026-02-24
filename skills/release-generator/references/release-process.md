# Guía Detallada del Proceso de Release

## Tabla de Contenidos

1. [Paso 1: Recopilar información](#paso-1)
2. [Paso 2: Generar el release note](#paso-2)
3. [Paso 3: Generar borrador de sección versionada](#paso-3)
4. [Paso 4: Revisar y refinar el borrador](#paso-4)
5. [Paso 5: Mover Unreleased a changelog-sessions.md](#paso-5)

---

## Paso 1: Recopilar información

### Desde CHANGELOG.md [Unreleased]

- Identificar todos los bloques de sesión `### YYYYMMDD-XXX-{user}-{agent}`
- Extraer la lista de archivos de sesión referenciados en cada bloque
- Recopilar los cambios listados en Added / Changed / Fixed / Removed de cada bloque

### Desde los archivos de sesión

Leer cada `doc/agents-sessions/YYYYMMDD-XXX-{user}-{agent}.md` para extraer:
- Decisiones técnicas relevantes
- Problemas encontrados y soluciones aplicadas
- Lecciones aprendidas
- Archivos modificados y commits asociados

### Desde git

```bash
# Commits del periodo (entre el último release y HEAD)
git log --oneline [hash-ultimo-release]..HEAD

# Hash del primer commit del periodo
git log --oneline [hash-ultimo-release]..HEAD | tail -1

# Hash del último commit
git log --oneline -1

# Commits agrupados por tipo
git log [hash-inicial]..HEAD --pretty=format:"%s" | grep -oE "^[a-z]+(\([a-z]+\))?:" | sort | uniq -c

# Archivos modificados en el periodo
git diff --stat [hash-inicial]..HEAD
```

### Métricas de tests y cobertura

Si el proyecto tiene scripts de test, ejecutarlos para obtener datos actuales.
Si no están disponibles, solicitar al usuario los valores antes de continuar.

### Fecha del release

```bash
date +%Y-%m-%d          # Para encabezado CHANGELOG: 2026-02-19
date "+%d de %B de %Y"  # Para documentos: 19 de febrero de 2026
```

### Periodo de desarrollo

- **Inicio:** fecha del primer archivo de sesión referenciado en `[Unreleased]`
- **Fin:** fecha actual (del release)

---

## Paso 2: Generar el release note

### Proceso

1. Leer `doc/releases/template.md` íntegramente
2. Crear `doc/releases/X.Y.Z.md` con ese contenido
3. Reemplazar los placeholders globales primero:
   - `[VERSION]` → número de versión (ej: `1.2.0`)
   - `[X.Y.Z]` → ídem
   - `[DD de MMMM de YYYY]` → fecha larga del release
   - `[YYYY-MM-DD]` → fecha corta del release

### Secciones FIJAS (rellenar con datos objetivos)

Estas secciones tienen estructura fija y se rellenan con datos reales:

- **Encabezado**: versión, fecha, tipo de release
- **Calidad y Testing**: tablas de cobertura, número de tests, suites
- **Contribuidores**: extraer de `git shortlog -sn`
- **Documentación Actualizada**: listar archivos creados/modificados en el periodo
- **Migración**: backward compatible (Patch/Minor) o breaking changes (Major)
- **Referencias**: commits del periodo con hashes reales
- **Estadísticas**: commits por tipo, líneas modificadas
- **Checklist**: marcar ítems completados

### Secciones VARIABLES (redactar consolidando sesiones)

Estas secciones requieren síntesis y criterio editorial:

- **Resumen Ejecutivo**: 2-3 párrafos describiendo qué aporta este release al proyecto. Extraer de los bloques de sesión y archivos de sesión.
- **Características Principales**: las features o mejoras más importantes del release, con ejemplos de uso si aplica. Consolidar desde los `Added` de las sesiones.
- **Mejoras y Correcciones**: detallar correcciones y refactorizaciones. Extraer de `Changed` y `Fixed`.
- **Historial de Desarrollo**: describir el proceso seguido, fases si las hubo, metodología. Extraer de los archivos de sesión.
- **Lecciones Aprendidas**: aprendizajes técnicos del periodo. Extraer de secciones "Notas y Aprendizajes" de los archivos de sesión.
- **Problemas Resueltos**: bugs o limitaciones concretas que se resolvieron. Extraer de `Fixed` y archivos de sesión.
- **Roadmap Futuro**: proponer próximas versiones basándose en los "Próximos Pasos" de los archivos de sesión.

### Criterio de nivel de detalle

El release note es el documento **más exhaustivo** del ciclo. A diferencia del CHANGELOG.md (que es resumen), aquí se incluye:
- Código de ejemplo cuando ilustra una funcionalidad importante
- Análisis commit a commit si ayuda a entender el progreso
- Decisiones arquitectónicas con alternativas consideradas
- Métricas con evolución (estado inicial → estado final)

---

## Paso 3: Generar borrador de sección versionada

Ejecutar el script desde la raíz del proyecto:

```bash
# Con Python (preferido)
python3 scripts/create_release_draft.py X.Y.Z --type [Patch|Minor|Major]

# Con shell (si Python no está disponible)
bash scripts/create_release_draft.sh X.Y.Z --type [Patch|Minor|Major]
```

El script extrae automáticamente de los bloques de sesión en `[Unreleased]`:
- Cabecera con fecha, tipo, periodo de desarrollo y enlaces a sesiones
- Todas las entradas de Added/Changed/Fixed/Removed en bruto
- Información de git (commits, hashes) si hay tags disponibles
- Campos `[COMPLETAR]` para los datos que requieren intervención manual (tests, cobertura)

El resultado es una sección `## [X.Y.Z]` en `CHANGELOG.md` marcada con `⚠️ BORRADOR`.

---

## Paso 4: Revisar y refinar el borrador

El agente revisa la sección generada en `CHANGELOG.md`:

1. **Deduplicar**: eliminar entradas repetidas entre sesiones
2. **Redacción**: mejorar claridad si alguna entrada es demasiado técnica o ambigua
3. **Completar `[COMPLETAR]`**: solicitar al usuario métricas de tests/cobertura o ejecutar:
   ```bash
   npm test -- --coverage   # o el comando equivalente del proyecto
   ```
4. **Eliminar** la línea `⚠️ BORRADOR` una vez revisado

---

## Paso 5: Mover Unreleased a changelog-sessions.md

**CRÍTICO:** Ejecutar solo después de que el borrador esté revisado y finalizado.

```bash
# Con Python (preferido)
python3 scripts/move_unreleased.py X.Y.Z

# Con shell (si Python no está disponible)
bash scripts/move_unreleased.sh X.Y.Z
```

El script hace todo automáticamente:
- Crea `doc/agents-sessions/changelog-sessions.md` si no existe
- Inserta un bloque `## Sesiones del release [X.Y.Z] - YYYY-MM-DD` con los bloques de sesión íntegros
- Limpia la sección `[Unreleased]` en `CHANGELOG.md`

**CRÍTICO:** No editar el contenido manualmente en este paso. El script garantiza la integridad del traslado.

---

## Paso 4: Actualizar CHANGELOG.md

Ver formato exacto: [`changelog-closure-format.md`](changelog-closure-format.md)

### Operación 1: Crear sección versionada

Insertar inmediatamente después de `---` (separador que cierra `[Unreleased]`) y antes del release anterior.

La información de Added/Changed/Fixed/Removed se **agrega** de todas las sesiones:
- Eliminar duplicados
- Agrupar entradas relacionadas
- Mantener concisión (igual que en los bloques de sesión individuales)

### Operación 2: Vaciar [Unreleased]

Reemplazar el contenido de `[Unreleased]` por:
```markdown
## [Unreleased]

[Vacío pendiente de iniciar nuevas sesiones]

---
```

