# Cuándo NO Documentar

El agente NO debe documentar estas actividades, ya que no constituyen trabajo significativo o son consultas informativas.

## ❌ Casos que NO Requieren Documentación

### 1. Consultas Informativas del Usuario
**Qué:** Preguntas sobre el proyecto, código o decisiones pasadas

**Ejemplos:**
```
"¿Cómo funciona el login?"
"¿Por qué usamos JWT?"
"¿Qué hace este endpoint?"
"¿Cuándo implementamos Redis?"
"Explícame la arquitectura actual"
```

**Acción:** Responder consultando sesiones, NO documentar la consulta

### 2. Preguntas sobre Decisiones Pasadas
**Qué:** Usuario pregunta sobre trabajo ya completado

**Ejemplos:**
```
"¿Qué hicimos el martes pasado?"
"¿Ya implementamos autenticación?"
"¿Está documentada la integración con Stripe?"
"Muéstrame qué archivos modificamos hoy"
```

**Acción:** Leer archivo de sesión, responder, NO documentar

### 3. Debugging Trivial
**Qué:** Correcciones menores sin impacto en lógica

**Ejemplos:**
- Typos en nombres de variables
- Import faltante
- Punto y coma olvidado
- Indentación incorrecta
- Comillas simples vs dobles

**Por qué NO:** No afecta funcionalidad, no requiere decisión

### 4. Explicaciones Conceptuales Sin Código
**Qué:** Discusiones teóricas sin implementación

**Ejemplos:**
```
Usuario: "Explícame qué es GraphQL"
Usuario: "¿Cómo funcionan los websockets?"
Usuario: "Dame un tutorial de Docker"
```

**Acción:** Explicar concepto, NO documentar la explicación

**Excepción:** Si tras la explicación se decide implementar → Entonces SÍ documentar la decisión

### 5. Revisión de Documentación Existente
**Qué:** Leer o revisar código/docs sin modificar

**Ejemplos:**
```
"Revisa el código de auth.js"
"Lee la documentación de la API"
"Verifica si tenemos tests de login"
```

**Acción:** Revisar y reportar hallazgos, NO documentar la revisión

**Excepción:** Si la revisión revela problema → Documentar el problema encontrado

### 6. Tareas Delegadas al Usuario
**Qué:** Usuario hará el trabajo, agente solo asiste

**Ejemplos:**
```
Usuario: "Voy a implementar login, dame consejos"
Usuario: "Quiero refactorizar esto, ¿cómo lo harías?"
```

**Acción:** Proporcionar guía, NO documentar (usuario lo hará)

**Excepción:** Si luego usuario reporta haberlo hecho → Verificar si ya está documentado

### 7. Conversaciones Casuales
**Qué:** Charla sobre el proyecto sin acción concreta

**Ejemplos:**
```
"¿Cómo va el proyecto?"
"¿Qué te parece esta arquitectura?"
"Creo que deberíamos usar microservicios"
```

**Acción:** Conversar, NO documentar charla

**Excepción:** Si se toma decisión concreta → Documentar decisión

---

## 🎯 Regla de Oro

**Pregúntate:**
> ¿Esta actividad resultó en CÓDIGO NUEVO, DECISIÓN TÉCNICA o CAMBIO en el proyecto?

- **SÍ** → Documentar (ver [when-to-document.md](when-to-document.md))
- **NO** → No documentar

---

## 📋 Checklist Anti-Documentación

Antes de documentar, verifica:

- [ ] ¿El usuario está PREGUNTANDO sobre algo ya hecho?
- [ ] ¿Es un typo, import o error sintáctico trivial?
- [ ] ¿Es explicación teórica sin implementar nada?
- [ ] ¿Estás solo REVISANDO código existente sin cambiar?
- [ ] ¿El usuario hará el trabajo (no el agente)?
- [ ] ¿Es conversación casual sin decisión concreta?

**Si SÍ a alguno → NO DOCUMENTAR**

---

## ⚠️ Casos Límite

### Caso 1: Usuario Reporta Trabajo Hecho Externamente

**Escenario:**
```
Usuario: "Implementé caching con Redis ayer fuera de esta sesión"
```

**Decisión:**
1. Verificar si está en alguna sesión previa
2. Si NO → Preguntar al usuario si quiere documentarlo ahora
3. Si usuario confirma → Documentar (con nota que fue hecho previamente)

### Caso 2: Explicación que Deriva en Implementación

**Escenario:**
```
Usuario: "Explícame cómo funcionan websockets"
[Agente explica]
Usuario: "Ok, implementémoslo"
```

**Decisión:**
- NO documentar la explicación inicial
- SÍ documentar la implementación

### Caso 3: Revisión que Encuentra Problema

**Escenario:**
```
Usuario: "Revisa auth.js"
Agente: [encuentra bug crítico]
```

**Decisión:**
- NO documentar la revisión
- SÍ documentar el bug encontrado (si se documenta o corrige)

### Caso 4: Pregunta que Revela Falta de Documentación

**Escenario:**
```
Usuario: "¿Por qué usamos PostgreSQL?"
Agente: [busca en sesiones, no lo encuentra]
```

**Decisión:**
1. Informar que no está documentado
2. Preguntar si fue decisión previa a sesiones
3. Si usuario confirma decisión → Ofrecer documentar
4. Solo documentar si usuario aprueba
