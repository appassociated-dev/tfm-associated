# User Stories y Criterios de Aceptación

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas  
**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Inputs:** KB-003 (Requisitos Funcionales), KB-005 (Modelo de Dominio), KB-008 (RNF Técnicos)  
**Estado:** Aprobado  
**Total User Stories:** 202 (80 Must, 110 Should, 12 Could, 0 Won't)

---

## Índice

0. [Resumen General](#resumen-general)
1. [BC-Identity: Acceso y Autorización](#1-bc-identidad-acceso-y-autorización) (N2)
2. [BC-Membership: Gestión de Socios](#2-bc-membresia-gestión-de-socios) (N3)
3. [BC-Treasury: Gestión Económica](#3-bc-tesoreria-gestión-económica) (N4)
4. [BC-Events: Actividades y Participación](#4-bc-eventos-actividades-y-participación) (N5)
5. [BC-Communication: Notificaciones y Mensajería](#5-bc-comunicacion-notificaciones-y-mensajería) (N6)
6. [BC-Documents: Gestión Documental](#6-bc-documentos-gestión-documental) (N7)
7. [Transversal: Importación y Exportación](#7-transversal-importación-y-exportación) (N8)
8. [Transversal: Visibilidad y Reporting](#8-transversal-visibilidad-y-reporting) (N9)
9. [Transversal: Portal del Socio](#9-transversal-portal-del-socio) (N10)
10. [Transversal: Cumplimiento Normativo](#10-transversal-cumplimiento-normativo) (N11)

---

## Leyenda

### Roles del Sistema
| Código | Rol | Descripción |
|--------|-----|-------------|
| `ADMIN` | Administrador Sistema | Gestión de tenants y configuración global |
| `PRES` | Presidente/Hermano Mayor | Acceso total al tenant, aprobaciones críticas |
| `SEC` | Secretario | Gestión de socios, actas, documentación |
| `TES` | Tesorero | Gestión económica, cuotas, cobros |
| `VOC` | Vocal | Acceso limitado según área asignada |
| `SOC` | Socio | Acceso lectura propia vía portal |

### Priorización MoSCoW
| Prioridad | Significado | Criterio |
|-----------|-------------|----------|
| **Must** | Imprescindible | Sin esto el sistema no es viable |
| **Should** | Importante | Necesario para operativa normal |
| **Could** | Deseable | Mejora la experiencia pero no bloquea |
| **Won't** | Excluido v1 | Se considerará en versiones futuras |

---

## Resumen General

Esta sección proporciona una vista consolidada de todas las User Stories del proyecto, organizadas por Bounded Context y subsección funcional, con desglose por prioridad MoSCoW.

### Distribución de User Stories por Bounded Context y Sección

| BC | Sección H3 | Must | Should | Could | Won't | Total |
|----|-----------|------|--------|-------|-------|-------|
| **BC-Identity** | **1.1 Gestión Multi-Tenant** | 3 | 0 | 0 | 0 | **3** |
| | **1.2 Gestión de Roles y Permisos** | 1 | 1 | 0 | 0 | **2** |
| | **1.3 Auditoría y Trazabilidad** | 1 | 0 | 0 | 0 | **1** |
| | **1.4 Gestión de Traspasos** | 0 | 2 | 0 | 0 | **2** |
| | **Subtotal BC-Identity** | **5** | **3** | **0** | **0** | **8** |
| **BC-Membership** | **2.1 Ficha de Socio** | 1 | 4 | 0 | 0 | **5** |
| | **2.2 Estados y Tipos de Socio** | 2 | 4 | 0 | 0 | **6** |
| | **2.3 Historial y Antigüedad** | 2 | 1 | 0 | 0 | **3** |
| | **2.4 Gestión de Ejercicios** | 2 | 2 | 1 | 0 | **5** |
| | **2.5 Procesos de Alta** | 1 | 3 | 0 | 0 | **4** |
| | **2.6 Procesos de Baja** | 2 | 2 | 0 | 0 | **4** |
| | **2.7 Lista de Espera** | 0 | 2 | 0 | 0 | **2** |
| | **2.8 Carnets y Acreditaciones** | 2 | 3 | 0 | 0 | **5** |
| | **Subtotal BC-Membership** | **12** | **21** | **1** | **0** | **34** |
| **BC-Treasury** | **3.1 Configuración de Planes de Cuota** | 6 | 4 | 0 | 0 | **10** |
| | **3.2 Registro de Cobros** | 4 | 1 | 0 | 0 | **5** |
| | **3.3 Gestión de Morosidad** | 1 | 2 | 0 | 0 | **3** |
| | **3.4 Remesas SEPA** | 6 | 1 | 0 | 0 | **7** |
| | **3.5 Pasarela de Pago Online** | 0 | 2 | 2 | 0 | **4** |
| | **3.6 Contabilidad y Fiscalidad** | 1 | 4 | 1 | 0 | **6** |
| | **3.7 Caja por Turnos (Peñas)** | 0 | 5 | 0 | 0 | **5** |
| | **Subtotal BC-Treasury** | **18** | **19** | **3** | **0** | **40** |
| **BC-Events** | **4.1 Registro y Tipos de Eventos** | 1 | 1 | 0 | 0 | **2** |
| | **4.2 Calendario y Sincronización** | 1 | 1 | 0 | 0 | **2** |
| | **4.3 Inscripciones y Control de Aforo** | 3 | 4 | 0 | 0 | **7** |
| | **4.4 Check-in y Control de Asistencia** | 2 | 3 | 0 | 0 | **5** |
| | **4.5 Eventos Específicos: Comidas Populares** | 0 | 3 | 0 | 0 | **3** |
| | **4.6 Eventos Específicos: Procesiones y Cultos** | 0 | 4 | 3 | 0 | **7** |
| | **4.7 Eventos Específicos: Competiciones** | 0 | 4 | 0 | 0 | **4** |
| | **Subtotal BC-Events** | **7** | **20** | **3** | **0** | **30** |
| **BC-Communication** | **5.1 Canales de Comunicación** | 1 | 2 | 1 | 0 | **4** |
| | **5.2 Segmentación y Plantillas** | 1 | 2 | 0 | 0 | **3** |
| | **5.3 Histórico y Estadísticas** | 1 | 1 | 0 | 0 | **2** |
| | **5.4 Notificaciones Automáticas** | 4 | 3 | 0 | 0 | **7** |
| | **Subtotal BC-Communication** | **7** | **8** | **1** | **0** | **16** |
| **BC-Documents** | **6.1 Libro de Actas** | 4 | 3 | 0 | 0 | **7** |
| | **6.2 Repositorio de Documentos** | 4 | 5 | 3 | 0 | **12** |
| | **Subtotal BC-Documents** | **8** | **8** | **3** | **0** | **19** |
| **Transversal** | **7.1 Importación de Datos** | 3 | 2 | 0 | 0 | **5** |
| **(Importación/Exportación)** | **7.2 Exportación de Datos** | 3 | 4 | 1 | 0 | **8** |
| | **Subtotal Importación/Exportación** | **6** | **6** | **1** | **0** | **13** |
| **Transversal** | **8.1 Dashboard y KPIs** | 3 | 4 | 0 | 0 | **7** |
| **(Visibilidad/Reporting)** | **8.2 Informes Predefinidos** | 3 | 2 | 0 | 0 | **5** |
| | **Subtotal Visibilidad/Reporting** | **6** | **6** | **0** | **0** | **12** |
| **Transversal** | **9.1 Acceso y Autenticación** | 2 | 1 | 0 | 0 | **3** |
| **(Portal del Socio)** | **9.2 Consultas del Socio** | 4 | 4 | 0 | 0 | **8** |
| | **9.3 Configuración del Socio** | 1 | 3 | 0 | 0 | **4** |
| | **Subtotal Portal del Socio** | **7** | **8** | **0** | **0** | **15** |
| **Transversal** | **10.1 RGPD** | 3 | 4 | 0 | 0 | **7** |
| **(Cumplimiento Normativo)** | **10.2 Ley Orgánica 1/2002** | 1 | 3 | 0 | 0 | **4** |
| | **10.3 Alertas de Cumplimiento** | 0 | 4 | 0 | 0 | **4** |
| | **Subtotal Cumplimiento Normativo** | **4** | **11** | **0** | **0** | **15** |
| | **TOTAL GENERAL** | **80** | **110** | **12** | **0** | **202** |

### Análisis de Distribución

**Distribución por Prioridad MoSCoW:**
- **Must (Imprescindibles):** 80 US (39.6%) - Funcionalidades críticas sin las cuales el sistema no es viable
- **Should (Importantes):** 110 US (54.5%) - Funcionalidades necesarias para la operativa normal
- **Could (Deseables):** 12 US (5.9%) - Mejoras que enriquecen la experiencia pero no bloquean
- **Won't (Excluidas v1):** 0 US (0.0%) - Ninguna US marcada explícitamente como fuera de scope para v1

**Bounded Contexts más críticos (por Must):**
1. BC-Treasury: 18 Must (22.5% del total de Must)
2. BC-Membership: 12 Must (15.0% del total de Must)
3. BC-Documents: 8 Must (10.0% del total de Must)

**Bounded Contexts con mayor volumen total:**
1. BC-Treasury: 40 US (19.8% del total)
2. BC-Membership: 34 US (16.8% del total)
3. BC-Events: 30 US (14.9% del total)

**Observaciones:**
- El proyecto tiene un fuerte énfasis en funcionalidades core (Must + Should = 93.6%)
- BC-Treasury y BC-Membership concentran las funcionalidades más críticas
- Las funcionalidades transversales (Importación, Reporting, Portal, Cumplimiento) representan el 27.7% del total
- No hay User Stories marcadas como Won't, lo que indica que el scope está bien ajustado para la v1

---

## Navegación

Cada US se encuentra en `us/us-{xxx}.md`.
Ejemplo: `references/us/us-001.md` para US-001.
