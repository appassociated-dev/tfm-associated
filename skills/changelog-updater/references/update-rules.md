# Reglas de Actualización del CHANGELOG.md

## Tabla de Contenidos

1. [Qué incluir](#que-incluir)
2. [Qué NO incluir](#que-no-incluir)
3. [Nivel de detalle](#nivel-detalle)
4. [Categorías: cuándo usar cada una](#categorias)
5. [Ejemplos correctos vs incorrectos](#ejemplos)
6. [Orden de las entradas](#orden)

---

## Qué incluir

Solo registrar lo **efectivamente realizado** durante la sesión:

- Nuevas funcionalidades implementadas y funcionando
- Cambios en código, configuración o estructura de archivos
- Bugs corregidos con resultado verificable
- Eliminaciones confirmadas (código, archivos, dependencias)
- Decisiones arquitectónicas con impacto real en el código

---

## Qué NO incluir

**Nunca registrar:**

- Próximos pasos o tareas planificadas
- Ideas para explorar en el futuro
- Trabajo iniciado pero no completado
- Comentarios sobre el proceso de trabajo
- Detalles de implementación (eso va en el archivo de sesión)
- Información redundante con otros bloques de sesión
- Consultas o preguntas del usuario respondidas sin cambios en código

---

## Nivel de detalle

El CHANGELOG.md es un **resumen de alto nivel**. El detalle completo vive en el archivo de sesión.

| En CHANGELOG.md | En archivo de sesión |
|-----------------|---------------------|
| "Añadido componente de autenticación JWT" | Código completo, alternativas consideradas, decisiones técnicas |
| "Corregido error en validación de formulario" | Stack trace, causa raíz, solución aplicada |
| "Refactorizado módulo de pagos" | Archivos modificados, pasos de refactorización |

**Regla práctica:** Una entrada = 1-2 líneas máximo. Si necesitas más, estás poniendo demasiado detalle.

---

## Categorías: cuándo usar cada una

### Added
Para **funcionalidad nueva** que antes no existía:
- Nuevos componentes, clases, módulos, endpoints
- Nuevas features de usuario
- Nuevos archivos de configuración o infraestructura
- Nuevas dependencias o integraciones

### Changed
Para **modificaciones de funcionalidad existente**:
- Cambios en comportamiento de features existentes
- Refactorizaciones que afectan la estructura
- Actualizaciones de dependencias
- Cambios en configuración o infraestructura existente
- Renombrados, reorganizaciones de código

### Fixed
Para **corrección de errores o problemas**:
- Bugs resueltos
- Comportamientos incorrectos corregidos
- Problemas de rendimiento solucionados
- Errores de validación o lógica de negocio

### Removed
Para **eliminaciones confirmadas**:
- Código eliminado
- Features deprecadas y removidas
- Archivos o directorios eliminados
- Dependencias removidas

---

## Ejemplos

### ✅ Ejemplos correctos

```markdown
#### Added

- Añadido componente de autenticación JWT con soporte para refresh tokens
- Nuevo endpoint `POST /api/users/login` con validación de credenciales

#### Changed

- Refactorizado módulo de pagos para soportar múltiples pasarelas
- Actualizada dependencia `express` de 4.17 a 4.18

#### Fixed

- Corregido error en validación de formulario de registro cuando el email contiene mayúsculas
- Solucionado fallo de conexión a base de datos en entornos de producción

#### Removed

- Eliminado sistema de autenticación legacy por sesiones de cookie
```

### ❌ Ejemplos incorrectos

```markdown
#### Added

- Próximamente se añadirá soporte para OAuth2              ← FUTURO: no incluir
- Se pensó en añadir caché de Redis                        ← NO implementado: no incluir

#### Changed

- Se mejoró el código                                      ← VAGO: especificar qué
- Varios cambios en la configuración                       ← VAGO: listar los cambios

#### Fixed

- Se leyó la documentación de la API para entender         ← CONSULTA: no incluir
  cómo funciona la autenticación
```

---

## Orden de las entradas

Dentro de cada categoría, las entradas van en **orden cronológico inverso** (más reciente primero):

```markdown
#### Added

- [Última cosa añadida en esta sesión]
- [Primera cosa añadida en esta sesión]
```

Dentro de `[Unreleased]`, los bloques de sesión van en **orden cronológico inverso** (sesión más reciente primero):

```markdown
## [Unreleased]

### 20260218-002-adrian-CLAUDE    ← sesión más reciente
...
---

### 20260218-001-adrian-CLAUDE    ← sesión anterior
...
---
```
