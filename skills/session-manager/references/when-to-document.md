# Cuándo Documentar (Automáticamente)

El agente DEBE documentar automáticamente, SIN esperar instrucción explícita, cuando se realice cualquiera de estas actividades:

## ✅ Casos que SÍ Requieren Documentación

### 1. Implementaciones de Lógica de Negocio
**Qué:** Código que afecta cómo funciona el sistema para el usuario final

**Ejemplos:**
- Función de login/autenticación
- Procesamiento de pagos
- Cálculo de precios o descuentos
- Generación de reportes
- Validación de formularios
- Workflows de aprobación

**NO incluye:**
- Formateo de código (prettier)
- Añadir comentarios
- Reorganizar imports

### 2. Decisiones Arquitectónicas o Técnicas Críticas
**Qué:** Elección de una opción entre varias alternativas disponibles

**Ejemplos:**
- JWT vs sessions para autenticación
- PostgreSQL vs MySQL
- REST vs GraphQL
- Monolito vs microservicios
- Redis vs Memcached
- Arquitectura de carpetas

**Requiere:** Documentar alternativas consideradas y reasoning

### 3. Cambios en Estructura de Base de Datos
**Qué:** Modificaciones que afectan persistencia de datos

**Ejemplos:**
- Crear/modificar/eliminar tablas
- Añadir/modificar/eliminar columnas
- Crear índices
- Cambiar tipos de datos
- Migraciones de esquema
- Cambios en relaciones (foreign keys)

### 4. Integración de Librerías o Servicios Externos
**Qué:** Añadir dependencias externas al proyecto

**Ejemplos:**
- Integrar Stripe para pagos
- Añadir librería de gráficos (Chart.js)
- Conectar con API de terceros
- Implementar servicio de email (SendGrid)
- Integrar analytics (Google Analytics)

**Incluye:** Por qué se eligió esa librería/servicio

### 5. Debates Técnicos (Aunque No Se Implemente Todavía)
**Qué:** Discusiones sobre cómo abordar una funcionalidad

**Ejemplos:**
- "Debatimos si usar websockets o polling para notificaciones"
- "Discutimos 3 enfoques para manejar uploads de archivos grandes"
- "Evaluamos pros/contras de implementar caché"

**Importante:** Se documenta el debate incluso si no se implementa inmediatamente

### 6. Refactorizaciones Significativas
**Qué:** Cambios estructurales que afectan organización del código

**Ejemplos:**
- Renombrar clases/funciones masivamente
- Mover archivos entre carpetas
- Extraer lógica a módulos separados
- Cambiar de callbacks a async/await
- Migrar de JavaScript a TypeScript

**NO incluye:**
- Renombrar una variable
- Mover un único archivo

### 7. Problemas Críticos Resueltos
**Qué:** Bugs importantes o incidentes de producción

**Ejemplos:**
- Bug que causaba pérdida de datos
- Vulnerability de seguridad corregida
- Memory leak identificado y resuelto
- Race condition solucionada
- Incident de producción

**Requiere:** Qué causó el problema, cómo se resolvió, cómo prevenir

### 8. Configuraciones de Infraestructura
**Qué:** Cambios en deployment, CI/CD, contenedores

**Ejemplos:**
- Configurar Docker/docker-compose
- Setup de CI/CD (GitHub Actions, Jenkins)
- Configurar nginx/Apache
- Variables de entorno nuevas
- Scripts de deployment

### 9. Cambios en APIs o Contratos
**Qué:** Modificaciones que afectan interfaces públicas

**Ejemplos:**
- Añadir/modificar endpoints REST
- Cambiar estructura de response
- Modificar parámetros de request
- Versionar API
- Cambiar formato de eventos

**Importante:** Documentar breaking changes

### 10. Optimizaciones de Rendimiento con Métricas
**Qué:** Mejoras medibles de performance

**Ejemplos:**
- "Reducido tiempo de carga de 3s a 800ms"
- "Optimizada query que procesaba 1000 registros"
- "Implementado lazy loading de imágenes"

**Requiere:** Métricas antes/después

---

## 📋 Checklist Rápido

Antes de documentar, verifica que cumple AL MENOS uno de estos:

- [ ] ¿Cambia cómo funciona el sistema para el usuario?
- [ ] ¿Hubo que elegir entre 2+ alternativas?
- [ ] ¿Modifica estructura de base de datos?
- [ ] ¿Añade dependencia externa?
- [ ] ¿Hubo debate sobre cómo implementar?
- [ ] ¿Cambia estructura significativa del código?
- [ ] ¿Resuelve problema crítico/bug importante?
- [ ] ¿Modifica infraestructura/deployment?
- [ ] ¿Cambia APIs o contratos públicos?
- [ ] ¿Mejora rendimiento mediblemente?

**Si SÍ a alguno → DOCUMENTAR**
**Si NO a todos → Ver [when-not-to-document.md](when-not-to-document.md)**
