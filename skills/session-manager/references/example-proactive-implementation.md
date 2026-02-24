# Ejemplo 1: Documentación Proactiva

## Contexto
Este ejemplo demuestra el comportamiento **core** del skill: documentación automática sin instrucción explícita.

## Escenario

**Usuario:** "Implementa la función de login con JWT"

## Comportamiento del Agente

### Paso 1: Implementar funcionalidad
```javascript
// src/auth/login.js
function authenticateUser(credentials) {
  // Implementación JWT
}

// src/middleware/auth.js
function validateToken(req, res, next) {
  // Validación de tokens
}
```

### Paso 2: Documentar AUTOMÁTICAMENTE (sin que se lo pidan)

Actualiza `doc/agents-sessions/20260209-001-CLAUDE.md`:

```markdown
### 14:23 - Implementación de Login con JWT

**Descripción:**
Implementado sistema de autenticación usando JSON Web Tokens.

**Archivos modificados:**
- `src/auth/login.js` - Nueva función `authenticateUser()`
- `src/middleware/auth.js` - Middleware de validación de tokens

**Decisiones técnicas:**
- Usar JWT en lugar de sessions por escalabilidad
- Tokens expiran en 24h por seguridad
- RefreshTokens almacenados en DB para revocación

**Resultados:**
- ✅ Login funcional con tokens
- ✅ Middleware de protección de rutas
- ✅ Tests unitarios pasando (12/12)
```

### Paso 3: Responder al usuario

**Agente:** "✓ Login implementado y documentado en sesión. Los tests están pasando."

## Puntos Clave

✅ **Proactividad:** El agente documenta SIN esperar "documenta esto"
✅ **No interrumpe:** Mención breve, no detallada
✅ **Completo:** Incluye archivos, decisiones, resultados

## Contraste con Comportamiento Incorrecto

❌ **INCORRECTO:**
```
Usuario: "Implementa login con JWT"
Agente: [implementa código]
        "✓ Login implementado. Tests pasando."
        [NO documenta]

Usuario: "Documenta el login"
Agente: [ahora documenta]
```

✅ **CORRECTO:**
```
Usuario: "Implementa login con JWT"
Agente: [implementa código]
        [DOCUMENTA AUTOMÁTICAMENTE]
        "✓ Login implementado y documentado en sesión"
```
