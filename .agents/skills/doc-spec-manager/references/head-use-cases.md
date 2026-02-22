# Matriz de Trazabilidad: User Stories → Casos de Uso

**Proyecto:** Associated - ERP para Colectividades Españolas  
**Versión:** 2.6  
**Fecha:** Febrero 2026  
**Total:** 76 Casos de Uso derivados de 202 User Stories

---

## Índice de Navegación

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Notación y Convenciones](#1-notación-y-convenciones)
- [BC-Identity (UC-001 a UC-005)](#bc-identidad)
- [BC-Membership (UC-006 a UC-016)](#bc-membresia)
- [BC-Treasury (UC-017 a UC-027)](#bc-tesoreria)
- [BC-Events (UC-028 a UC-038)](#bc-eventos)
- [BC-Communication (UC-039 a UC-047)](#bc-comunicacion)
- [BC-Documents (UC-048 a UC-055)](#bc-documentos)
- [Transversal: Import/Export (UC-056 a UC-063)](#transversal-importexport)
- [Transversal: Reporting (UC-064 a UC-067)](#transversal-reporting)
- [Transversal: Portal Socio (UC-068 a UC-071)](#transversal-portal-socio)
- [Transversal: Cumplimiento (UC-072 a UC-076)](#transversal-cumplimiento)
- [Resumen Final](#resumen-final)
- [Notas de Trazabilidad](#notas-de-trazabilidad)

---

## Leyenda

| Columna | Descripción |
|---------|-------------|
| **UC** | Identificador del Caso de Uso (UC-001 a UC-076) |
| **Nombre UC** | Descripción corta del caso de uso |
| **User Stories** | IDs de las User Stories que agrupa (formato US-XXX) |
| **BC** | Bounded Context destino |
| **Application Service** | Nombre del servicio de aplicación principal |
| **Prioridad** | Must / Should / Could según criticidad |
| **Complejidad** | Alta / Media / Baja (estimación técnica) |

---

## Resumen Ejecutivo

Este documento define los **76 Casos de Uso** del sistema Associated, derivados de las **202 User Stories** documentadas en KB-009. Cada caso de uso describe:

- **Application Services** responsables de la ejecución
- **Flujos normales** (happy path)
- **Flujos alternativos** (variantes válidas)
- **Flujos de excepción** (manejo de errores)
- **Domain Events** emitidos durante la ejecución
- **Interacciones entre Bounded Contexts**

### Distribución por Bounded Context

| BC | Casos de Uso | User Stories Agrupadas | Tipo |
|----|--------------|------------------------|------|
| **BC-Identity** | 5 | 8 | Generic |
| **BC-Membership** | 10 | 34 | Core |
| **BC-Treasury** | 11 | 38 | Core |
| **BC-Events** | 11 | 29 | Core |
| **BC-Communication** | 9 | 23 | Supporting |
| **BC-Documents** | 8 | 12 | Supporting |
| **Transversal N8 (Import/Export)** | 8 | 13 | Cross-cutting |
| **Transversal N9 (Reporting)** | 4 | 12 | Cross-cutting |
| **Transversal N10 (Portal Socio)** | 4 | 15 | Cross-cutting |
| **Transversal N11 (Cumplimiento)** | 5 | 15 | Cross-cutting |
| **Total** | **76** | **202** | |

### Criterios de Agrupación Aplicados

Las User Stories se han agrupado en Casos de Uso siguiendo estos criterios:

1. **Cohesión funcional:** US que comparten el mismo objetivo de negocio
2. **Transaccionalidad:** Operaciones que deben completarse atómicamente
3. **Mismo Application Service:** US ejecutadas por el mismo servicio de aplicación
4. **Mismo Aggregate:** US que operan sobre la misma raíz de agregado

---

## Notación y Convenciones

### Nomenclatura

| Elemento | Formato | Ejemplo | Descripción |
|----------|---------|---------|-------------|
| **Caso de Uso** | UC-XXX | UC-001 | Identificador único secuencial |
| **Application Service** | `NameService` | `MemberService` | Clase de aplicación responsable |
| **Domain Event** | `EventName` | `MemberRegistered` | Evento de dominio emitido |
| **Aggregate** | **NombreAggregate** | **Member** | Aggregate Root involucrado |
| **Entity** | *NombreEntity* | *Charge* | Entidad dentro de un Aggregate |
| **Domain Service** | `NameDomainService` | `ProrataCalculator` | Servicio de dominio |

### Estructura de Caso de Uso

Cada caso de uso documenta:

```
### UC-XXX: Nombre del Caso de Uso

#### Metadatos
- **User Stories:** US-XXX, US-YYY, US-ZZZ
- **Bounded Context:** BC-Nombre | Transversal (BC-Primario + BC-Secundario)
- **Application Service:** `NameService.method()` | `ServiceA`, `ServiceB`
- **Aggregates:** 
  - **AggregateRoot1**, *Entity1* (si hay entities)
  - BC-Externo: **AggregateRoot2** (si es transversal)
- **Prioridad:** Must | Should | Could | Won't
**Descripción:**  
[Resumen conciso del objetivo del caso de uso en 1-3 líneas]

#### Actores
- **ActorPrincipal** (rol/responsabilidad)
- **ActorSecundario** (rol/responsabilidad)
- **Sistema** (acciones automáticas si aplica)

#### Precondiciones
- Condición 1
- Condición 2

#### Flujo Normal
1. Paso 1
2. Paso 2
3. ...

#### Flujos Alternativos
FA-1: [Variante válida]
FA-2: [Otra variante]

#### Flujos de Excepción
FE-1: [Condición de error y manejo]
FE-2: [Otra excepción]

#### Eventos de Dominio
- EventName1 → [Consumidores: BC-X, BC-Y]
- EventName2 → [Consumidores: BC-Z]

#### Interacciones entre BCs
- BC-Origen → BC-Destino: [Descripción]

#### Poscondiciones
- Estado resultante del sistema

#### Notas de Implementación
- Consideraciones técnicas relevantes
```

### Tipos de Flujo

| Tipo | Código | Propósito |
|------|--------|-----------|
| **Flujo Normal** | FN | Secuencia principal (happy path) |
| **Flujo Alternativo** | FA-X | Variante válida del flujo normal |
| **Flujo de Excepción** | FE-X | Manejo de errores y condiciones excepcionales |

### Capas de Arquitectura Referenciadas

```
┌─────────────────────────────────────────────────┐
│  Presentation Layer (Controllers, DTOs)         │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Application Layer (Application Services)       │ ← Casos de Uso
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Domain Layer (Aggregates, Entities, VOs,       │
│               Domain Services, Domain Events)   │
└────────────────┬────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────┐
│  Infrastructure Layer (Repositories, Adapters)  │
└─────────────────────────────────────────────────┘
```

Los **Application Services** orquestan la lógica de negocio contenida en el **Domain Layer** y coordinan las interacciones entre múltiples Aggregates cuando es necesario.

### Diagramas de Secuencia Simplificados

En casos de uso complejos se incluyen diagramas de secuencia UML simplificados para visualizar las interacciones:

```
Usuario → Controller → AppService → Aggregate → Repository
```

---

## Resumen Final

### Totales Generales

| Métrica | Valor |
|---------|-------|
| **Total Casos de Uso** | **76** |
| **Total User Stories cubiertas** | **202** (100% del scope N2-N11) |
| **UCs Must** | 37 (48.7%) |
| **UCs Should** | 33 (43.4%) |
| **UCs Could** | 6 (7.9%) |
| **UCs Won't** | 0 (0%) |

### Distribución por Bounded Context

| Bounded Context | UCs | User Stories | % del total UCs |
|-----------------|-----|--------------|-----------------|
| BC-Identity | 5 | 8 | 6.6% |
| BC-Membership | 10 | 34 | 13.2% |
| BC-Treasury | 11 | 40 | 14.5% |
| BC-Events | 11 | 36 | 14.5% |
| BC-Communication | 9 | 25 | 11.8% |
| BC-Documents | 8 | 29 | 10.5% |
| Transversal Import/Export | 8 | 15 | 10.5% |
| Transversal Reporting | 4 | 13 | 5.3% |
| Transversal Portal Socio | 4 | 12 | 5.3% |
| Transversal Cumplimiento | 5 | 15 | 6.6% |
| **TOTAL** | **76** | **202** | **100%** |

### Complejidad Técnica

| Complejidad | Cantidad | % del total |
|-------------|----------|-------------|
| **Alta** | 30 UCs | 39.5% |
| **Media** | 38 UCs | 50.0% |
| **Baja** | 8 UCs | 10.5% |

**UCs de Alta Complejidad (30):**
- UC-001, UC-002, UC-004, UC-012, UC-015, UC-017, UC-019, UC-023, UC-025, UC-026, UC-027
- UC-030, UC-032, UC-034, UC-038, UC-047, UC-048, UC-055
- UC-056, UC-057, UC-059, UC-060, UC-063, UC-064, UC-065, UC-066, UC-070, UC-071
- UC-072, UC-073

**Justificación de Alta Complejidad:**
- Integración con sistemas externos (pasarelas pago, AEAT, SEPA)
- Algoritmos complejos (cálculo quórum, generación XML ISO 20022)
- Seguridad crítica (cifrado QR, URLs firmadas, validaciones JWT)
- Procesamiento masivo (importación miles de registros, generación remesas)
- Workflows multi-step (alta de socio con aprobaciones, morosidad)
- Cumplimiento RGPD (derechos ARCO con exportación completa, auditoría inmutable)

---

## Notas de Trazabilidad

### User Stories sin UC dedicado

Todas las 202 User Stories del scope N2-N11 están cubiertas por los 76 UCs definidos. No hay User Stories huérfanas.

### Casos de Uso que consolidan múltiples US

Los siguientes UCs agrupan ≥7 User Stories (alta cohesión funcional):

- **UC-017:** 10 US (configuración planes de cuota)
- **UC-030:** 7 US (inscripciones online)
- **UC-047:** 7 US (comunicaciones automáticas)
- **UC-048:** 7 US (libro de actas digital)
- **UC-064:** 7 US (dashboard principal y KPIs)

### Criterios de Agrupación

Las User Stories se consolidaron en Casos de Uso siguiendo estos criterios:

1. **Cohesión funcional:** US que operan sobre el mismo Aggregate o Entity
2. **Flujo de trabajo único:** US que forman un workflow completo (ej: alta de socio)
3. **Application Service compartido:** US que serían implementadas en el mismo servicio
4. **Transaccionalidad:** Operaciones que deben ejecutarse atómicamente
5. **Actor común:** US invocadas por el mismo rol (ej: tesorero)

### Excepciones y Fusiones

- **UC-016 fusionado con UC-015:** La generación masiva de carnets comparte el 80% del código con generación individual. Se implementa como flag `batch: boolean` en `MemberCardService.generateCards()`.

---

## Navegación

Cada UC se encuentra en `uc/uc-{xxx}.md`.
Ejemplo: `references/uc/uc-001.md` para UC-001.
