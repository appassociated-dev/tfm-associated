# Ejemplo 5: Instrucción Reactiva Explícita

## Contexto
Aunque el comportamiento principal es proactivo, el agente debe responder a instrucciones reactivas explícitas.

## Escenario

**Usuario:** "Anota que tenemos pendiente refactorizar auth.js a TypeScript"

## Comportamiento del Agente

### Paso 1: Identificar tipo de instrucción
```
Tipo: INSTRUCCIÓN REACTIVA EXPLÍCITA
Palabras clave: "Anota", "tenemos pendiente"
Sección destino: "Próximos Pasos"
Acción: Documentar según instrucción
```

### Paso 2: Verificar si ya está anotado

Lee `doc/agents-sessions/20260209-001-CLAUDE.md`:
```markdown
## 🔄 Próximos Pasos

- [ ] Integración con frontend
```

Busca: "refactorizar", "auth.js", "TypeScript"
Resultado: NO encontrado

### Paso 3: Añadir a sección correspondiente

```markdown
## 🔄 Próximos Pasos

- [ ] Integración con frontend
- [ ] Refactorizar auth.js a TypeScript
```

### Paso 4: Confirmar al usuario

**Agente:** "✓ Anotado en Próximos Pasos de la sesión"

## Otros Casos Reactivos Válidos

### Anotar problemas conocidos

**Usuario:** "Anota que el endpoint /users tiene problemas de rendimiento con +1000 registros"

**Agente:**
```markdown
## 📝 Notas y Aprendizajes

### Problemas Conocidos

- **Endpoint /users lento:** Rendimiento degradado con +1000 registros
  - Detectado: [fecha]
  - Pendiente: Optimizar consulta o implementar paginación
```

Responde: "✓ Problema anotado en Notas y Aprendizajes"

### Documentar decisión externa

**Usuario:** "Documenta que el cliente decidió usar PostgreSQL en lugar de MySQL por soporte JSON nativo"

**Agente:**
```markdown
### 15:30 - Decisión de Base de Datos

**Decisión:**
PostgreSQL seleccionado sobre MySQL

**Reasoning (desde cliente):**
- Soporte nativo para JSON/JSONB
- Mejor para queries complejas con datos semi-estructurados
- Experiencia previa del equipo

**Alternativas descartadas:**
- MySQL: Soporte JSON limitado
```

Responde: "✓ Decisión documentada en sesión"

### Añadir referencia

**Usuario:** "Añade referencia al issue #247 en la sección de autenticación"

**Agente:**
```markdown
### 14:23 - Implementación de Login con JWT

[contenido existente...]

**Referencias:**
- Issue #247: Requisitos de autenticación JWT
```

## Puntos Clave

✅ **Responde a instrucciones explícitas:** "Anota", "Documenta", "Añade"
✅ **Verifica atomicidad:** Aunque sea instrucción, no duplica
✅ **Sección apropiada:** Próximos Pasos vs Trabajo Realizado vs Notas

## Contraste con Comportamiento Incorrecto

❌ **INCORRECTO (ignorar instrucción):**
```
Usuario: "Anota que tenemos pendiente X"
Agente: [ignora porque es reactivo]
        "El skill funciona proactivamente"
```

❌ **INCORRECTO (duplicar sin verificar):**
```
Usuario: "Anota refactorizar auth.js"
Agente: [NO verifica si ya existe]
        [DUPLICA información]
```

✅ **CORRECTO:**
```
Usuario: "Anota que tenemos pendiente X"
Agente: [VERIFICA si existe]
        [Si NO → Añade]
        [Si SÍ → Informa]
```

## Cuándo es Reactivo vs Proactivo

**REACTIVO (usuario instruye):**
```
"Anota que..."
"Documenta que..."
"Añade referencia a..."
"Marca como completado..."
```

**PROACTIVO (agente detecta):**
```
Usuario: "Implementa X"
Agente: [implementa Y DOCUMENTA automáticamente]
```
