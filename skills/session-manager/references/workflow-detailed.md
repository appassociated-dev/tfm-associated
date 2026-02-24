# Workflow Detallado - Session Manager

Este documento describe el comportamiento completo del skill en cada fase.

---

## 1. Detección Automática de Nueva Sesión

Al inicio de conversación:

1. Verificar si existe `doc/agents-sessions/`
   - Si NO → Crear directorio
2. Leer `USER_SESSION_MANAGER` de `.env` y asignar a `{user}`, aplicar sanitización [a-zA-Z0-9]. Si no existe asignar valor `unknown` y notificar al usuario.
3. Obtener alias agente IA y asignar a `{agent}` (ver [`agent-aliases.md`](references/agent-aliases.md))
4. Calcular fecha ACTUAL **SIEMPRE** con comando (nunca estática): `date +%Y%m%d` -> `YYYYMMDD`
5. Determinar número de sesión: Listar archivos `YYYYMMDD-*-{user}-{agent}.md`, incrementar contador `XXX`
6. **CRÍTICO - Persistencia nombre de sesión.** 
   - La ventana de contexto debe almacenar el nombre de la sesión. Debe perdurar tras compactaciones y reanudaciones de sesión.
7. Informar discretamente: "Sesión documentada en `doc/agents-sessions/20260209-001-adrian-CLAUDE.md`"

---

## 2. Actualización Durante la Sesión (PROACTIVA)

**CRÍTICO - Recuperar nombre de sesión desde contexto** (no asumir en memoria). Si no existe se interpretar **Nueva sesión** y se crear un nuevo archivo de sesión sigiedo las instrucciones definidas. 

**El agente documenta AUTOMÁTICAMENTE cuando:**
- Se complete tarea significativa (ver [`when-to-document.md`](when-to-document.md))
- Se tome decisión técnica con alternativas
- Se modifiquen archivos que afecten lógica de negocio

**ANTES de documentar:**
1. Leer archivo de sesión
2. Verificar atomicidad
3. Si existe → No duplicar
4. Si no existe → Documentar
5. Si parcial → Complementar

**Actualización incremental:**
- NO reescribir archivo completo
- Añadir nueva sección con timestamp
- Actualizar "Hora de últimos trabajos"

---

## 3. Cierre de Sesión

Cuando el usuario lo solicite:

1. Actualizar métricas finales
2. Completar "Próximos Pasos"
3. Añadir estado final: "Completada"
4. **CRÍTICO - elminar nombre de sesión del contexto** (no asumir que se mantiene tras cierre)
5. Confirmar: "Sesión documentada y cerrada"
