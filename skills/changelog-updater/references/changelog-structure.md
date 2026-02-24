# Estructura Canónica del CHANGELOG.md

## Tabla de Contenidos

1. [Cabecera del archivo](#cabecera)
2. [Sección Unreleased](#unreleased)
3. [Bloque de sesión dentro de Unreleased](#bloque-sesion)

---

## Cabecera del archivo

```markdown
# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).
```

---

## Sección Unreleased

La sección `[Unreleased]` contiene **todos los bloques de sesión activos** (trabajo no versionado aún).
Cada sesión ocupa un bloque propio. Los bloques más recientes van al principio.

```markdown
## [Unreleased]

### YYYYMMDD-XXX-{user}-{agent}

[bloque de sesión más reciente]

---

### YYYYMMDD-YYY-{user}-{agent}

[bloque de sesión anterior]

---
```

---

## Bloque de sesión dentro de Unreleased

Cada bloque de sesión sigue este formato exacto:

```markdown
### YYYYMMDD-XXX-{user}-{agent}

* **Fecha de sesión:** DD de MMMM de YYYY
* **Hora de inicio:** HH:MM
* **Hora de últimos trabajos:** HH:MM
* **Documento de sesión:** [doc/agents-sessions/YYYYMMDD-XXX-user-AGENT.md](doc/agents-sessions/YYYYMMDD-XXX-user-AGENT.md)

#### Added

- [Descripción concisa del cambio]

#### Changed

- [Descripción concisa del cambio]

#### Fixed

- [Descripción concisa del cambio]

#### Removed

[Sin cambios]

---
```

**Reglas del bloque:**
- El encabezado `###` usa el nombre exacto de la sesión (mismo que el archivo de sesión)
- "Hora de últimos trabajos" se actualiza en cada modificación del bloque
- Si una categoría no tiene entradas → escribir `[Sin cambios]` (no dejar vacío)
- El separador `---` cierra cada bloque de sesión

