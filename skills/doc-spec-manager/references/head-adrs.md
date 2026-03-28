# Architectural Decision Records (ADRs)

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas  
**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Inputs:** KB-004 (RNF Base), KB-005 (Modelo de Dominio)  
**Estado:** Verificado  
**Total ADRs:** 12

---

## Índice

- [Architectural Decision Records (ADRs)](#architectural-decision-records-adrs)
  - [Índice](#índice)
  - [ADR-001: Arquitectura General - Monolito Modular](#adr-001-arquitectura-general---monolito-modular)
    - [Estado](#estado)
    - [Contexto](#contexto)
    - [Decisión](#decisión)
    - [Consecuencias](#consecuencias)
    - [Trazabilidad](#trazabilidad)
  - [ADR-002: Estrategia Multi-Tenant por Base de Datos](#adr-002-estrategia-multi-tenant-por-base-de-datos)
    - [Estado](#estado-1)
    - [Contexto](#contexto-1)
    - [Decisión](#decisión-1)
    - [Consecuencias](#consecuencias-1)
    - [Trazabilidad](#trazabilidad-1)
  - [ADR-003: Estructura de Módulos por Bounded Context](#adr-003-estructura-de-módulos-por-bounded-context)
    - [Estado](#estado-2)
    - [Contexto](#contexto-2)
    - [Decisión](#decisión-2)
    - [Consecuencias](#consecuencias-2)
    - [Trazabilidad](#trazabilidad-2)
  - [ADR-004: Comunicación entre Bounded Contexts](#adr-004-comunicación-entre-bounded-contexts)
    - [Estado](#estado-3)
    - [Contexto](#contexto-3)
    - [Decisión](#decisión-3)
    - [Consecuencias](#consecuencias-3)
    - [Trazabilidad](#trazabilidad-3)
  - [ADR-005: Persistencia - Base de Datos Relacional](#adr-005-persistencia---base-de-datos-relacional)
    - [Estado](#estado-4)
    - [Contexto](#contexto-4)
    - [Decisión](#decisión-4)
    - [Consecuencias](#consecuencias-4)
    - [Trazabilidad](#trazabilidad-4)
  - [ADR-006: Estrategia de Autenticación](#adr-006-estrategia-de-autenticación)
    - [Estado](#estado-5)
    - [Contexto](#contexto-5)
    - [Decisión](#decisión-5)
    - [Consecuencias](#consecuencias-5)
    - [Trazabilidad](#trazabilidad-5)
  - [ADR-007: Autorización RBAC con Permisos Granulares](#adr-007-autorización-rbac-con-permisos-granulares)
    - [Estado](#estado-6)
    - [Contexto](#contexto-6)
    - [Decisión](#decisión-6)
    - [Consecuencias](#consecuencias-6)
    - [Trazabilidad](#trazabilidad-6)
  - [ADR-008: Gestión de Domain Events](#adr-008-gestión-de-domain-events)
    - [Estado](#estado-7)
    - [Contexto](#contexto-7)
    - [Decisión](#decisión-7)
    - [Consecuencias](#consecuencias-7)
    - [Trazabilidad](#trazabilidad-7)
  - [ADR-009: Arquitectura de Capas por Módulo](#adr-009-arquitectura-de-capas-por-módulo)
    - [Estado](#estado-8)
    - [Contexto](#contexto-8)
    - [Decisión](#decisión-8)
    - [Consecuencias](#consecuencias-8)
    - [Trazabilidad](#trazabilidad-8)
  - [ADR-010: API REST como Interfaz Principal](#adr-010-api-rest-como-interfaz-principal)
    - [Estado](#estado-9)
    - [Contexto](#contexto-9)
    - [Decisión](#decisión-9)
    - [Consecuencias](#consecuencias-9)
    - [Trazabilidad](#trazabilidad-9)
  - [ADR-011: Almacenamiento de Ficheros](#adr-011-almacenamiento-de-ficheros)
    - [Estado](#estado-10)
    - [Contexto](#contexto-10)
    - [Decisión](#decisión-10)
    - [Consecuencias](#consecuencias-10)
    - [Trazabilidad](#trazabilidad-10)
  - [ADR-012: Estrategia de Testing](#adr-012-estrategia-de-testing)
    - [Estado](#estado-11)
    - [Contexto](#contexto-11)
    - [Decisión](#decisión-11)
    - [Consecuencias](#consecuencias-11)
    - [Trazabilidad](#trazabilidad-11)
  - [Trazabilidad General](#trazabilidad-general)
    - [Matriz ADR → RNF](#matriz-adr--rnf)
    - [Matriz ADR → BC](#matriz-adr--bc)
  - [Changelog](#changelog)

---

## Trazabilidad General

### Matriz ADR → RNF

| ADR     | RNFs Relacionados         |
| ------- | ------------------------- |
| ADR-001 | RNF-020, RNF-057          |
| ADR-002 | RNF-004, RNF-029, RNF-038 |
| ADR-003 | RNF-057                   |
| ADR-004 | RNF-042                   |
| ADR-005 | RNF-004, RNF-038, RNF-066 |
| ADR-006 | RNF-001, RNF-002, RNF-005 |
| ADR-007 | RNF-003, RNF-013          |
| ADR-008 | RNF-007, RNF-042          |
| ADR-009 | RNF-058-060               |
| ADR-010 | RNF-015-016, RNF-057      |
| ADR-011 | RNF-009, RNF-022          |
| ADR-012 | RNF-058, RNF-059, RNF-060 |

### Matriz ADR → BC

| ADR     | BCs Afectados                            |
| ------- | ---------------------------------------- |
| ADR-001 | Todos                                    |
| ADR-002 | BC-Identity (DB-Main), resto (DB-Tenant) |
| ADR-003 | Todos                                    |
| ADR-004 | Todos (productores y consumidores)       |
| ADR-005 | Todos                                    |
| ADR-006 | BC-Identity                              |
| ADR-007 | BC-Identity, todos (verificación)        |
| ADR-008 | Todos (emisión y recepción)              |
| ADR-009 | Todos                                    |
| ADR-010 | Todos (exposición API)                   |
| ADR-011 | BC-Documents                             |
| ADR-012 | Todos                                    |

---

## Navegación

Cada ADR se encuentra en `adr/adr-{xxx}.md`.
Ejemplo: `references/adr/adr-001.md` para ADR-001.
