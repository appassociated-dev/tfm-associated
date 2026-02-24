---
name: session-manager
description: >
  Gestiona sesiones de trabajo con agentes IA. Documenta automáticamente 
  trabajo significativo en doc/agents-sessions/ con formato YYYYMMDD-XXX-{user}-{agent}.md.
  Trigger: documentar sesión, crear sesión, actualizar sesión, verificar atomicidad,
  fuente de verdad, cierre de sesión, trabajo significativo completado.
metadata:
  author: Adrián Cester
  version: "1.4.1"
  scope: [root]
  auto_invoke:
    - "Implementaciones de Lógica de Negocio, Cambios en APIs o Contratos"
    - "Decisiones Arquitectónicas o Técnicas Críticas, Debates Técnicos (Aunque No Se Implemente Todavía)"
    - "Cambios en Estructura de Base de Datos"
    - "Integración de Librerías o Servicios Externos"
    - "Refactorizaciones Significativas, Problemas Críticos Resueltos"
    - "Configuraciones de Infraestructura"
allowed-tools: Read, Edit, Write, Bash
---

# Session Manager

Documenta automáticamente trabajo con agentes IA, preservando conocimiento ante compactaciones.

## Principios Core (CRÍTICO)

### 1. Proactividad (AUTOMÁTICA)
Documentar cuando: trabajo significativo | decisión técnica | modificación lógica negocio  
Ver: [`when-to-document.md`](references/when-to-document.md), [`example-proactive-implementation.md`](references/example-proactive-implementation.md)

### 2. Atomicidad (SIEMPRE)
ANTES de documentar: Leer archivo → Buscar contenido → Decidir (documentar | skip | complementar)  
Ver: [`source-of-truth-principle.md`](references/source-of-truth-principle.md), [`example-avoid-duplication.md`](references/example-avoid-duplication.md), [`example-complement-partial.md`](references/example-complement-partial.md)

### 3. Fuente de Verdad
Documento > contexto conversacional (en conflictos)  
Ver: [`source-of-truth-principle.md`](references/source-of-truth-principle.md)

### 4. Reactivo
Usuario solicita explícitamente → Verificar atomicidad → Documentar  
Ver: [`example-reactive-instruction.md`](references/example-reactive-instruction.md)

### 5. Consultas NO Se Documentan
Usuario pregunta sobre decisiones pasadas → Consultar sesión → Responder → NO documentar pregunta  
Ver: [`example-informational-query.md`](references/example-informational-query.md)

---

## Localización

**Idioma:** Español de España  
**Fechas:** DD de MMMM de YYYY (9 de febrero de 2026)  
**Hora:** 24h HH:MM (14:30)  
**Vocabulario:** ordenador (no computadora)

---

## Estructura

```
doc/agents-sessions/
├── YYYYMMDD-001-user-CLAUDE.md
└── YYYYMMDD-002-user-GPT4.md
```

**Formato:** `YYYYMMDD-XXX-{user}-{agent}.md`
- `{user}`: Nombre desarrollador desde `USER_SESSION_MANAGER` en `.env` (sanitizado: [a-zA-Z0-9])
- `{agent}`: Alias agente IA (ver [`agent-aliases.md`](references/agent-aliases.md))
- Si `USER_SESSION_MANAGER` no existe → usar `unknown` y notificar al usuario

**Template:** [`session-file-template.md`](assets/templates/session-file-template.md)

---

## Workflow

**Nueva sesión:**
1. Verificar/crear `doc/agents-sessions/`
2. Leer `USER_SESSION_MANAGER` de `.env`  → `{user}` → sanitizar [a-zA-Z0-9] → Si no existe: `unknown` + notificar
3. Obtener alias agente IA → `{agent}` (ver [`agent-aliases.md`](references/agent-aliases.md))
4. Calcular fecha ACTUAL con comando (nunca estática): `date +%Y%m%d` -> `YYYYMMDD`
5. Secuencia: listar `YYYYMMDD-*-{user}-{agent}.md` → incrementar `XXX`
6. **CRÍTICO - Persistencia nombre de sesión.** Ventana de contexto almacena nombre de sesión → Debe perdurar tras compactaciones y reanudaciones de sesión.  
7. Informar: "Sesión YYYYMMDD-XXX-{user}-{agent}.md creada"

**Durante (AUTOMÁTICO):**
1. **CRÍTICO - Recuperar nombre de sesión desde contexto** (no asumir en memoria). Si no existe → Interpretar **Nueva sesión** → Crear nuevo archivo de sesión.
2. Leer archivo → Verificar atomicidad → Si nuevo: documentar | Si existe: skip | Si parcial: complementar
3. Actualizar incrementalmente (NO reescribir completo)
4. Añadir sección con timestamp ACTUAL (comando `date +%H:%M`, nunca estático)
5. Actualizar "Hora últimos trabajos" con timestamp ACTUAL

**Cierre:**
1. Actualizar métricas → Completar "Próximos Pasos" → Estado: "Completada"
2. **CRÍTICO - elminar nombre de sesión del contexto** (no asumir que se mantiene tras cierre)

**CRÍTICO - Fecha/Hora:**
- SIEMPRE calcular con comandos en momento de uso: `date +%Y%m%d`, `date +%H:%M`, etc.
- NUNCA usar valores estáticos, manuales o en memoria
- Aplicar tanto a nombres de archivo como a timestamps internos

Ver workflow detallado: [`workflow-detailed.md`](references/workflow-detailed.md)

---

## Niveles de Detalle

| Modo | Contenido | Métricas |
|------|-----------|----------|
| **CONCISO** (default) | Resumen 2-3 líneas/tarea, decisiones importantes | Básicas |
| **DETALLADO** | Pasos completos, todas decisiones, código relevante | Exhaustivas |
| **MINIMAL** | Timestamp + título + resultado | N/A |

---

## ✅ HACER

- Documentar PROACTIVAMENTE (sin esperar instrucción)
- Verificar atomicidad SIEMPRE (leer sesión primero)
- Usar documento como fuente de verdad (no solo contexto)
- Documentar decisiones con contexto + alternativas
- Timestamps precisos (formato 24h)
- Actualizar incrementalmente (no reescribir)
- Lenguaje específico (no vago)
- Incluir referencias (commits, archivos, issues)
- Separar "Trabajo Realizado" vs "Próximos Pasos"

## ❌ NO HACER

- NO esperar instrucción "documenta esto"
- NO duplicar información ya documentada
- NO confiar solo en memoria conversacional
- NO documentar consultas informativas del usuario
- No reescribir archivo completo en actualizaciones
- No lenguaje vago ("se mejoró", "se arregló")
- No asumir documentación sin verificar archivo físicamente

---

## Referencias Completas

Ver [`references/`](references/) para:
- Cuándo documentar / cuándo NO
- Principio fuente de verdad
- Alias de agentes IA comunes
- Ejemplos completos (proactividad, atomicidad, reactivo, consultas)
- Workflow detallado paso a paso
