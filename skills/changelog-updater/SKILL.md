---
name: changelog-updater
description: >
  Mantiene la sección [Unreleased] del CHANGELOG.md agrupando cambios por sesión de trabajo.
  Al inicio de cada sesión crea un bloque de sesión en [Unreleased]. Durante la sesión actualiza
  ese bloque con entradas resumidas y de alto nivel (Added, Changed, Fixed, Removed).
  Complementario a session-manager: cuando session-manager documenta trabajo significativo en el
  archivo de sesión, changelog-updater registra el resumen en CHANGELOG.md.
  Trigger: actualizar changelog, registrar cambio en changelog, bloque unreleased, sincronizar
  changelog, nueva sesión en changelog, documentar en changelog, cierre de sesión.
metadata:
  author: Adrián Cester
  version: "1.0.0"
  scope: [root]
  auto_invoke:
    - "Al crear nueva sesión (coordinado con session-manager)"
    - "Al completar trabajo significativo documentado en archivo de sesión"
    - "Al cerrar sesión de trabajo"
allowed-tools: Read, Edit, Write, Bash
---

# Changelog Updater

Mantiene `CHANGELOG.md` actualizado por sesión dentro de la sección `[Unreleased]`.
Complementa a session-manager: el archivo de sesión tiene el detalle; CHANGELOG.md tiene el resumen.

## Principios Core (CRÍTICO)

### 1. Coordinación con session-manager
Cuando session-manager documenta trabajo → changelog-updater actualiza el bloque `[Unreleased]` correspondiente.
El nombre de sesión (`YYYYMMDD-XXX-{user}-{agent}`) es el mismo que usa session-manager.

### 2. Atomicidad (SIEMPRE)
ANTES de actualizar: Leer `CHANGELOG.md` → Localizar bloque de sesión → Decidir (crear | actualizar | skip)

### 3. Alto nivel únicamente
El CHANGELOG.md contiene resúmenes, NO detalles de implementación.
El detalle vive en `doc/agents-sessions/YYYYMMDD-XXX-{user}-{agent}.md`.

### 4. Sin próximos pasos
Solo se registra lo REALIZADO. Próximos pasos, tareas futuras y pendientes → NUNCA en CHANGELOG.md.

---

## Localización

**Idioma:** Español de España
**Fechas:** DD de MMMM de YYYY (9 de febrero de 2026)
**Hora:** 24h HH:MM (14:30)

---

## Estructura

```
CHANGELOG.md
└── [Unreleased]
    ├── ### YYYYMMDD-XXX-{user}-{agent}   ← bloque sesión actual
    └── ### YYYYMMDD-YYY-{user}-{agent}   ← bloque sesión anterior
```

**Template de bloque:** [`assets/templates/session-block.md`](assets/templates/session-block.md)
**Estructura canónica CHANGELOG.md:** [`references/changelog-structure.md`](references/changelog-structure.md)

---

## Workflow

### Nueva sesión

1. **CRÍTICO - Recuperar nombre de sesión desde contexto** (coordinado con session-manager)
2. Leer `CHANGELOG.md` → Verificar si existe bloque `### YYYYMMDD-XXX-{user}-{agent}` en `[Unreleased]`
3. Si NO existe → Insertar nuevo bloque al inicio de `[Unreleased]` usando el template
4. Calcular timestamps con comandos: `date +%Y%m%d`, `date +%H:%M` (nunca estáticos)
5. Informar: "Bloque de sesión creado en CHANGELOG.md"

### Durante la sesión (AUTOMÁTICO)

1. **CRÍTICO - Recuperar nombre de sesión desde contexto** → Si no existe: coordinar con session-manager
2. Leer `CHANGELOG.md` → Localizar bloque de sesión en `[Unreleased]`
3. Verificar atomicidad: ¿ya está documentado este cambio? → Si sí: skip | Si no: añadir
4. Añadir entrada en la categoría correcta (Added / Changed / Fixed / Removed)
5. Actualizar "Hora de últimos trabajos" con `date +%H:%M`
6. Actualizar incrementalmente (NO reescribir sección completa)

### Cierre de sesión

1. Verificar que todas las categorías vacías estén limpias o con `[Sin cambios]`
2. Actualizar "Hora de últimos trabajos" con timestamp final
3. Confirmar: "Bloque de sesión cerrado en CHANGELOG.md"

**CRÍTICO - Fecha/Hora:**
- SIEMPRE calcular con comandos en momento de uso: `date +%Y%m%d`, `date +%H:%M`
- NUNCA usar valores estáticos, manuales o en memoria

---

## Categorías de cambios

| Categoría | Cuándo usarla |
|-----------|--------------|
| `Added` | Nueva funcionalidad, nuevos archivos, nuevas features |
| `Changed` | Modificación de funcionalidad existente, refactorizaciones |
| `Fixed` | Corrección de bugs o errores |
| `Removed` | Eliminación de código, archivos o funcionalidades |

Ver reglas detalladas y ejemplos: [`references/update-rules.md`](references/update-rules.md)

---

## ✅ HACER

- Crear bloque de sesión al inicio (si no existe)
- Actualizar PROACTIVAMENTE coordinado con session-manager
- Verificar atomicidad SIEMPRE (leer CHANGELOG.md primero)
- Entradas concisas y de alto nivel (1-2 líneas por cambio)
- Enlazar siempre al archivo de sesión en la cabecera del bloque
- Timestamps precisos con comandos (nunca estáticos)
- Actualizar incrementalmente

## ❌ NO HACER

- NO incluir próximos pasos, tareas futuras ni pendientes
- NO duplicar información ya registrada
- NO copiar detalle del archivo de sesión (solo resumen)
- NO reescribir CHANGELOG.md completo en actualizaciones
- NO usar lenguaje vago ("se mejoró", "varios cambios")
- NO asumir estado sin leer el archivo físicamente

---

## Referencias Completas

- [`references/changelog-structure.md`](references/changelog-structure.md) — Estructura canónica del CHANGELOG.md
- [`references/update-rules.md`](references/update-rules.md) — Reglas detalladas con ejemplos
- [`assets/templates/session-block.md`](assets/templates/session-block.md) — Template del bloque de sesión
