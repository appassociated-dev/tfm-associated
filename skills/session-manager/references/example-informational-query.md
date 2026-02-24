# Ejemplo 4: Consulta Informativa (NO Documentar)

## Contexto
No todas las interacciones requieren documentación. Las consultas informativas NO se documentan.

## Escenario

**Usuario:** "¿Por qué decidimos usar JWT en lugar de sessions?"

## Comportamiento del Agente

### Paso 1: Identificar tipo de interacción
```
Tipo: CONSULTA INFORMATIVA
Razón: Usuario pregunta sobre decisión pasada, no reporta nuevo trabajo
Acción: Responder con información, NO documentar
```

### Paso 2: Consultar documento de sesión
```bash
# Agente lee:
cat doc/agents-sessions/20260209-001-CLAUDE.md
# Busca: "JWT", "sessions", "decisiones técnicas"
```

### Paso 3: Responder con información encontrada

**Agente:** "Según la sesión del 9 de febrero (sección 14:23), elegimos JWT por escalabilidad: permite escalado horizontal sin estado compartido entre servidores, reduciendo la necesidad de Redis o bases de datos para validación de sesiones."

### Paso 4: NO documentar esta consulta

**NO añade a sesión:**
```markdown
❌ NO HACER ESTO:
### 15:45 - Consulta sobre decisión JWT
Usuario preguntó por qué usamos JWT...
```

## Otros Ejemplos de Consultas Informativas

**Todos estos NO se documentan:**

```
Usuario: "¿Qué hicimos el martes pasado?"
→ Leer sesiones, responder, NO documentar la pregunta

Usuario: "¿Cómo funciona el middleware de autenticación?"
→ Explicar desde sesión, NO documentar la explicación

Usuario: "Muéstrame el código de login"
→ Mostrar código, NO documentar la solicitud

Usuario: "¿Cuántos archivos modificamos hoy?"
→ Contar desde sesión, NO documentar el conteo

Usuario: "¿Está documentada la integración con Redis?"
→ Verificar sesión, responder, NO documentar la verificación
```

## Puntos Clave

✅ **Distingue consultas de trabajo:** Preguntar ≠ Implementar
✅ **Usa sesión como fuente:** Lee documento para responder
✅ **No contamina sesión:** Evita ruido innecesario

## Contraste con Comportamiento Incorrecto

❌ **INCORRECTO:**
```
Usuario: "¿Por qué usamos JWT?"
Agente: [responde]
        [DOCUMENTA la pregunta del usuario]
        
Resultado: Sesión llena de preguntas, no de trabajo real
```

✅ **CORRECTO:**
```
Usuario: "¿Por qué usamos JWT?"
Agente: [LEE sesión para encontrar respuesta]
        [RESPONDE con información]
        [NO DOCUMENTA la consulta]
        
Resultado: Sesión limpia, solo trabajo real documentado
```

## Cuándo SÍ documentar una pregunta

Solo si la pregunta revela trabajo NO documentado:

```
Usuario: "¿Por qué usamos PostgreSQL?"
Agente: [lee sesión]
        [NO encuentra esa decisión]
        [¿Se tomó decisión sin documentar?]
        
Si usuario confirma → Documenta decisión faltante
Si fue antes de sesiones → Informa que no hay registro
```
