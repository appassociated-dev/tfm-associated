# Requisitos No Funcionales Base (Agnósticos de Tecnología)

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas  
**Versión:** 1.2  
**Fecha:** Febrero 2026  
**Inputs:** KB-002 (Análisis de Necesidades), KB-003 (Requisitos Funcionales)  
**Estado:** Validado  
**Total RNFs:** 66

---

## Índice de Secciones

1. [Seguridad](#1-seguridad) (14 RNFs)
2. [Rendimiento](#2-rendimiento) (10 RNFs)
3. [RGPD y Cumplimiento Normativo](#3-rgpd-y-cumplimiento-normativo) (12 RNFs)
4. [Disponibilidad y Continuidad](#4-disponibilidad-y-continuidad) (8 RNFs)
5. [Usabilidad y Experiencia de Usuario](#5-usabilidad-y-experiencia-de-usuario) (12 RNFs)
6. [Mantenibilidad y Operaciones](#6-mantenibilidad-y-operaciones) (10 RNFs)

---

## 1. Seguridad

### RNF-001: Autenticación de Usuarios

**Descripción:** El sistema debe implementar autenticación segura para todos los usuarios, requiriendo credenciales válidas antes de permitir acceso a cualquier funcionalidad protegida.

**Criterios de aceptación:**
- Soporte para autenticación por email + contraseña
- Soporte para autenticación por enlace mágico (magic link)
- Las contraseñas deben cumplir política de complejidad mínima (8+ caracteres, mayúsculas, minúsculas, números)
- Bloqueo temporal tras 5 intentos fallidos consecutivos

**Trazabilidad RF:** N10RF13, N10RF14

---

### RNF-002: Gestión de Sesiones

**Descripción:** Las sesiones de usuario deben gestionarse de forma segura, con expiración automática y protección contra secuestro de sesión.

**Criterios de aceptación:**
- Expiración de sesión por inactividad: 30 minutos (configurable por tenant)
- Expiración absoluta de sesión: 24 horas
- Invalidación de sesiones anteriores en nuevo login (opcional por configuración)
- Tokens de sesión con entropía suficiente (mínimo 128 bits)

**Trazabilidad RF:** N2RF01, N2RF04

---

### RNF-003: Autorización Basada en Roles

**Descripción:** El acceso a recursos y operaciones debe estar controlado por un sistema de autorización basado en roles (RBAC) con granularidad a nivel de operación.

**Criterios de aceptación:**
- Cada operación del sistema debe tener permisos asociados
- Los roles agrupan conjuntos de permisos
- Verificación de autorización en cada petición
- Denegación por defecto (whitelist de permisos)

**Trazabilidad RF:** N2RF04, N2RF05

---

### RNF-004: Aislamiento Multi-Tenant por Base de Datos

**Descripción:** Los datos de cada entidad (tenant) deben estar completamente aislados mediante base de datos independiente, aplicando el principio de mínimo privilegio a nivel de conexión.

**Criterios de aceptación:**
- Cada tenant dispone de su propia base de datos física o schema aislado
- Cada tenant tiene un usuario de conexión específico con permisos limitados a su base de datos
- El usuario de conexión no debe tener acceso a bases de datos de otros tenants
- La selección de base de datos se realiza en el momento de autenticación, no mediante filtros en queries
- No debe existir usuario de conexión con acceso a múltiples bases de datos de tenants
- Backups y restauraciones gestionables de forma independiente por tenant

**Trazabilidad RF:** N2RF01, N2RF03

---

### RNF-005: Cifrado de Datos en Tránsito

**Descripción:** Todas las comunicaciones entre clientes y servidor deben estar cifradas.

**Criterios de aceptación:**
- HTTPS obligatorio para todas las conexiones
- TLS 1.2 como versión mínima, TLS 1.3 preferido
- Certificados válidos emitidos por CA reconocida
- HSTS habilitado con max-age mínimo de 1 año

**Trazabilidad RF:** N2RF01

---

### RNF-006: Cifrado de Datos Sensibles en Reposo

**Descripción:** Los datos sensibles almacenados deben estar protegidos mediante cifrado.

**Criterios de aceptación:**
- Contraseñas almacenadas con hash seguro (bcrypt, Argon2 o equivalente)
- Datos bancarios (IBAN) cifrados en base de datos
- DNI/NIE cifrados o con acceso restringido
- Claves de cifrado gestionadas de forma segura (no en código fuente)

**Trazabilidad RF:** N3RF01, N4RF06

---

### RNF-007: Auditoría de Acciones Críticas

**Descripción:** El sistema debe registrar un log de auditoría inmutable para todas las operaciones críticas.

**Criterios de aceptación:**
- Registro de: usuario, timestamp, operación, entidad afectada, valores antes/después
- Operaciones críticas incluyen: modificación de socios, operaciones económicas, cambios de permisos, acceso a datos sensibles
- Los logs de auditoría no pueden ser modificados ni eliminados por usuarios
- Retención mínima de logs: 5 años

**Trazabilidad RF:** N2RF06

---

### RNF-008: Protección contra Ataques Comunes

**Descripción:** El sistema debe implementar protecciones contra los ataques web más comunes (OWASP Top 10).

**Criterios de aceptación:**
- Protección contra inyección SQL mediante consultas parametrizadas
- Protección contra XSS mediante sanitización de outputs
- Protección contra CSRF mediante tokens
- Validación de inputs en servidor (no confiar en validación cliente)
- Cabeceras de seguridad HTTP configuradas (CSP, X-Frame-Options, etc.)

**Trazabilidad RF:** Transversal a todos los RFs

---

### RNF-009: Gestión Segura de Ficheros

**Descripción:** La subida y descarga de ficheros debe realizarse de forma segura.

**Criterios de aceptación:**
- Validación de tipo de fichero por contenido (no solo extensión)
- Límite de tamaño de fichero configurable por tenant
- Almacenamiento fuera del directorio web público
- Nombres de fichero sanitizados (sin caracteres especiales ni rutas)
- Escaneo de malware antes de almacenamiento (recomendado)

**Trazabilidad RF:** N7RF04, N4RF10

---

### RNF-010: Seguridad en APIs

**Descripción:** Las APIs del sistema deben implementar controles de seguridad específicos.

**Criterios de aceptación:**
- Rate limiting por usuario/IP para prevenir abuso
- Validación de Content-Type en peticiones
- No exposición de información sensible en mensajes de error
- Versionado de API para gestionar cambios sin romper compatibilidad

**Trazabilidad RF:** Transversal

---

### RNF-011: Gestión de Secretos

**Descripción:** Las credenciales, claves API y otros secretos deben gestionarse de forma segura.

**Criterios de aceptación:**
- Secretos nunca en código fuente ni en control de versiones
- Uso de variables de entorno o gestor de secretos
- Rotación de secretos sin downtime
- Diferentes secretos por entorno (desarrollo, staging, producción)

**Trazabilidad RF:** N4RF18 (Identificador Acreedor SEPA)

---

### RNF-012: Recuperación de Contraseña Segura

**Descripción:** El proceso de recuperación de contraseña debe ser seguro y no revelar información.

**Criterios de aceptación:**
- No confirmar si un email existe en el sistema
- Tokens de recuperación de un solo uso
- Expiración de token: máximo 1 hora
- Invalidación de tokens anteriores al generar uno nuevo

**Trazabilidad RF:** N10RF13, N10RF14

---

### RNF-013: Principio de Mínimo Privilegio

**Descripción:** Los usuarios y componentes del sistema deben tener únicamente los permisos necesarios para realizar sus funciones.

**Criterios de aceptación:**
- Roles predefinidos con permisos ajustados a responsabilidades reales
- Cuentas de servicio con permisos limitados a su función
- Revisión periódica de permisos asignados
- Sin usuarios con acceso "superadmin" para operativa normal

**Trazabilidad RF:** N2RF04, N2RF05

---

### RNF-014: Separación de Entornos

**Descripción:** Los entornos de desarrollo, pruebas y producción deben estar separados.

**Criterios de aceptación:**
- Datos de producción nunca accesibles desde entornos no productivos
- Credenciales diferentes por entorno
- No conexión directa entre entornos
- Proceso formal de promoción de código entre entornos

**Trazabilidad RF:** N/A (operacional)

---

## 2. Rendimiento

### RNF-015: Tiempo de Respuesta de Páginas

**Descripción:** Las páginas y vistas del sistema deben cargarse en tiempos aceptables para una buena experiencia de usuario.

**Criterios de aceptación:**
- Tiempo de carga inicial (First Contentful Paint): < 2 segundos
- Tiempo hasta interactivo (Time to Interactive): < 4 segundos
- Operaciones CRUD simples: < 500ms
- Medido con conexión 4G estándar

**Trazabilidad RF:** N10RF01 (Portal del Socio)

---

### RNF-016: Tiempo de Respuesta de APIs

**Descripción:** Las APIs del sistema deben responder en tiempos predecibles.

**Criterios de aceptación:**
- Operaciones de lectura simple: < 200ms (p95)
- Operaciones de escritura simple: < 500ms (p95)
- Operaciones complejas (informes): < 5 segundos
- Percentil 99 no debe superar 3x el p95

**Trazabilidad RF:** Transversal

---

### RNF-017: Capacidad de Usuarios Concurrentes

**Descripción:** El sistema debe soportar un número razonable de usuarios simultáneos por tenant.

**Criterios de aceptación:**
- Mínimo 50 usuarios concurrentes por tenant sin degradación
- Mínimo 500 usuarios concurrentes totales en la plataforma
- Degradación graceful ante picos (no caída total)

**Trazabilidad RF:** N2RF01

---

### RNF-018: Rendimiento de Operaciones Masivas

**Descripción:** Las operaciones que procesan múltiples registros deben completarse en tiempos razonables.

**Criterios de aceptación:**
- Generación de remesa SEPA (500 socios): < 30 segundos
- Importación de socios (500 registros): < 60 segundos
- Generación masiva de cuotas (500 socios): < 30 segundos
- Exportación a Excel (1000 registros): < 15 segundos

**Trazabilidad RF:** N4RF02, N4RF17, N8RF01

---

### RNF-019: Rendimiento de Búsquedas

**Descripción:** Las búsquedas y filtrados deben responder de forma ágil.

**Criterios de aceptación:**
- Búsqueda de socio por nombre/DNI: < 500ms
- Listado paginado de socios (50 por página): < 300ms
- Filtrado combinado (estado + tipo + antigüedad): < 1 segundo
- Búsqueda en documentos (si implementada): < 2 segundos

**Trazabilidad RF:** N3RF01, N7RF06

---

### RNF-020: Escalabilidad Horizontal

**Descripción:** La arquitectura debe permitir escalar horizontalmente para absorber crecimiento.

**Criterios de aceptación:**
- Aplicación stateless que permita múltiples instancias
- Base de datos con capacidad de réplicas de lectura
- Sin dependencias de estado en servidor específico
- Documentación de proceso de escalado

**Trazabilidad RF:** N2RF01 (Multi-tenant SaaS)

---

### RNF-021: Optimización de Recursos

**Descripción:** El sistema debe hacer uso eficiente de recursos de servidor.

**Criterios de aceptación:**
- Uso de memoria estable (sin memory leaks)
- Conexiones a base de datos mediante pool
- Caché de datos frecuentemente accedidos
- Compresión de respuestas HTTP (gzip/brotli)

**Trazabilidad RF:** N/A (operacional)

---

### RNF-022: Gestión de Carga de Ficheros

**Descripción:** La subida de ficheros no debe bloquear la aplicación ni degradar el rendimiento.

**Criterios de aceptación:**
- Subida de ficheros con indicador de progreso
- Procesamiento asíncrono de ficheros grandes
- Límite de tamaño configurable (default: 10MB)
- No timeout en subidas dentro del límite

**Trazabilidad RF:** N7RF04, N8RF01

---

### RNF-023: Rendimiento del Dashboard

**Descripción:** El dashboard principal debe cargar métricas en tiempo razonable.

**Criterios de aceptación:**
- KPIs principales: < 2 segundos
- Gráficos de evolución: < 3 segundos
- Actualización incremental sin recargar página completa
- Indicador de carga mientras se obtienen datos

**Trazabilidad RF:** N9RF01, N9RF02, N9RF03

---

### RNF-024: Generación de PDFs

**Descripción:** La generación de documentos PDF debe completarse en tiempos aceptables.

**Criterios de aceptación:**
- Carnet individual: < 2 segundos
- Recibo/justificante: < 2 segundos
- Informe de Asamblea: < 10 segundos
- Generación masiva de carnets (100): < 60 segundos (asíncrono)

**Trazabilidad RF:** N3RF30, N3RF32, N4RF13, N9RF08

---

## 3. RGPD y Cumplimiento Normativo

### RNF-025: Registro de Actividades de Tratamiento

**Descripción:** El sistema debe facilitar el mantenimiento del RAT obligatorio según RGPD.

**Criterios de aceptación:**
- Plantilla precargada con tratamientos típicos de colectividades
- Campos obligatorios: finalidad, categorías de datos, destinatarios, plazos retención
- Exportable en formato auditable
- Versionado de cambios en el RAT

**Trazabilidad RF:** N11RF01

---

### RNF-026: Gestión de Consentimientos

**Descripción:** El sistema debe registrar y gestionar los consentimientos de forma granular.

**Criterios de aceptación:**
- Registro de fecha, hora y texto exacto del consentimiento
- Consentimientos separados por finalidad (comunicaciones, imagen, cesión a terceros)
- Posibilidad de revocar sin afectar la licitud del tratamiento anterior
- Evidencia del consentimiento exportable

**Trazabilidad RF:** N11RF02, N10RF11

---

### RNF-027: Derecho de Acceso

**Descripción:** El sistema debe permitir ejercer el derecho de acceso en el plazo legal.

**Criterios de aceptación:**
- Exportación de todos los datos del interesado en formato estructurado
- Incluir información sobre tratamientos realizados
- Proceso completable en < 72 horas (margen para plazo legal de 1 mes)
- Registro de la solicitud y respuesta

**Trazabilidad RF:** N11RF03

---

### RNF-028: Derecho de Rectificación

**Descripción:** El sistema debe facilitar la rectificación de datos inexactos.

**Criterios de aceptación:**
- Workflow de solicitud de rectificación
- Trazabilidad de cambios realizados
- Notificación al interesado de la rectificación
- Propagación a terceros si los datos fueron comunicados

**Trazabilidad RF:** N11RF04

---

### RNF-029: Derecho de Supresión

**Descripción:** El sistema debe permitir la supresión respetando obligaciones legales de conservación.

**Criterios de aceptación:**
- Identificación de datos suprimibles vs retenidos por obligación legal
- Supresión efectiva (no solo marcado como eliminado) cuando proceda
- Documentación del motivo de retención si no se suprime
- Anonimización como alternativa cuando la supresión no es posible

**Trazabilidad RF:** N11RF05

---

### RNF-030: Derecho de Portabilidad

**Descripción:** El sistema debe permitir la portabilidad de datos en formato estructurado.

**Criterios de aceptación:**
- Exportación en formato estructurado, de uso común y lectura mecánica (JSON, CSV)
- Incluir datos proporcionados por el interesado
- Incluir datos generados por su actividad
- No incluir inferencias o datos derivados

**Trazabilidad RF:** N11RF06

---

### RNF-031: Minimización de Datos

**Descripción:** El sistema solo debe recoger y procesar los datos estrictamente necesarios.

**Criterios de aceptación:**
- Campos obligatorios limitados al mínimo imprescindible
- Justificación documentada para cada dato recogido
- No recogida de datos "por si acaso"
- Revisión periódica de datos almacenados

**Trazabilidad RF:** N3RF01

---

### RNF-032: Limitación del Plazo de Conservación

**Descripción:** Los datos deben conservarse solo durante el tiempo necesario.

**Criterios de aceptación:**
- Definición de plazos de retención por tipo de dato
- Proceso de purga/anonimización automático o guiado
- Retención extendida solo con base legal (obligaciones fiscales: 4-6 años)
- Documentación de plazos aplicados

**Trazabilidad RF:** N11RF01

---

### RNF-033: Notificación de Brechas de Seguridad

**Descripción:** El sistema debe facilitar el cumplimiento de la obligación de notificar brechas.

**Criterios de aceptación:**
- Capacidad de identificar alcance de una brecha (usuarios/datos afectados)
- Plantilla de notificación a AEPD (72 horas)
- Plantilla de comunicación a afectados si alto riesgo
- Registro de incidentes de seguridad

**Trazabilidad RF:** N2RF06 (Auditoría)

---

### RNF-034: Privacidad por Diseño

**Descripción:** La privacidad debe considerarse desde el diseño, no como añadido posterior.

**Criterios de aceptación:**
- Configuración de privacidad restrictiva por defecto
- No compartición de datos sin acción explícita del usuario
- Seudonimización donde sea posible
- Evaluación de impacto documentada para tratamientos de riesgo

**Trazabilidad RF:** Transversal

---

### RNF-035: Tratamiento de Datos Religiosos (Cofradías)

**Descripción:** El tratamiento de datos de convicciones religiosas debe cumplir requisitos específicos.

**Criterios de aceptación:**
- Base jurídica: artículo 9.2.d RGPD (entidad con finalidad religiosa)
- Solo datos de miembros actuales o antiguos
- Sin comunicación externa sin consentimiento explícito
- Medidas de seguridad reforzadas para esta categoría

**Trazabilidad RF:** N11RF07, N3RF02

---

### RNF-036: Cumplimiento LO 1/2002

**Descripción:** El sistema debe facilitar el cumplimiento de la Ley Orgánica de Asociaciones.

**Criterios de aceptación:**
- Soporte para libros obligatorios: socios, actas, contabilidad, inventario
- Alertas de Asamblea General anual
- Validación de composición de Junta Directiva
- Generación de documentos para Registro de Asociaciones

**Trazabilidad RF:** N11RF08-N11RF17

---

## 4. Disponibilidad y Continuidad

### RNF-037: Disponibilidad del Servicio

**Descripción:** El sistema debe mantener un nivel de disponibilidad adecuado para uso no crítico.

**Criterios de aceptación:**
- Disponibilidad objetivo: 99.5% mensual (≈3.6 horas downtime/mes)
- Mantenimientos planificados fuera de horario pico (noches/fines de semana)
- Comunicación anticipada de mantenimientos (48h mínimo)
- Página de estado del servicio accesible

**Trazabilidad RF:** N2RF01 (SaaS)

---

### RNF-038: Copias de Seguridad

**Descripción:** Los datos deben respaldarse regularmente para permitir recuperación ante desastres.

**Criterios de aceptación:**
- Backup completo diario
- Retención de backups: mínimo 30 días
- Backups almacenados en ubicación geográfica diferente
- Pruebas de restauración periódicas (mínimo trimestral)

**Trazabilidad RF:** N8RF13

---

### RNF-039: Recuperación ante Desastres

**Descripción:** Debe existir un plan de recuperación ante desastres documentado y probado.

**Criterios de aceptación:**
- RTO (Recovery Time Objective): < 24 horas
- RPO (Recovery Point Objective): < 24 horas (máximo pérdida de un día de datos)
- Procedimiento documentado de recuperación
- Responsables identificados

**Trazabilidad RF:** N/A (operacional)

---

### RNF-040: Degradación Graceful

**Descripción:** Ante fallos parciales, el sistema debe degradarse de forma controlada.

**Criterios de aceptación:**
- Fallo de servicio no crítico no debe tumbar el sistema completo
- Funcionalidades core disponibles aunque fallen servicios secundarios
- Mensajes de error claros para el usuario
- Recuperación automática cuando el servicio vuelve

**Trazabilidad RF:** N/A (operacional)

---

### RNF-041: Monitorización Proactiva

**Descripción:** El sistema debe monitorizarse para detectar problemas antes de que afecten a usuarios.

**Criterios de aceptación:**
- Alertas de uso de CPU/memoria por encima de umbrales
- Alertas de errores frecuentes en logs
- Alertas de tiempos de respuesta degradados
- Dashboard de métricas de salud del sistema

**Trazabilidad RF:** N/A (operacional)

---

### RNF-042: Gestión de Errores

**Descripción:** Los errores deben gestionarse de forma que no comprometan la estabilidad.

**Criterios de aceptación:**
- Errores capturados y registrados sin exponer stack traces al usuario
- Errores de terceros (pasarela pago, email) no deben bloquear operaciones
- Reintentos automáticos para operaciones idempotentes
- Circuit breaker para servicios externos

**Trazabilidad RF:** N4RF22 (Devoluciones SEPA)

---

### RNF-043: Gestión de Versiones y Despliegues

**Descripción:** Los despliegues deben realizarse con mínimo impacto en disponibilidad.

**Criterios de aceptación:**
- Despliegues con zero-downtime (o downtime < 5 minutos)
- Capacidad de rollback rápido ante problemas
- Versionado semántico del software
- Changelog accesible de cambios

**Trazabilidad RF:** N/A (operacional)

---

### RNF-044: Independencia de Proveedor

**Descripción:** La arquitectura debe minimizar el vendor lock-in.

**Criterios de aceptación:**
- Datos exportables en formatos estándar
- Sin uso de servicios propietarios sin alternativa
- Documentación de dependencias externas
- Plan de contingencia para cambio de proveedor crítico

**Trazabilidad RF:** N8RF06-N8RF13 (Exportación)

---

## 5. Usabilidad y Experiencia de Usuario

### RNF-045: Diseño Responsive

**Descripción:** La interfaz debe adaptarse a diferentes tamaños de pantalla.

**Criterios de aceptación:**
- Funcional en móviles (320px+), tablets y desktop
- Mobile-first para portal del socio
- Navegación adaptada a touch en móviles
- Sin scroll horizontal en ningún dispositivo

**Trazabilidad RF:** N10RF01, N10RF12

---

### RNF-046: Accesibilidad WCAG

**Descripción:** La aplicación debe ser accesible para personas con discapacidad.

**Criterios de aceptación:**
- Cumplimiento WCAG 2.1 nivel AA mínimo
- Navegación completa por teclado
- Compatibilidad con lectores de pantalla
- Contraste de colores suficiente
- Textos alternativos en imágenes

**Trazabilidad RF:** N10RF01

---

### RNF-047: Idioma y Localización

**Descripción:** La aplicación debe estar disponible en español con posibilidad de extensión.

**Criterios de aceptación:**
- Interfaz completa en español (España)
- Formatos de fecha, moneda y números según locale español
- Arquitectura preparada para múltiples idiomas (i18n)
- Mensajes de error en español

**Trazabilidad RF:** Transversal

---

### RNF-048: Consistencia de Interfaz

**Descripción:** La interfaz debe ser consistente en toda la aplicación.

**Criterios de aceptación:**
- Sistema de diseño unificado (colores, tipografía, espaciados)
- Patrones de interacción consistentes
- Iconografía coherente
- Terminología uniforme

**Trazabilidad RF:** Transversal

---

### RNF-049: Feedback al Usuario

**Descripción:** El sistema debe proporcionar feedback claro sobre acciones y estados.

**Criterios de aceptación:**
- Indicadores de carga para operaciones > 1 segundo
- Mensajes de confirmación para acciones completadas
- Mensajes de error descriptivos y accionables
- Estado de operaciones asíncronas visible

**Trazabilidad RF:** Transversal

---

### RNF-050: Skeleton Screens

**Descripción:** Las pantallas deben mostrar esqueletos de contenido durante la carga para mejorar la percepción de velocidad.

**Criterios de aceptación:**
- Skeleton screens en listados (socios, pagos, eventos)
- Skeleton en dashboard para cada widget/KPI
- Skeleton en fichas de detalle (socio, evento)
- Forma del skeleton debe aproximar el contenido final
- Transición suave de skeleton a contenido real
- Tiempo máximo de visualización de skeleton: 3 segundos (si supera, mostrar mensaje)

**Trazabilidad RF:** N9RF01 (Dashboard), N3RF01 (Listado socios), N10RF01 (Portal)

---

### RNF-051: Progressive Rendering

**Descripción:** El contenido debe renderizarse de forma progresiva, mostrando primero lo más importante.

**Criterios de aceptación:**
- Contenido crítico (above the fold) renderizado primero
- Datos secundarios cargados de forma diferida (lazy loading)
- Imágenes con lazy loading y placeholder
- Tablas grandes con virtualización o paginación
- Gráficos renderizados tras contenido principal
- Sin bloqueo de UI mientras cargan datos secundarios

**Trazabilidad RF:** N9RF01 (Dashboard), N9RF05-06 (Gráficos), N10RF01 (Portal)

---

### RNF-052: Prevención de Errores

**Descripción:** La interfaz debe ayudar a prevenir errores del usuario.

**Criterios de aceptación:**
- Validación en tiempo real de formularios
- Confirmación para acciones destructivas
- Valores por defecto sensatos
- Autocompletado donde sea apropiado

**Trazabilidad RF:** N3RF20-N3RF22 (Procesos de Alta)

---

### RNF-053: Eficiencia de Uso

**Descripción:** Las tareas frecuentes deben poder realizarse con mínimo esfuerzo.

**Criterios de aceptación:**
- Accesos directos a funciones frecuentes desde dashboard
- Búsqueda global accesible desde cualquier pantalla
- Atajos de teclado para usuarios avanzados
- Recordar preferencias del usuario (última vista, filtros)

**Trazabilidad RF:** N9RF01

---

### RNF-054: Ayuda Contextual

**Descripción:** El usuario debe poder obtener ayuda sin salir del contexto actual.

**Criterios de aceptación:**
- Tooltips en campos complejos
- Enlaces a documentación desde pantallas relevantes
- Mensajes de ayuda en formularios complejos
- FAQ accesible

**Trazabilidad RF:** Transversal

---

### RNF-055: Onboarding de Usuarios

**Descripción:** Los nuevos usuarios deben poder empezar a usar el sistema fácilmente.

**Criterios de aceptación:**
- Asistente de configuración inicial para nuevas entidades
- Tour guiado opcional de funcionalidades principales
- Datos de ejemplo/demo disponibles (opcional)
- Documentación de inicio rápido

**Trazabilidad RF:** N2RF03

---

### RNF-056: PWA (Progressive Web App)

**Descripción:** El portal del socio debe funcionar como PWA instalable.

**Criterios de aceptación:**
- Instalable en pantalla de inicio (móvil y desktop)
- Funcionalidad offline básica (visualizar carnet, datos cacheados)
- Notificaciones push (previo consentimiento)
- Actualización automática del service worker

**Trazabilidad RF:** N10RF12, N10RF15

---

## 6. Mantenibilidad y Operaciones

### RNF-057: Documentación Técnica

**Descripción:** El sistema debe estar documentado para facilitar su mantenimiento.

**Criterios de aceptación:**
- README con instrucciones de instalación y ejecución
- Documentación de arquitectura y decisiones (ADRs)
- Documentación de API (OpenAPI/Swagger)
- Comentarios en código para lógica compleja

**Trazabilidad RF:** N/A (requisito TFM)

---

### RNF-058: Cobertura de Tests Unitarios

**Descripción:** El código de dominio debe tener alta cobertura de tests unitarios con gates en CI.

**Criterios de aceptación:**
- Cobertura objetivo en código de dominio: ≥ 90%
- Tests unitarios aislados, sin dependencias externas (BD, APIs, filesystem)
- Tiempo de ejecución de suite unitaria: < 2 minutos
- Proporción en pirámide de testing: ~70% del total de tests

**CI Quality Gates (el build falla si no se cumplen):**

| Métrica | Umbral Global | Umbral Diff (PRs) |
|---------|---------------|-------------------|
| Line coverage | ≥ 80% | ≥ 85% |
| Branch coverage | ≥ 70% | ≥ 75% |

- PR no mergeable si diff coverage < umbral
- Reportes de coverage visibles en PR como comentario automático
- Exclusiones documentadas: DTOs, configuración, código generado

**Trazabilidad RF:** N/A (calidad)

---

### RNF-059: Tests de Integración

**Descripción:** Los puntos de integración deben estar cubiertos por tests de integración.

**Criterios de aceptación:**
- Cobertura de repositorios y acceso a datos
- Tests de integración con base de datos real (contenedor)
- Tests de servicios externos con mocks/stubs controlados
- Proporción en pirámide de testing: ~20% del total de tests
- Tiempo de ejecución: < 10 minutos

**Trazabilidad RF:** N4RF17 (SEPA), N8RF01 (Importación)

---

### RNF-060: Tests End-to-End (E2E)

**Descripción:** Los flujos críticos de usuario deben estar cubiertos por tests E2E.

**Criterios de aceptación:**
- Flujos críticos cubiertos: login, alta socio, registro pago, generación remesa
- Proporción en pirámide de testing: ~10% del total de tests
- Ejecución en entorno similar a producción
- Tiempo de ejecución: < 15 minutos
- Tests estables (flaky rate < 5%)

**Trazabilidad RF:** N3RF20 (Alta), N4RF09 (Cobros), N4RF17 (SEPA)

---

### RNF-061: Logging Estructurado

**Descripción:** Los logs deben ser estructurados y útiles para diagnóstico.

**Criterios de aceptación:**
- Formato estructurado (JSON preferido)
- Niveles de log: ERROR, WARN, INFO, DEBUG
- Correlation ID para trazar peticiones
- No logging de datos sensibles (contraseñas, tokens, DNI completo)

**Trazabilidad RF:** N2RF06

---

### RNF-062: Configuración Externalizada

**Descripción:** La configuración debe estar externalizada del código.

**Criterios de aceptación:**
- Variables de entorno para configuración sensible
- Ficheros de configuración para settings de aplicación
- Configuración diferenciada por entorno
- Documentación de todas las opciones de configuración

**Trazabilidad RF:** N/A (operacional)

---

### RNF-063: Gestión de Dependencias

**Descripción:** Las dependencias deben gestionarse de forma controlada.

**Criterios de aceptación:**
- Dependencias versionadas y bloqueadas (lock file)
- Actualizaciones de seguridad aplicadas en < 1 semana
- Sin dependencias abandonadas o sin mantenimiento
- Auditoría periódica de vulnerabilidades

**Trazabilidad RF:** N/A (seguridad/calidad)

---

### RNF-064: Observabilidad

**Descripción:** El sistema debe proporcionar visibilidad sobre su comportamiento.

**Criterios de aceptación:**
- Métricas de aplicación (requests, errores, latencias)
- Logs correlacionados con métricas
- Trazas distribuidas si arquitectura lo requiere
- Dashboard de operaciones

**Trazabilidad RF:** N/A (operacional)

---

### RNF-065: Facilidad de Despliegue

**Descripción:** El despliegue debe ser reproducible y automatizable.

**Criterios de aceptación:**
- Proceso de despliegue documentado
- Preferiblemente automatizado (CI/CD)
- Entorno reproducible (contenedores o similar)
- Migraciones de base de datos automatizadas

**Trazabilidad RF:** N/A (operacional)

---

### RNF-066: Gestión de Migraciones de Datos

**Descripción:** Los cambios de esquema de datos deben gestionarse de forma controlada.

**Criterios de aceptación:**
- Migraciones versionadas y reversibles
- Migraciones ejecutables sin downtime (para cambios no destructivos)
- Backup antes de migraciones destructivas
- Procedimiento de rollback documentado

**Trazabilidad RF:** N/A (operacional)

---

## Trazabilidad

### Matriz RNF → Sección RF

| Categoría RNF | RFs Relacionados |
|---------------|------------------|
| Seguridad | N2 (Acceso), N10RF13-14 (Autenticación), N4RF09 (Datos bancarios), N7 (Documentos) |
| Rendimiento | N4RF02/17 (Masivas), N8 (Import/Export), N9 (Dashboard), N10 (Portal) |
| RGPD | N11 completo, N3RF01 (Datos personales), N10RF11 (Consentimientos) |
| Disponibilidad | N2RF01 (Multi-tenant SaaS), Transversal |
| Usabilidad | N10 (Portal Socio), N9 (Dashboard), Transversal |
| Mantenibilidad | N/A (operacional), Requisitos TFM |

### Cobertura de Secciones N11 (Cumplimiento)

| RF | RNF Relacionados |
|----|------------------|
| N11RF01 (RAT) | RNF-025, RNF-032 |
| N11RF02 (Consentimientos) | RNF-026 |
| N11RF03 (Acceso) | RNF-027 |
| N11RF04 (Rectificación) | RNF-028 |
| N11RF05 (Supresión) | RNF-029 |
| N11RF06 (Portabilidad) | RNF-030 |
| N11RF07 (Datos religiosos) | RNF-035 |
| N11RF08-N11RF17 | RNF-036 |

---

## Priorización para MVP

### Críticos (Must Have)
- RNF-001 a RNF-006 (Autenticación, sesiones, RBAC, aislamiento, cifrado)
- RNF-007 (Auditoría)
- RNF-015 a RNF-017 (Tiempos respuesta básicos)
- RNF-025 a RNF-030 (RGPD core)
- RNF-037, RNF-038 (Disponibilidad, backups)
- RNF-045 a RNF-047 (Responsive, accesibilidad básica, español)
- RNF-050, RNF-051 (Skeleton screens, progressive rendering)
- RNF-057, RNF-058, RNF-061 (Documentación, tests unitarios, logging)

### Importantes (Should Have)
- RNF-008 a RNF-010 (Seguridad avanzada)
- RNF-018 a RNF-019 (Rendimiento operaciones masivas)
- RNF-031 a RNF-034 (RGPD avanzado)
- RNF-048 a RNF-049, RNF-052 a RNF-054 (UX avanzada)
- RNF-059, RNF-060 (Tests integración/E2E)
- RNF-062 a RNF-066 (Operaciones)

### Deseables (Nice to Have)
- RNF-011 a RNF-014 (Seguridad enterprise)
- RNF-020 a RNF-024 (Escalabilidad, optimizaciones)
- RNF-035, RNF-036 (Cumplimiento específico)
- RNF-039 a RNF-044 (Continuidad avanzada)
- RNF-055, RNF-056 (Onboarding, PWA completa)

---

## Changelog

- v1.2 (Feb 2026):
  - RNF-058: CI Quality Gates con line coverage (≥80%), branch coverage (≥70%), diff coverage PRs (≥85%/75%)
  - Corregida numeración RNF-056 a RNF-066
- v1.1 (Feb 2026): 
  - RNF-004: Multi-tenant por base de datos separada (no filtros)
  - RNF-050/051: Skeleton screens y progressive rendering
  - RNF-058/059/060: Desglose testing según pirámide (unitarios 70%, integración 20%, E2E 10%)
  - Total: 66 RNFs
- v1.0 (Feb 2026): Versión inicial - 62 RNFs en 6 categorías