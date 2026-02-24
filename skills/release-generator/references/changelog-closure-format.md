# Formato del CHANGELOG.md tras el Cierre de Versión

Este documento define el estado exacto del `CHANGELOG.md` después de ejecutar el cierre de versión.

---

## Estado final del CHANGELOG.md

```markdown
# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

[Vacío pendiente de iniciar nuevas sesiones]

---

## [X.Y.Z] - YYYY-MM-DD

* **Fecha de release:** DD de MMMM de YYYY
* **Tipo:** [Patch | Minor | Major]
* **Periodo de desarrollo:** DD/MM/YYYY – DD/MM/YYYY
* **Commits:** XX commits desde `abc1234` hasta `abc5678`
* **Cobertura de tests:** XX.XX% (+X.X% desde YY.YY%)
* **Tests:** XXX/YYY tests pasando (ZZ.Z%, antes XXX/YYY - ZZ.Z%)
* **Sesiones de trabajo:**
    - [doc/agents-sessions/YYYYMMDD-XXX-user-AGENT.md](doc/agents-sessions/YYYYMMDD-XXX-user-AGENT.md)
    - [doc/agents-sessions/YYYYMMDD-YYY-user-AGENT.md](doc/agents-sessions/YYYYMMDD-YYY-user-AGENT.md)

### Added

- [Entrada agregada de todas las sesiones]
- [Entrada agregada de todas las sesiones]

### Changed

- [Entrada agregada de todas las sesiones]

### Fixed

- [Entrada agregada de todas las sesiones]

### Removed

[Sin cambios]

---

## [X.Y.Z-1] - YYYY-MM-DD

[release anterior, sin modificar]
```

---

## Reglas de la sección versionada

### Cabecera del bloque

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `[X.Y.Z]` | Versión cerrada | `[1.2.0]` |
| `YYYY-MM-DD` | Fecha del release | `2026-02-19` |
| `Fecha de release` | Fecha en formato largo | `19 de febrero de 2026` |
| `Tipo` | Tipo semántico | `Patch`, `Minor` o `Major` |
| `Periodo de desarrollo` | Desde primera sesión hasta hoy | `01/02/2026 – 19/02/2026` |
| `Commits` | Total de commits con hashes extremos | `12 commits desde \`a1b2c3d\` hasta \`e4f5g6h\`` |
| `Cobertura de tests` | Cobertura final con delta | `87.45% (+3.2% desde 84.25%)` |
| `Tests` | Tests pasando con comparativa | `120/120 (100%, antes 108/120 - 90.0%)` |
| `Sesiones de trabajo` | Lista de archivos de sesión usados | enlaces relativos |

### Contenido de categorías (Added / Changed / Fixed / Removed)

La información es **agregada** de todas las sesiones:

**✅ Correcto:**
```markdown
### Added

- Añadido sistema de autenticación JWT con refresh tokens
- Nuevo endpoint `POST /api/users/login` con validación de credenciales
- Soporte para múltiples idiomas en mensajes de error
```

**❌ Incorrecto — no listar por sesión:**
```markdown
### Added

#### 20260210-001-adrian-CLAUDE
- Añadido sistema de autenticación JWT

#### 20260215-001-adrian-CLAUDE
- Nuevo endpoint de login
```

**❌ Incorrecto — no repetir el detalle del release note:**
```markdown
### Added

- Añadido sistema de autenticación JWT con soporte para refresh tokens.
  El sistema utiliza HS256 para firmar los tokens con una clave secreta
  almacenada en variables de entorno. Los tokens tienen un TTL de 1 hora
  y los refresh tokens de 7 días...
```

### Categorías sin cambios

Si una categoría no tiene entradas → escribir `[Sin cambios]`:

```markdown
### Removed

[Sin cambios]
```

---

## Diferencias entre sección versionada y bloque de sesión

| Aspecto | Bloque de sesión (Unreleased) | Sección versionada |
|---------|-------------------------------|-------------------|
| Organización | Por sesión (`###` = nombre sesión) | Agregada (`###` = categoría) |
| Detalle | Alto nivel por sesión | Alto nivel consolidado |
| Referencias | Enlace al archivo de sesión | Lista de todos los archivos de sesión |
| Próximos pasos | Nunca | Nunca |
| Duración | Mientras está unreleased | Permanente en el historial |
