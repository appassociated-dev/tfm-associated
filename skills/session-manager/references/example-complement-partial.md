# Ejemplo 3: Complementar Documentación Parcial

## Contexto
Cuando la información está parcialmente documentada, el agente complementa sin reescribir.

## Situación Inicial

**Archivo de sesión contiene:**
```markdown
### 14:23 - Implementación de Login con JWT

**Descripción:**
Implementado sistema de autenticación usando JSON Web Tokens.

**Archivos modificados:**
- `src/auth/login.js` - Nueva función `authenticateUser()`
- `src/middleware/auth.js` - Middleware de validación de tokens

**Decisiones técnicas:**
- Usar JWT en lugar de sessions por escalabilidad
```

**Falta:** Rate limiting (no está documentado)

## Escenario

**Usuario:** "También añadí rate limiting al login para prevenir ataques de fuerza bruta"

## Comportamiento del Agente

### Paso 1: Leer archivo de sesión
```bash
cat doc/agents-sessions/20260209-001-CLAUDE.md
```

### Paso 2: Analizar información
```
Encuentra: Sección 14:23 sobre login JWT
Busca: "rate limiting", "fuerza bruta", "ataques"
Resultado: NO encontrado
```

### Paso 3: Decidir acción
```
¿Ya documentado? → PARCIALMENTE (login sí, rate limiting no)
¿Crear nueva sección? → NO (es parte del login)
¿Complementar existente? → SÍ
```

### Paso 4: Complementar sección existente

Actualiza la sección 14:23 (NO crea nueva):

```markdown
### 14:23 - Implementación de Login con JWT

**Descripción:**
Implementado sistema de autenticación usando JSON Web Tokens.

**Archivos modificados:**
- `src/auth/login.js` - Nueva función `authenticateUser()`
- `src/middleware/auth.js` - Middleware de validación de tokens

**Decisiones técnicas:**
- Usar JWT en lugar de sessions por escalabilidad

**Seguridad adicional:**
- Rate limiting: máximo 5 intentos por IP cada 15 minutos
- Bloqueo temporal de cuenta tras 10 intentos fallidos
- Implementado con express-rate-limit
- Prevención de ataques de fuerza bruta
```

### Paso 5: Responder

**Agente:** "✓ Añadida documentación de rate limiting a la sección de login (14:23)"

## Puntos Clave

✅ **Complementa, no duplica:** Añade a sección existente
✅ **Mantiene coherencia:** Todo sobre login en una sección
✅ **Incremental:** Solo añade lo nuevo

## Contraste con Comportamiento Incorrecto

❌ **INCORRECTO (crear nueva sección):**
```markdown
### 14:23 - Implementación de Login con JWT
[contenido original]

### 15:30 - Añadido Rate Limiting a Login
[información fragmentada]
```

❌ **INCORRECTO (reescribir todo):**
```markdown
### 14:23 - Implementación de Login con JWT y Rate Limiting
[TODO reescrito desde cero]
```

✅ **CORRECTO (complementar):**
```markdown
### 14:23 - Implementación de Login con JWT
[contenido original intacto]

**Seguridad adicional:**
[SOLO lo nuevo añadido]
```
