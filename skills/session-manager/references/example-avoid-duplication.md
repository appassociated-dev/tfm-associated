# Ejemplo 2: Evitar Duplicación (Atomicidad)

## Contexto
Demuestra la verificación obligatoria del documento de sesión antes de documentar.

## Situación Inicial

**Archivo de sesión ya contiene:**
```markdown
### 14:23 - Implementación de Login con JWT

**Descripción:**
Implementado sistema de autenticación usando JSON Web Tokens.

**Archivos modificados:**
- `src/auth/login.js` - Nueva función `authenticateUser()`
- `src/middleware/auth.js` - Middleware de validación de tokens
```

## Escenario

**Usuario:** "He implementado la función de login con JWT en src/auth/login.js"

## Comportamiento del Agente

### Paso 1: Leer documento de sesión
```bash
# Agente ejecuta internamente:
cat doc/agents-sessions/20260209-001-CLAUDE.md
```

### Paso 2: Buscar información relacionada
- Busca términos: "login", "JWT", "auth/login.js"
- Encuentra sección 14:23 con información completa

### Paso 3: Evaluar necesidad de documentar
```
¿Ya está documentado? → SÍ
¿Información completa? → SÍ (archivos, decisiones, resultados)
¿Algo nuevo que añadir? → NO
```

### Paso 4: Responder al usuario

**Agente:** "Este trabajo ya está documentado en la sesión actual (sección 14:23). ¿Hay algo adicional que quieras añadir?"

## Si el usuario insiste

**Usuario:** "Pero asegúrate de documentarlo"

**Agente:** "Revisé la documentación y el login con JWT ya está registrado en la sección 14:23 con archivos modificados y decisiones técnicas. La sesión está actualizada."

## Puntos Clave

✅ **Lee físicamente el archivo:** No confía solo en memoria conversacional
✅ **Verifica antes de actuar:** Evita duplicación
✅ **Informa claramente:** Indica dónde está la información

## Contraste con Comportamiento Incorrecto

❌ **INCORRECTO:**
```
Usuario: "He implementado login con JWT"
Agente: [no lee archivo de sesión]
        [documenta basándose en memoria]
        [DUPLICA información existente]
```

✅ **CORRECTO:**
```
Usuario: "He implementado login con JWT"
Agente: [LEE doc/agents-sessions/20260209-001-CLAUDE.md]
        [DETECTA que ya existe en sección 14:23]
        [INFORMA al usuario]
        "Ya documentado en sesión actual (14:23)"
```
