# Template: Archivo de Sesión

Este es el template completo para crear archivos de sesión en `doc/agents-sessions/`.

## Nombre del Archivo

```
YYYYMMDD-XXX-{agent-alias}.md
```

**Ejemplos:**
- `20260209-001-CLAUDE.md` - Primera sesión del 9 de febrero de 2026
- `20260209-002-CLAUDE.md` - Segunda sesión del mismo día
- `20260210-001-CLAUDE.md` - Primera sesión del 10 de febrero

---

## Contenido del Template

```markdown
# Sesión Agente: YYYYMMDD-XXX-{agent-alias}

* **Agente de IA:** [Nombre del agente] (ej: Claude Sonnet 4.5)
* **Fecha creación:** [DD de MMMM de YYYY] (ej: 9 de febrero de 2026)
* **Hora de inicio:** [HH:MM] (formato 24h, ej: 14:30)
* **Hora de últimos trabajos:** [HH:MM] (se actualiza con cada trabajo)

---

## 📋 Resumen de la Sesión

[Breve descripción de los objetivos y contexto de la sesión - 2-3 líneas]

---

## 🎯 Objetivos

- [ ] Objetivo 1
- [ ] Objetivo 2
- [ ] Objetivo 3

---

## 💼 Trabajo Realizado

### [HH:MM] - [Título de la tarea]

**Descripción:**
[Descripción detallada de qué se hizo]

**Archivos modificados:**
- `path/to/file1.ext` - [Descripción del cambio]
- `path/to/file2.ext` - [Descripción del cambio]

**Decisiones técnicas:**
- [Decisión 1 y su justificación con alternativas consideradas]
- [Decisión 2 y su justificación con alternativas consideradas]

**Resultados:**
- ✅ [Resultado positivo 1]
- ✅ [Resultado positivo 2]
- ⚠️ [Advertencia o nota si aplica]

---

### [HH:MM] - [Siguiente tarea]

[Repetir estructura para cada tarea completada]

---

## 🔄 Próximos Pasos

- [ ] Tarea pendiente 1
- [ ] Tarea pendiente 2
- [ ] Idea para explorar 1

---

## 📝 Notas y Aprendizajes

### Lecciones Técnicas

- [Aprendizaje 1]
- [Aprendizaje 2]

### Decisiones Arquitectónicas

- [Decisión 1 con contexto y alternativas consideradas]
- [Decisión 2 con contexto y alternativas consideradas]

### Problemas Encontrados

**[Problema 1]:**
- **Descripción:** [Qué pasó]
- **Solución:** [Cómo se resolvió]
- **Prevención:** [Cómo evitarlo en el futuro]

---

## 📊 Métricas de la Sesión

- **Duración total:** [X horas Y minutos]
- **Archivos modificados:** [N]
- **Archivos creados:** [N]
- **Commits realizados:** [N]
- **Tests creados/modificados:** [N]
- **Líneas añadidas:** ~[N]
- **Líneas eliminadas:** ~[N]

---

## 🔗 Referencias

- Commits: `hash1`, `hash2`, ...
- Issues relacionados: #XX, #YY
- Documentación consultada: [enlaces]
- PRs relacionados: #XX

---

**Estado final:** [Completada | En progreso | Pausada]
**Próxima sesión:** [Descripción breve de qué continuar]
```

---

## Notas de Uso

### Metadata (Líneas 1-6)
- Actualizar "Hora de últimos trabajos" con cada nuevo trabajo documentado
- Mantener "Hora de inicio" constante (primera entrada de la sesión)

### Resumen (Línea 10)
- Escribir al inicio de sesión
- Puede actualizarse si la sesión toma dirección diferente

### Objetivos (Líneas 14-18)
- Checkbox `[ ]` para pendiente
- Checkbox `[x]` para completado
- Añadir objetivos según surjan durante la sesión

### Trabajo Realizado (Líneas 22+)
- **Una sección por tarea significativa**
- Timestamp en formato 24h
- Incluir siempre: Descripción, Archivos, Decisiones (si aplica), Resultados
- Actualización incremental: añadir nueva sección, no reescribir

### Próximos Pasos (Líneas después de trabajo)
- Lo que queda por hacer
- Ideas para explorar
- NO duplicar con "Trabajo Realizado"

### Notas y Aprendizajes
- Lecciones técnicas aprendidas
- Decisiones arquitectónicas importantes
- Problemas encontrados con solución y prevención

### Métricas
- Completar al finalizar la sesión
- Valores aproximados OK (usar ~)

### Referencias
- Links a commits, issues, PRs
- Documentación consultada relevante

### Estado Final
- **Completada:** Sesión cerrada, objetivos cumplidos
- **En progreso:** Se continuará en otra sesión
- **Pausada:** Bloqueada o interrumpida

---

## Ejemplo Real Completo

Ver: `assets/examples/session-complete-example.md` (si existe)
