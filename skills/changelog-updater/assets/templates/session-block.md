# Template: Bloque de Sesión en [Unreleased]

Este template se usa para insertar un nuevo bloque de sesión en la sección `[Unreleased]` del `CHANGELOG.md`.

## Instrucciones de uso

1. Insertar al **inicio** de la sección `[Unreleased]`, antes de los bloques existentes
2. Reemplazar todos los placeholders con valores reales
3. Calcular fecha y hora con comandos: `date +%Y%m%d`, `date +%H:%M` (nunca valores estáticos)
4. El nombre del bloque (`###`) debe coincidir exactamente con el nombre del archivo de sesión

---

## Template

```markdown
### YYYYMMDD-XXX-{user}-{agent}

* **Fecha de sesión:** DD de MMMM de YYYY
* **Hora de inicio:** HH:MM
* **Hora de últimos trabajos:** HH:MM
* **Documento de sesión:** [doc/agents-sessions/YYYYMMDD-XXX-user-AGENT.md](doc/agents-sessions/YYYYMMDD-XXX-user-AGENT.md)

#### Added

[Sin cambios]

#### Changed

[Sin cambios]

#### Fixed

[Sin cambios]

#### Removed

[Sin cambios]

---
```

---

## Placeholders

| Placeholder | Descripción | Ejemplo |
|-------------|-------------|---------|
| `YYYYMMDD` | Fecha de la sesión | `20260218` |
| `XXX` | Número de sesión del día (3 dígitos) | `001`, `002` |
| `{user}` | Nombre de usuario (de `USER_SESSION_MANAGER` en `.env`) | `adrian` |
| `{agent}` | Alias del agente IA | `CLAUDE` |
| `DD de MMMM de YYYY` | Fecha en formato largo | `18 de febrero de 2026` |
| `HH:MM` | Hora en formato 24h | `14:30` |

---

---

## Ejemplo

A continuación se muestra cómo queda el bloque al crearse y cómo evoluciona durante la sesión con entradas reales.

**Al crear el bloque (inicio de sesión):**

```markdown
### 20260218-001-adrian-CLAUDE

* **Fecha de sesión:** 18 de febrero de 2026
* **Hora de inicio:** 10:15
* **Hora de últimos trabajos:** 10:15
* **Documento de sesión:** [doc/agents-sessions/20260218-001-adrian-CLAUDE.md](doc/agents-sessions/20260218-001-adrian-CLAUDE.md)

#### Added

[Sin cambios]

#### Changed

[Sin cambios]

#### Fixed

[Sin cambios]

#### Removed

[Sin cambios]

---
```

**Tras trabajo significativo (durante la sesión):**

```markdown
### 20260218-001-adrian-CLAUDE

* **Fecha de sesión:** 18 de febrero de 2026
* **Hora de inicio:** 10:15
* **Hora de últimos trabajos:** 12:40
* **Documento de sesión:** [doc/agents-sessions/20260218-001-adrian-CLAUDE.md](doc/agents-sessions/20260218-001-adrian-CLAUDE.md)

#### Added

- Añadido componente de autenticación JWT con soporte para refresh tokens
- Nuevo endpoint `POST /api/users/login` con validación de credenciales

#### Changed

[Sin cambios]

#### Fixed

- Corregido error en validación de formulario cuando el email contiene mayúsculas

#### Removed

[Sin cambios]

---
```
