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

## 1. BC-Identity: Acceso y Autorización

### 1.1 Gestión Multi-Tenant

#### US-001: Aislamiento de datos por entidad
**RF Origen:** N2RF01  
**Prioridad:** Must

> Como **administrador del sistema**,  
> quiero que cada colectividad tenga su base de datos completamente aislada,  
> para garantizar la privacidad y seguridad de los datos de cada entidad.

**Criterios de Aceptación:**
```gherkin
Scenario: Creación de nuevo tenant con BD aislada
  Given un administrador autenticado en el sistema
  When crea una nueva colectividad "Peña El Tambor"
  Then se provisiona una base de datos independiente para el tenant
  And se crea un usuario de conexión específico con permisos limitados a esa BD
  And el tenant recibe un identificador único (tenant_id)

Scenario: Imposibilidad de acceso cruzado entre tenants
  Given dos tenants "Peña A" y "Cofradía B" existentes
  And un usuario con rol Tesorero en "Peña A"
  When el usuario intenta acceder a datos de "Cofradía B"
  Then el sistema deniega el acceso con error 403
  And se registra el intento en el log de auditoría

Scenario: Queries nunca filtran por tenant_id en WHERE
  Given la arquitectura de BD separada por tenant
  When se ejecuta cualquier consulta de datos
  Then la conexión ya está vinculada a la BD del tenant
  And no existe cláusula WHERE tenant_id en las queries
```

---

#### US-002: Acceso unificado multi-entidad
**RF Origen:** N2RF02  
**Prioridad:** Must

> Como **usuario** que pertenece a varias colectividades,  
> quiero acceder a todas ellas desde un único punto de entrada con las mismas credenciales,  
> para no tener que recordar múltiples contraseñas.

**Criterios de Aceptación:**
```gherkin
Scenario: Login con acceso a múltiples tenants
  Given un usuario registrado con email "juan@example.com"
  And el usuario es socio de "Peña El Tambor" y "Cofradía del Cristo"
  When el usuario se autentica correctamente
  Then ve un selector con las colectividades a las que pertenece
  And puede elegir a cuál acceder
  And cada colectividad muestra su rol específico (ej: Tesorero, Socio)

Scenario: Cambio de contexto entre tenants sin re-login
  Given un usuario autenticado en "Peña El Tambor"
  When selecciona cambiar a "Cofradía del Cristo"
  Then el sistema cambia el contexto al nuevo tenant
  And se cargan los permisos del rol en ese tenant
  And no se requiere introducir credenciales de nuevo

Scenario: Roles independientes por tenant
  Given un usuario que es Tesorero en "Peña A" y Socio en "Cofradía B"
  When accede a "Peña A"
  Then tiene permisos de gestión económica
  When cambia a "Cofradía B"
  Then solo tiene acceso de lectura a sus propios datos
```

---

#### US-003: Configuración independiente por entidad
**RF Origen:** N2RF03  
**Prioridad:** Must

> Como **presidente** de una colectividad,  
> quiero personalizar la configuración de mi entidad (tipos de socio, cuotas, branding),  
> para adaptar el sistema a las particularidades de mi organización.

**Criterios de Aceptación:**
```gherkin
Scenario: Configuración de tipos de socio personalizados
  Given un presidente autenticado en su tenant
  When accede a Configuración > Tipos de Socio
  Then puede crear tipos específicos (ej: "Hermano de Luz", "Socio Infantil")
  And cada tipo puede vincularse con múltiples planes de cuota
  And cada tipo tiene permisos y reglas diferenciadas
  And los cambios solo afectan a su tenant

Scenario: Personalización de branding
  Given un presidente en la sección de configuración
  When sube el logo de su entidad y selecciona colores corporativos
  Then el portal del socio muestra el branding personalizado
  And los emails enviados incluyen el logo de la entidad
  And otras entidades no ven estos cambios

Scenario: Campos personalizados por entidad
  Given una cofradía que necesita registrar "Año de promesa"
  When el presidente crea un campo personalizado de tipo fecha
  Then el campo aparece en el formulario de alta de socio
  And los datos se almacenan asociados solo a ese tenant
```

---

### 1.2 Gestión de Roles y Permisos

#### US-004: Roles predefinidos del sistema
**RF Origen:** N2RF04  
**Prioridad:** Must

> Como **administrador de una colectividad**,  
> quiero disponer de roles predefinidos que reflejen la estructura típica de una junta directiva,  
> para asignar permisos de forma rápida y coherente.

**Criterios de Aceptación:**
```gherkin
Scenario: Roles predefinidos disponibles en cada tenant
  Given un nuevo tenant recién creado
  Then existen los roles predefinidos: Presidente, Secretario, Tesorero, Vocal, Socio
  And cada rol tiene permisos preconfigurados según su función
  And los roles predefinidos no pueden ser eliminados

Scenario: Permisos del rol Tesorero
  Given un usuario con rol Tesorero
  Then puede acceder a: gestión de cuotas, cobros, remesas SEPA, informes económicos
  And NO puede acceder a: modificar roles, eliminar socios, aprobar actas
  And puede ver datos de socios en modo lectura (para asociar pagos)

Scenario: Permisos del rol Socio (mínimo privilegio)
  Given un usuario con rol Socio
  Then solo puede ver sus propios datos personales
  And puede ver su historial de pagos
  And puede inscribirse a eventos públicos
  And NO puede ver datos de otros socios ni información económica global
```

---

#### US-005: Roles personalizados
**RF Origen:** N2RF05  
**Prioridad:** Should

> Como **presidente** de una colectividad,  
> quiero crear roles personalizados con permisos específicos,  
> para adaptar la estructura de accesos a las necesidades de mi organización.

**Criterios de Aceptación:**
```gherkin
Scenario: Creación de rol personalizado
  Given un presidente en Configuración > Roles
  When crea un nuevo rol "Encargado de Bar"
  And selecciona permisos: gestión de eventos, registro de ventas
  Then el rol queda disponible para asignar a usuarios
  And el rol es específico de ese tenant

Scenario: Modificación de permisos de rol personalizado
  Given un rol personalizado "Mayordomo" existente
  When el presidente añade el permiso "ver_listado_socios"
  Then los usuarios con ese rol obtienen el nuevo permiso
  And se registra el cambio en auditoría

Scenario: Imposibilidad de modificar roles de sistema
  Given los roles predefinidos (Presidente, Secretario, etc.)
  When un usuario intenta modificar sus permisos base
  Then el sistema impide la modificación
  And muestra mensaje indicando que son roles de sistema
```

---

### 1.3 Auditoría y Trazabilidad

#### US-006: Registro de auditoría de acciones críticas
**RF Origen:** N2RF06  
**Prioridad:** Must

> Como **presidente** de una colectividad,  
> quiero que todas las acciones críticas queden registradas con detalle,  
> para poder rendir cuentas en Asamblea y detectar posibles irregularidades.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de modificación de datos de socio
  Given un secretario que modifica el email de un socio
  When guarda el cambio
  Then se registra: usuario, timestamp, operación "UPDATE", entidad "Socio"
  And se almacena valor anterior y valor nuevo
  And se registra la IP de origen

Scenario: Registro de operación económica
  Given un tesorero que registra un pago manual
  When confirma la operación
  Then se registra en auditoría con todos los detalles del pago
  And el registro es inmutable (no puede editarse ni eliminarse)

Scenario: Consulta de log de auditoría
  Given un presidente que accede a Auditoría
  When filtra por fecha y tipo de operación
  Then ve el listado de acciones con todos los detalles
  And puede exportar el log en formato CSV/PDF
  And los registros muestran antigüedad de hasta 5 años
```

---

### 1.4 Gestión de Traspasos

#### US-007: Proceso de traspaso de cargos
**RF Origen:** N2RF07  
**Prioridad:** Should

> Como **presidente saliente**,  
> quiero un proceso guiado para traspasar mi cargo al nuevo presidente,  
> para garantizar la continuidad operativa y revocar mis accesos de forma ordenada.

**Criterios de Aceptación:**
```gherkin
Scenario: Inicio de proceso de traspaso
  Given un presidente que inicia el traspaso de cargo
  When selecciona al nuevo presidente de entre los socios elegibles
  Then se inicia un workflow de traspaso con checklist
  And el nuevo presidente recibe notificación para aceptar

Scenario: Aceptación y ejecución del traspaso
  Given un traspaso pendiente de aceptación
  When el nuevo presidente acepta el cargo
  Then se le asigna el rol de Presidente
  And el presidente saliente pasa a rol Socio (o rol configurado)
  And se revoca el acceso a funciones críticas del anterior
  And se registra el traspaso en auditoría con fecha efectiva

Scenario: Historial de cargos preservado
  Given un traspaso completado
  When se consulta el historial de la entidad
  Then aparece registro de quién ocupó cada cargo y en qué período
  And las acciones realizadas por el anterior cargo siguen vinculadas a su usuario
```

---

#### US-008: Validación de elegibilidad para cargos
**RF Origen:** N2RF08  
**Prioridad:** Should

> Como **sistema**,  
> quiero validar automáticamente que solo asociados mayores de edad puedan ocupar cargos directivos,  
> para cumplir con la Ley Orgánica 1/2002 de Asociaciones.

**Criterios de Aceptación:**
```gherkin
Scenario: Bloqueo de asignación de cargo a menor
  Given un socio con fecha de nacimiento que indica 17 años
  When se intenta asignarle el rol de Secretario
  Then el sistema bloquea la asignación
  And muestra mensaje: "Los cargos directivos requieren mayoría de edad (LO 1/2002)"

Scenario: Asignación válida a mayor de edad
  Given un socio mayor de 18 años
  And que está al corriente de pago (si es requisito configurado)
  When se le asigna un cargo directivo
  Then la asignación se completa correctamente
  And se registra en auditoría

Scenario: Alerta de cumplimiento de edad próximo
  Given un vocal que cumplirá 18 años en 2 meses
  And actualmente tiene 17 años
  When se revisa la composición de la junta
  Then el sistema alerta de la situación irregular
  And sugiere regularizar antes de la próxima Asamblea
```

---

### Resumen: BC-Identity

| US | RF | Título | Prioridad |
|----|-----|--------|-----------|
| US-001 | N2RF01 | Aislamiento de datos por entidad | Must |
| US-002 | N2RF02 | Acceso unificado multi-entidad | Must |
| US-003 | N2RF03 | Configuración independiente por entidad | Must |
| US-004 | N2RF04 | Roles predefinidos del sistema | Must |
| US-005 | N2RF05 | Roles personalizados | Should |
| US-006 | N2RF06 | Registro de auditoría | Must |
| US-007 | N2RF07 | Proceso de traspaso de cargos | Should |
| US-008 | N2RF08 | Validación elegibilidad cargos | Should |

**Total:** 8 User Stories (5 Must, 3 Should)

---

## 2. BC-Membership: Gestión de Socios

### 2.1 Ficha de Socio

#### US-009: Ficha centralizada de socio con datos básicos
**RF Origen:** N3RF01  
**Prioridad:** Must

> Como **secretario**,  
> quiero registrar y consultar todos los datos de un socio en una ficha única y centralizada,  
> para eliminar listas dispersas y tener una fuente de verdad única.

**Criterios de Aceptación:**
```gherkin
Scenario: Creación de ficha de socio con datos obligatorios
  Given un secretario autenticado en el sistema
  When crea un nuevo socio con datos básicos completos
    | campo              | valor                    |
    | nombre             | Juan García López        |
    | dni                | 12345678A                |
    | fechaNacimiento    | 1985-03-15               |
    | email              | juan@example.com         |
    | telefono           | 666123456                |
    | iban               | ES9121000418450200051332 |
  Then se crea la ficha del socio con número asignado automáticamente
  And el IBAN se almacena cifrado (RNF-006)
  And se emite evento SocioRegistrado

Scenario: Validación de DNI/NIE único por tenant
  Given un socio existente con DNI "12345678A"
  When se intenta crear otro socio con el mismo DNI
  Then el sistema rechaza la operación
  And muestra mensaje "Ya existe un socio con este documento de identidad"

Scenario: Consulta de ficha desde cualquier módulo
  Given un socio "Juan García" existente
  When el tesorero consulta un pago de ese socio
  Then puede acceder a la ficha completa del socio con un clic
  And ve todos los datos actualizados en tiempo real
```

---

#### US-010: Campos específicos para cofradías
**RF Origen:** N3RF02  
**Prioridad:** Should

> Como **secretario de una cofradía**,  
> quiero registrar información religiosa específica del hermano (bautismo, jura, padrinos),  
> para cumplir con los requisitos de los libros de hermanos.

**Criterios de Aceptación:**
```gherkin
Scenario: Activación de campos de cofradía
  Given una entidad configurada como tipo "Cofradía"
  When el secretario accede a la ficha de un hermano
  Then ve los campos específicos de cofradía:
    | campo                    | tipo       |
    | fechaBautismo            | fecha      |
    | parroquiaBautismo        | texto      |
    | padrinos                 | referencia |
    | fechaJuraReglas          | fecha      |
    | fechaImposicionMedalla   | fecha      |
    | tipoTunica               | selector   |
    | posicionHistoricaCortejo | número     |

Scenario: Registro de padrinos/avalistas
  Given un aspirante en proceso de alta
  When el secretario asigna dos padrinos existentes
  Then los padrinos quedan vinculados al nuevo hermano
  And los padrinos deben tener 2+ años de antigüedad
  And se puede consultar el árbol de apadrinamientos

Scenario: Campos de cofradía no visibles en otros tipos
  Given una entidad configurada como tipo "Peña"
  When el secretario accede a una ficha de socio
  Then NO ve los campos específicos de cofradía
```

---

#### US-011: Campos específicos para clubes deportivos
**RF Origen:** N3RF03  
**Prioridad:** Should

> Como **secretario de un club deportivo**,  
> quiero gestionar licencias federativas y certificados médicos con alertas de caducidad,  
> para asegurar que todos los deportistas cumplen requisitos federativos.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de licencia federativa
  Given un socio-deportista en un club
  When el secretario registra datos federativos:
    | campo                  | valor        |
    | categoriaDeportiva     | Senior       |
    | numeroLicencia         | FAT-2024-001 |
    | fechaExpedicion        | 2024-09-01   |
  Then los datos quedan asociados al socio
  And se puede generar listado de licencias para la federación

Scenario: Alerta de caducidad de certificado médico
  Given un deportista con certificado médico que caduca en 30 días
  When el sistema ejecuta el proceso diario de alertas
  Then se genera notificación al secretario
  And el socio aparece en el listado "Certificados por renovar"

Scenario: Control de certificado de delitos sexuales para técnicos
  Given un socio con rol "Técnico/Entrenador"
  When accede a su ficha
  Then es obligatorio el campo "Certificado delitos sexuales"
  And se muestra alerta si caduca en menos de 60 días
```

---

#### US-012: Campos específicos para peñas festeras
**RF Origen:** N3RF04  
**Prioridad:** Should

> Como **secretario de una peña**,  
> quiero registrar tallas, preferencias alimentarias y disponibilidad de los peñistas,  
> para organizar uniformes, comidas y turnos de voluntariado.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de datos para uniformes
  Given una peña que reparte camisetas
  When el secretario registra datos de un peñista:
    | campo           | valor      |
    | tallaCamiseta   | L          |
    | tallaPantalon   | 42         |
  Then se puede generar informe de tallas para pedido

Scenario: Registro de preferencias alimentarias
  Given una peña que organiza comidas colectivas
  When el peñista indica sus preferencias:
    | campo                 | valor              |
    | preferenciaAlimentaria| Vegetariano        |
    | alergias              | Gluten, Frutos secos|
  Then las comidas pueden filtrar por requisitos especiales
  And el cocinero ve el resumen de dietas especiales

Scenario: Disponibilidad para voluntariado
  Given una peña que necesita turnos de barra
  When el peñista indica disponibilidad
  Then aparece en el pool de voluntarios disponibles
  And puede marcarse si tiene vehículo para transporte
```

---

#### US-013: Campos específicos para asociaciones culturales
**RF Origen:** N3RF05  
**Prioridad:** Should

> Como **secretario de una asociación cultural**,  
> quiero conocer las habilidades e intereses de los socios,  
> para asignar responsabilidades y organizar actividades afines.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de áreas de interés
  Given una asociación cultural
  When el socio completa su perfil con:
    | campo              | valor                     |
    | areasInteres       | Teatro, Música, Fotografía|
    | habilidades        | Diseño gráfico, Idiomas   |
    | disponibilidad     | Tardes y fines de semana  |
    | profesion          | Arquitecto                |
    | idiomas            | Español, Inglés, Francés  |
  Then se puede buscar socios por habilidad o interés
  And facilita la asignación a comisiones de trabajo
```

---

### 2.2 Estados y Tipos de Socio

#### US-014: Gestión de estados del socio
**RF Origen:** N3RF06  
**Prioridad:** Must

> Como **secretario**,  
> quiero que cada socio tenga un estado claro y unificado con transiciones controladas,  
> para saber exactamente quién está activo, moroso o de baja.

**Criterios de Aceptación:**
```gherkin
Scenario: Estados disponibles en el sistema
  Given el catálogo de estados del sistema
  Then existen los siguientes estados:
    | estado           | derechos                        |
    | Activo           | Plenos (voto, eventos, etc.)    |
    | PendientePago    | Limitados (sin voto)            |
    | Suspendido       | Sin derechos                    |
    | BajaVoluntaria   | Ninguno (histórico)             |
    | BajaImpago       | Ninguno (histórico)             |
    | BajaDisciplinaria| Ninguno (histórico)             |
    | Aspirante        | Sin derechos (en proceso alta)  |
    | Fallecido        | Ninguno (histórico memorial)    |

Scenario: Transición de estado automática por morosidad
  Given un socio "Activo" con cuota impagada hace 90 días
  When el sistema ejecuta el proceso de morosidad
  Then el estado cambia a "PendientePago"
  And se registra en el historial con fecha y motivo
  And se emite evento EstadoSocioCambiado

Scenario: Transiciones controladas (no cualquier cambio es válido)
  Given un socio en estado "BajaVoluntaria"
  When se intenta cambiar directamente a "Activo"
  Then el sistema rechaza la transición
  And indica que debe usar el proceso de "Rehabilitación"
```

---

#### US-015: Tipos de socio para cofradías
**RF Origen:** N3RF07  
**Prioridad:** Should

> Como **secretario de una cofradía**,  
> quiero configurar categorías de hermanos con sus reglas específicas,  
> para gestionar automáticamente derechos de voto y elegibilidad según antigüedad.

**Criterios de Aceptación:**
```gherkin
Scenario: Configuración de tipos de hermano
  Given una cofradía configurando sus tipos de socio
  When el presidente define las categorías:
    | tipo           | voto | elegible | carencia |
    | Numerario      | Sí   | Sí       | 2 años   |
    | Honorario      | No   | No       | -        |
    | Aspirante      | No   | No       | 1 año    |
    | MenorEdad      | No   | No       | -        |
  Then los tipos quedan configurados para el tenant
  And las reglas se aplican automáticamente

# Nota: Para configurar cuotas, ver US-043 (Planes de Cuota) y US-044
# (vinculación con tipos de socio).

Scenario: Validación de antigüedad para voto
  Given un hermano numerario con 18 meses de antigüedad
  When se genera el censo para Cabildo General
  Then el hermano NO aparece con derecho a voto
  And se indica "Carencia: faltan 6 meses"

Scenario: Validación de elegibilidad para Hermano Mayor
  Given un hermano con 4 años de antigüedad
  When se presenta como candidato a Hermano Mayor
  Then el sistema rechaza la candidatura
  And indica "Se requieren 5+ años de antigüedad"
```

---

#### US-016: Tipos de socio para peñas
**RF Origen:** N3RF08  
**Prioridad:** Should

> Como **tesorero de una peña**,  
> quiero configurar categorías de socios diferenciadas por edad,  
> para gestionar automáticamente las transiciones entre categorías.

**Criterios de Aceptación:**
```gherkin
Scenario: Configuración de tipos de peñista
  Given una peña configurando sus categorías de socio
  When el tesorero define las categorías:
    | tipo       | edadMin | edadMax | derechoVoto | elegibleCargos |
    | Adulto     | 35      | -       | Sí          | Sí             |
    | Juvenil    | 18      | 34      | Sí          | No             |
    | Infantil   | 0       | 17      | No          | No             |
    | Honor      | -       | -       | Sí          | Sí             |
  Then el sistema valida las configuraciones
  And permite vincular planes de cuota a cada categoría (ver US-044)

# Nota: Para configurar los importes y modalidades de pago disponibles para cada
# tipo de socio, ver US-043 (Planes de Cuota) y US-044 (Vinculación tipo-plan).

Scenario: Transición automática juvenil a adulto
  Given un socio juvenil que cumple 35 años el 15 de marzo
  When se abre el ejercicio del año siguiente
  Then el socio pasa automáticamente a categoría "Adulto"
  And se emite evento TipoSocioCambiado
  And el tesorero puede revisar si debe ajustar su plan de cuota
  And se notifica al socio del cambio
```

---

#### US-017: Tipos de socio para clubes deportivos
**RF Origen:** N3RF09  
**Prioridad:** Should

> Como **secretario de un club deportivo**,  
> quiero distinguir entre socios y deportistas federados,  
> para gestionar correctamente licencias y seguros.

**Criterios de Aceptación:**
```gherkin
Scenario: Diferenciación socio vs deportista
  Given un club deportivo configurando categorías
  When define los tipos:
    | tipo             | requiereLicencia | requiereSeguro | votaAsamblea |
    | SocioClub        | No               | No             | Sí           |
    | DeportistaFed    | Sí               | Sí             | No           |
    | SocioDeportista  | Sí               | Sí             | Sí           |
    | Familiar         | No               | No             | No           |
  Then cada alta valida los requisitos del tipo

Scenario: Alta de deportista federado
  Given un nuevo deportista
  When se registra como "DeportistaFederado"
  Then es obligatorio indicar número de licencia
  And es obligatorio adjuntar certificado médico vigente
  And es obligatorio fecha de certificado de delitos (si es técnico)
```

---

#### US-018: Tipos de socio para asociaciones culturales
**RF Origen:** N3RF10  
**Prioridad:** Should

> Como **secretario de una asociación cultural**,  
> quiero configurar categorías tradicionales de socios,  
> para gestionar derechos y aportaciones diferenciadas.

**Criterios de Aceptación:**
```gherkin
Scenario: Configuración de tipos de asociado
  Given una asociación cultural
  When configura sus categorías:
    | tipo       | derechos                      |
    | Ordinario  | Voto, actividades             |
    | Fundador   | Voto, actividades, distintivo |
    | Honorario  | Actividades (sin voto)        |
    | Protector  | Voto, actividades, mecenazgo  |
  Then las categorías se aplican según configuración

# Nota: Para configurar cuotas, ver US-043 y US-044.
```

---

#### US-019: Motor de reglas por tipo de socio
**RF Origen:** N3RF11  
**Prioridad:** Must

> Como **presidente**,  
> quiero definir reglas configurables por cada tipo de socio,  
> para automatizar el cálculo de derechos y transiciones.

**Criterios de Aceptación:**
```gherkin
Scenario: Configuración completa de reglas por tipo
  Given un tipo de socio "Juvenil"
  When el presidente configura las reglas:
    | regla                | valor                          |
    | edadMinima           | 14                             |
    | edadMaxima           | 34                             |
    | derechoVoto          | Sí (si antigüedad >= 1 año)    |
    | elegibleCargo        | No                             |
    | carenciaDerechos     | 12 meses                       |
    | transicionAutomatica | Adulto (al cumplir 35 años)    |
  Then las reglas se evalúan automáticamente
  And los cambios de categoría se ejecutan en apertura de ejercicio

# Nota: Para configurar planes de cuota disponibles para este tipo, ver US-044.
# Los descuentos se aplican a nivel individual en la suscripción (US-049).

Scenario: Evaluación de derecho a voto condicional
  Given un socio juvenil con 8 meses de antigüedad
  And la regla de carencia es 12 meses
  When se consulta si tiene derecho a voto
  Then el sistema indica "No (carencia: faltan 4 meses)"
```

---

### 2.3 Historial y Antigüedad

#### US-020: Timeline histórico del socio
**RF Origen:** N3RF12  
**Prioridad:** Must

> Como **secretario**,  
> quiero ver un registro cronológico de todos los eventos relevantes de un socio,  
> para tener contexto completo aunque cambie la junta directiva.

**Criterios de Aceptación:**
```gherkin
Scenario: Visualización de timeline
  Given un socio con varios años de historia
  When el secretario accede a su timeline
  Then ve ordenados cronológicamente:
    | fecha      | evento                              |
    | 2020-01-15 | Alta como socio juvenil             |
    | 2020-02-01 | Pago cuota inscripción: 50€         |
    | 2021-01-01 | Pago cuota 2021: 105€               |
    | 2021-06-15 | Inscripción evento "Romería"        |
    | 2022-03-01 | Cambio categoría: Juvenil → Adulto  |
    | 2023-01-01 | Nombrado Vocal de Festejos          |
    | 2024-01-15 | Baja voluntaria                     |

Scenario: Timeline inmutable
  Given eventos registrados en el timeline
  When un usuario intenta modificar un evento pasado
  Then el sistema no permite la modificación
  And solo permite añadir notas/aclaraciones posteriores
```

---

#### US-021: Cálculo automático de antigüedad
**RF Origen:** N3RF13  
**Prioridad:** Must

> Como **secretario**,  
> quiero que el sistema calcule automáticamente la antigüedad de cada socio,  
> para determinar derechos de voto y elegibilidad sin errores manuales.

**Criterios de Aceptación:**
```gherkin
Scenario: Cálculo básico de antigüedad
  Given un socio con fecha de alta 15/03/2020
  And fecha actual 15/03/2025
  When se consulta su antigüedad
  Then el sistema muestra "5 años, 0 meses, 0 días"

Scenario: Antigüedad con periodos de baja (configuración acumulativa)
  Given una entidad configurada para "acumular antigüedad tras bajas"
  And un socio que fue baja del 2022-01-01 al 2023-06-30
  When se calcula su antigüedad
  Then se descuenta el periodo de baja (18 meses)
  And la antigüedad efectiva refleja solo periodos activos

Scenario: Alerta al alcanzar umbral significativo
  Given un hermano que alcanza 2 años de antigüedad
  And la regla de voto requiere 2+ años
  When el sistema detecta el cumplimiento
  Then notifica al secretario: "Juan García ya tiene derecho a voto"
  And el socio aparece en el próximo censo electoral
```

---

#### US-022: Estadísticas de socios
**RF Origen:** N3RF14  
**Prioridad:** Should

> Como **presidente**,  
> quiero ver indicadores sobre la evolución de la masa social,  
> para detectar tendencias y tomar decisiones informadas.

**Criterios de Aceptación:**
```gherkin
Scenario: Dashboard de estadísticas de socios
  Given el presidente accede al módulo de estadísticas
  Then ve los indicadores:
    | indicador            | valor ejemplo        |
    | Total socios activos | 342                  |
    | Tasa retención       | 94.2%                |
    | Altas este año       | 28                   |
    | Bajas este año       | 12                   |
    | Socios morosos       | 15 (4.4%)            |

Scenario: Distribución por tipo de socio
  Given los socios de una peña
  When se consulta la distribución
  Then ve gráfico con:
    | tipo     | cantidad | porcentaje |
    | Adulto   | 180      | 52.6%      |
    | Juvenil  | 95       | 27.8%      |
    | Infantil | 67       | 19.6%      |

Scenario: Pirámide de edades
  Given la masa social de la entidad
  When se genera la pirámide de edades
  Then se visualiza la distribución por rangos etarios
  And se detectan posibles problemas de relevo generacional
```

---

### 2.4 Gestión de Ejercicios

#### US-023: Concepto de ejercicio/temporada
**RF Origen:** N3RF15  
**Prioridad:** Must

> Como **tesorero**,  
> quiero gestionar la información agrupada por ejercicios,  
> para tener claridad sobre qué pertenece a cada periodo.

**Criterios de Aceptación:**
```gherkin
Scenario: Estructura de ejercicio
  Given un ejercicio "2025"
  Then contiene:
    | elemento              | descripción                    |
    | fechaInicio           | 01/01/2025                     |
    | fechaFin              | 31/12/2025                     |
    | estado                | Abierto / Cerrado              |
    | sociosEjercicio       | Snapshot de socios activos     |
    | cuotasGeneradas       | Cuotas del periodo             |
    | eventosEjercicio      | Actividades del periodo        |
    | documentacionEjercicio| Actas, memorias, etc.          |

Scenario: Consulta histórica por ejercicio
  Given ejercicios 2023, 2024, 2025 existentes
  When el tesorero consulta datos del ejercicio 2023
  Then ve el estado de socios TAL COMO ESTABA en 2023
  And no se mezcla con datos de otros ejercicios
```

---

#### US-024: Apertura de nuevo ejercicio
**RF Origen:** N3RF16  
**Prioridad:** Must

> Como **tesorero**,  
> quiero que la apertura de ejercicio arrastre socios activos al nuevo periodo,  
> para no tener que hacerlo manualmente cada año.

**Criterios de Aceptación:**
```gherkin
Scenario: Apertura de ejercicio con arrastre de socios
  Given el ejercicio 2024 con 340 socios activos
  And 12 socios en estado "Baja"
  When el tesorero abre el ejercicio 2025
  Then se arrastran los 340 socios activos al nuevo ejercicio
  And los socios dados de baja NO se arrastran
  And se emite evento EjercicioAbierto

Scenario: Transiciones automáticas de categoría
  Given socios juveniles que cumplen 35 años en 2025
  When se abre el ejercicio 2025
  Then esos socios pasan a categoría "Adulto"
  And se emite evento TipoSocioCambiado
  And el tesorero puede revisar si debe ajustar su plan de cuota
  And se registra el cambio en el timeline

# Nota: Los cargos se generan mensualmente mediante el proceso automatizado N4RF02,
# NO en la apertura de ejercicio. Ver US-047 (Generación masiva mensual de cargos).
```

---

#### US-025: Cierre de ejercicio
**RF Origen:** N3RF17  
**Prioridad:** Should

> Como **presidente**,  
> quiero cerrar el ejercicio con generación automática de memoria/informe,  
> para preparar la documentación de Asamblea sin recopilar datos manualmente.

**Criterios de Aceptación:**
```gherkin
Scenario: Cierre de ejercicio con validaciones
  Given el ejercicio 2024 abierto
  When el presidente inicia el cierre
  Then el sistema valida:
    | validación                    | estado |
    | Todas las cuotas conciliadas  | ✓      |
    | Remesas bancarias cerradas    | ✓      |
    | Actas de reuniones completas  | ✓      |
  And si hay pendientes, avisa antes de cerrar

Scenario: Generación de memoria de ejercicio
  Given el cierre del ejercicio 2024
  When se confirma el cierre
  Then se genera automáticamente documento con:
    | sección                  | contenido                    |
    | Resumen socios           | Altas, bajas, total          |
    | Resumen económico        | Ingresos, gastos, saldo      |
    | Actividades realizadas   | Eventos y participación      |
    | Composición junta        | Cargos y cambios             |
  And el ejercicio queda en estado "Cerrado"
  And no se permiten modificaciones posteriores
```

---

#### US-026: Comparativas entre ejercicios
**RF Origen:** N3RF18  
**Prioridad:** Could

> Como **presidente**,  
> quiero comparar indicadores entre ejercicios,  
> para detectar tendencias y evaluar la evolución de la entidad.

**Criterios de Aceptación:**
```gherkin
Scenario: Comparativa de socios entre ejercicios
  Given ejercicios 2023, 2024, 2025 cerrados
  When se genera comparativa
  Then se muestra:
    | indicador      | 2023 | 2024 | 2025 | tendencia |
    | Socios activos | 320  | 335  | 342  | ↑ +3.2%   |
    | Altas          | 25   | 30   | 28   | ↓ -6.7%   |
    | Bajas          | 18   | 15   | 21   | ↑ +40%    |
    | Tasa retención | 94%  | 95%  | 94%  | → estable |
```

---

#### US-027: Flexibilidad de fechas de ejercicio
**RF Origen:** N3RF19  
**Prioridad:** Should

> Como **presidente**,  
> quiero configurar el periodo del ejercicio según las necesidades de mi entidad,  
> para alinear el sistema con nuestra operativa real.

**Criterios de Aceptación:**
```gherkin
Scenario: Configuración de tipo de ejercicio
  Given una entidad configurando su ejercicio
  When el presidente selecciona el tipo:
    | tipo              | inicio  | fin      | ejemplo              |
    | Año natural       | 01/01   | 31/12    | Asociaciones         |
    | Temporada         | 01/09   | 31/08    | Clubes deportivos    |
    | Cofrade           | Variable| Variable | Después Semana Santa |
    | Personalizado     | Libre   | Libre    | Según estatutos      |
  Then el sistema ajusta las fechas del ejercicio
  And las cuotas y memorias se alinean con el periodo
```

---

### 2.5 Procesos de Alta

#### US-028: Proceso de alta simple
**RF Origen:** N3RF20  
**Prioridad:** Must

> Como **secretario**,  
> quiero un proceso de alta simplificado para peñas y asociaciones,  
> para registrar nuevos socios de forma rápida y ordenada.

**Criterios de Aceptación:**
```gherkin
Scenario: Alta simple en 3 pasos
  Given un aspirante que quiere hacerse socio
  When el secretario inicia el proceso de alta simple
  Then sigue los pasos:
    | paso | acción                                           |
    | 1    | Registro de datos personales                     |
    | 2    | Selección de tipo de socio                       |
    | 3    | Creación de suscripción de inscripción y cargos  |
  And al completar, el socio queda en estado "Activo"
  And se emite evento SocioRegistrado

# Nota Paso 3: Se crea SuscripcionCuota con planCuotaId="Inscripción" (tipo UNICA),
# se genera el Cargo asociado, y la suscripción se cierra automáticamente 
# (motivoBaja=FIN_CUOTA_UNICA).

Scenario: Alta con pago inmediato
  Given el proceso de alta completado
  When el aspirante paga la cuota de inscripción
  Then se confirma el alta efectiva
  And se genera el carnet del nuevo socio
  And se envía email de bienvenida
```

---

#### US-029: Proceso de alta complejo para cofradías
**RF Origen:** N3RF21  
**Prioridad:** Should

> Como **secretario de una cofradía**,  
> quiero un proceso de alta por fases con avales, formación y jura,  
> para cumplir con el proceso tradicional de ingreso de hermanos.

**Criterios de Aceptación:**
```gherkin
Scenario: Proceso de alta por fases
  Given un aspirante a hermano
  When se inicia su proceso de alta
  Then debe completar las fases:
    | fase | descripción                            | responsable  |
    | 1    | Solicitud escrita al Hermano Mayor     | Aspirante    |
    | 2    | Aval de 2 hermanos (2+ años)           | Padrinos     |
    | 3    | Entrega documentación (bautismo)       | Aspirante    |
    | 4    | Pago cuota inscripción (ver nota)      | Aspirante    |
    | 5    | Periodo formación (1 año)              | Cofradía     |
    | 6    | Jura de reglas                         | Junta        |
    | 7    | Imposición medalla                     | Hermano Mayor|
  And cada fase tiene fecha límite configurable

# Nota Fase 4: Se crea SuscripcionCuota con PlanCuota tipo UNICA, se genera el
# Cargo asociado, y al pagarse la suscripción se cierra automáticamente.

Scenario: Seguimiento de proceso estancado
  Given un aspirante en fase 3 hace más de 60 días
  When el sistema ejecuta alertas
  Then notifica al secretario: "Aspirante Juan pendiente de documentación"
  And el aspirante aparece en "Procesos estancados"
```

---

#### US-030: Gestión de flujo de estados en alta
**RF Origen:** N3RF22  
**Prioridad:** Should

> Como **secretario**,  
> quiero visibilidad sobre el estado de cada solicitud de alta,  
> para saber exactamente en qué punto está cada aspirante.

**Criterios de Aceptación:**
```gherkin
Scenario: Estados del proceso de alta
  Given el workflow de alta configurado
  Then existen los estados:
    | estado                  | siguiente posible              |
    | SolicitudRecibida       | PendienteDocumentacion         |
    | PendienteDocumentacion  | DocumentacionCompleta          |
    | DocumentacionCompleta   | PendientePago                  |
    | PendientePago           | PagoConfirmado                 |
    | PagoConfirmado          | EnFormacion (si aplica)        |
    | EnFormacion             | PendienteAprobacion            |
    | PendienteAprobacion     | AltaEfectiva                   |

Scenario: Dashboard de solicitudes en curso
  Given múltiples solicitudes de alta activas
  When el secretario accede al panel de altas
  Then ve resumen:
    | estado                 | cantidad |
    | Pendiente documentación| 3        |
    | Pendiente pago         | 5        |
    | En formación           | 2        |
    | Pendiente aprobación   | 1        |
```

---

#### US-031: Gestión de documentos pendientes
**RF Origen:** N3RF23  
**Prioridad:** Should

> Como **secretario**,  
> quiero controlar qué documentos faltan por entregar a cada aspirante,  
> para no perder el seguimiento de la documentación.

**Criterios de Aceptación:**
```gherkin
Scenario: Checklist de documentación
  Given un aspirante en proceso de alta de cofradía
  When el secretario revisa su documentación
  Then ve el checklist:
    | documento               | estado     | fecha límite |
    | Partida de bautismo     | ✓ Entregado| -            |
    | Fotocopia DNI           | ✓ Entregado| -            |
    | Fotografía carnet       | ✗ Pendiente| 15/03/2025   |
    | Mandato SEPA firmado    | ✗ Pendiente| 15/03/2025   |

Scenario: Alerta de documento próximo a vencer plazo
  Given un documento con fecha límite en 7 días
  When el sistema ejecuta alertas diarias
  Then notifica al secretario y al aspirante
  And el documento aparece destacado en rojo
```

---

### 2.6 Procesos de Baja

#### US-032: Proceso de baja voluntaria
**RF Origen:** N3RF24  
**Prioridad:** Must

> Como **secretario**,  
> quiero gestionar las bajas voluntarias conforme a estatutos,  
> para que quede constancia formal y se liquiden las cuotas correctamente.

**Criterios de Aceptación:**
```gherkin
Scenario: Solicitud de baja voluntaria
  Given un socio activo que solicita baja
  When el secretario registra la solicitud
  Then se registra fecha de solicitud
  And se calcula fecha efectiva según estatutos (típico: fin ejercicio)
  And se cierra(n) su(s) suscripción(es) con motivoBaja=BAJA_SOCIO
  And los cargos ya generados hasta la fecha se mantienen como pendientes
  And NO se generarán nuevos cargos en procesos mensuales futuros
  And el socio recibe confirmación con fecha de baja

Scenario: Baja inmediata vs fin de ejercicio
  Given estatutos que permiten configurar:
    | opción              | efecto                              |
    | Inmediata           | Baja al registrar (sin cuotas pend) |
    | Fin ejercicio       | Baja al cerrar ejercicio            |
    | Fin mes siguiente   | Baja tras 30 días de preaviso       |
  When se configura "Fin ejercicio"
  Then las bajas solicitadas son efectivas el 31/12

Scenario: Registro en historial
  Given una baja voluntaria procesada
  Then el timeline del socio muestra:
    | fecha      | evento                                |
    | 2025-03-15 | Solicitud de baja voluntaria          |
    | 2025-12-31 | Baja efectiva - motivo: voluntaria    |
```

---

#### US-033: Proceso de baja por impago
**RF Origen:** N3RF25  
**Prioridad:** Must

> Como **tesorero**,  
> quiero un proceso automatizado de baja por impago conforme a estatutos,  
> para cumplir con los requisitos legales de proporcionalidad y notificación.

**Criterios de Aceptación:**
```gherkin
Scenario: Workflow de baja por impago
  Given los estatutos configurados para baja tras 2 años de impago
  Then el proceso sigue las fases:
    | fase | trigger                | acción                           |
    | 1    | 90 días impago         | Primera notificación amistosa    |
    | 2    | 180 días impago        | Segunda notificación formal      |
    | 3    | 365 días impago        | Aviso de expediente              |
    | 4    | 730 días impago        | Generación certificado descubierto|
    | 5    | +30 días sin regularizar| Baja efectiva                    |

Scenario: Generación de certificado de descubierto
  Given un socio con 2+ años de impago
  When se genera el certificado
  Then incluye:
    | elemento              | contenido                             |
    | Datos socio           | Nombre, número, DNI                   |
    | Deuda detallada       | Cargos pendientes, importes, fechas   |
    | Notificaciones enviadas| Fechas de cada aviso                 |
    | Firma tesorero        | Con VºBº del presidente               |
  And el certificado queda archivado como prueba

Scenario: Oportunidad de regularización
  Given un socio notificado de baja inminente
  When paga toda la deuda antes del plazo
  Then se cancela el proceso de baja
  And el socio vuelve a estado "Activo"
  And se registra en el historial
```

---

#### US-034: Proceso de baja disciplinaria
**RF Origen:** N3RF26  
**Prioridad:** Should

> Como **presidente**,  
> quiero gestionar expedientes disciplinarios con todas las garantías,  
> para que las expulsiones no sean impugnables judicialmente.

**Criterios de Aceptación:**
```gherkin
Scenario: Fases del expediente disciplinario
  Given un socio con conducta sancionable
  When se abre expediente disciplinario
  Then sigue las fases:
    | fase | acción                               | plazo   |
    | 1    | Apertura de expediente               | -       |
    | 2    | Notificación al interesado           | 10 días |
    | 3    | Plazo de alegaciones                 | 15 días |
    | 4    | Resolución de Junta Directiva        | 30 días |
    | 5    | Notificación de resolución           | 10 días |
    | 6    | Recurso a Asamblea (si procede)      | 30 días |
  And todo queda documentado con fechas

Scenario: Trazabilidad completa del expediente
  Given un expediente resuelto con expulsión
  Then se conserva:
    | documento                    | firmado por          |
    | Denuncia/informe inicial     | Denunciante          |
    | Apertura expediente          | Presidente           |
    | Notificación al interesado   | Acuse de recibo      |
    | Alegaciones (si las hay)     | Interesado           |
    | Acta resolución Junta        | Secretario           |
    | Notificación resolución      | Acuse de recibo      |
```

---

#### US-035: Rehabilitación de socios
**RF Origen:** N3RF27  
**Prioridad:** Should

> Como **secretario**,  
> quiero un proceso claro para readmitir socios dados de baja,  
> para gestionar las readmisiones de forma consistente.

**Criterios de Aceptación:**
```gherkin
Scenario: Rehabilitación con pago de deuda
  Given un socio dado de baja por impago con deuda de 300€
  And los estatutos exigen pago de deuda + 50€ de penalización
  When el ex-socio solicita rehabilitación
  Then se calcula:
    | concepto          | importe |
    | Deuda pendiente   | 300€    |
    | Penalización      | 50€     |
    | Nueva inscripción | 0€      |
    | Total a pagar     | 350€    |
  And al pagar, se reactiva como socio activo

Scenario: Rehabilitación con mantenimiento de antigüedad
  Given configuración que mantiene antigüedad histórica
  When un socio de baja voluntaria se rehabilita
  Then se recupera su antigüedad anterior
  And el timeline muestra el periodo de baja
```

---

### 2.7 Lista de Espera

#### US-036: Gestión de lista de espera
**RF Origen:** N3RF28  
**Prioridad:** Should

> Como **secretario**,  
> quiero gestionar una lista de espera cuando hay límite de socios,  
> para mantener el orden de llegada y prioridades configuradas.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro en lista de espera
  Given una peña con límite de 440 socios
  And actualmente tiene 440 socios activos
  When un aspirante solicita hacerse socio
  Then se registra en lista de espera con:
    | campo           | valor            |
    | fechaSolicitud  | 2025-02-04       |
    | posicion        | 12               |
    | prioridad       | Normal           |
    | estado          | EnEspera         |

Scenario: Prioridades configurables
  Given la configuración de prioridades:
    | prioridad       | orden |
    | Hijo de socio   | 1     |
    | Recomendado     | 2     |
    | Cronológico     | 3     |
  When hay varios aspirantes en espera
  Then se ordenan primero por prioridad, luego por fecha

Scenario: Consulta de posición
  Given un aspirante en posición 12
  When consulta su estado
  Then ve: "Posición actual: 12 de 23 en espera"
```

---

#### US-037: Notificación automática de vacantes
**RF Origen:** N3RF29  
**Prioridad:** Should

> Como **sistema**,  
> quiero notificar automáticamente al siguiente en lista cuando hay vacante,  
> para agilizar la cobertura de plazas disponibles.

**Criterios de Aceptación:**
```gherkin
Scenario: Notificación por vacante
  Given una vacante por baja de socio
  And lista de espera con aspirantes
  When se procesa la baja
  Then se notifica al primer aspirante en lista:
    | contenido                                      |
    | "Hay una plaza disponible en Peña El Tambor"   |
    | "Tiene 15 días para confirmar aceptación"      |
    | "Enlace para completar el alta"                |

Scenario: Plazo de aceptación vencido
  Given un aspirante notificado hace 16 días
  And no ha respondido
  When el sistema verifica plazos
  Then marca al aspirante como "Plazo vencido"
  And notifica al siguiente en la lista
  And el anterior pasa al final de la cola (configurable)
```

---

### 2.8 Carnets y Acreditaciones

#### US-038: Carnet digital con QR
**RF Origen:** N3RF30  
**Prioridad:** Must

> Como **socio**,  
> quiero tener un carnet digital con QR en mi móvil,  
> para acreditarme sin llevar carnet físico.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de carnet digital
  Given un socio activo al corriente de pago
  When accede al portal del socio
  Then puede ver y descargar su carnet digital con:
    | elemento          | contenido                     |
    | QR                | Código único ejercicio 2025   |
    | Foto              | Foto del socio                |
    | Nombre            | Juan García López             |
    | Número socio      | 00142                         |
    | Ejercicio         | 2025                          |
    | Estado            | Al corriente ✓                |
    | Logo entidad      | Logo personalizado            |

Scenario: QR único por ejercicio
  Given un socio con carnet del ejercicio 2024
  When se abre el ejercicio 2025
  Then se genera nuevo QR para 2025
  And el QR de 2024 deja de ser válido

Scenario: Carnet instalable como PWA
  Given un socio accediendo desde móvil
  When instala la PWA
  Then puede acceder al carnet sin conexión
  And recibe notificaciones push (si consiente)
```

---

#### US-039: Validación de carnet por escaneo
**RF Origen:** N3RF31  
**Prioridad:** Must

> Como **vocal de eventos**,  
> quiero escanear el QR del carnet para validar socios,  
> para controlar accesos en eventos de forma rápida.

**Criterios de Aceptación:**
```gherkin
Scenario: Escaneo de carnet válido
  Given un socio al corriente de pago
  When se escanea su QR en la entrada de un evento
  Then se muestra:
    | campo           | valor              | indicador |
    | Nombre          | Juan García López  |           |
    | Número          | 00142              |           |
    | Tipo            | Adulto             |           |
    | Estado pago     | Al corriente       | ✓ Verde   |
    | Foto            | [Miniatura]        |           |

Scenario: Escaneo de socio moroso
  Given un socio con cargos pendientes de pago
  When se escanea su QR
  Then se muestra estado "Pendiente de pago" con indicador rojo
  And el controlador decide si permite acceso

Scenario: Escaneo de QR inválido o caducado
  Given un QR del ejercicio anterior
  When se escanea
  Then muestra "Carnet no válido para ejercicio actual"
```

---

#### US-040: Carnet físico imprimible
**RF Origen:** N3RF32  
**Prioridad:** Should

> Como **secretario**,  
> quiero generar carnets físicos imprimibles personalizados,  
> para entregar a socios que prefieran carnet en papel.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de PDF de carnet individual
  Given un socio activo
  When el secretario genera su carnet físico
  Then se descarga PDF con diseño de carnet tamaño tarjeta
  And incluye logo y colores corporativos de la entidad
  And es imprimible en impresora doméstica

Scenario: Generación masiva de carnets
  Given 340 socios activos
  When el secretario solicita impresión masiva
  Then se genera PDF con todos los carnets
  And formato optimizado para imprenta (múltiples por hoja)
```

---

#### US-041: Papeleta de sitio para cofradías
**RF Origen:** N3RF33  
**Prioridad:** Should

> Como **secretario de cofradía**,  
> quiero generar papeletas de sitio vinculadas a la antigüedad,  
> para acreditar la posición de cada hermano en el cortejo procesional.

**Criterios de Aceptación:**
```gherkin
Scenario: Contenido de papeleta de sitio
  Given un hermano numerario al corriente de pago
  When se genera su papeleta
  Then incluye:
    | campo                | valor                       |
    | Nombre hermano       | Juan García López           |
    | Número antigüedad    | 142                         |
    | Posición cortejo     | Fila 24, posición 3         |
    | Paso/sección         | Paso del Cristo             |
    | Ejercicio            | Semana Santa 2025           |
    | QR validación        | Código único                |

Scenario: Papeleta solo para hermanos al corriente
  Given un hermano con cuotas pendientes
  When se intenta generar su papeleta
  Then el sistema bloquea la generación
  And muestra: "Debe estar al corriente de pago"
```

---

#### US-042: Generación masiva de papeletas
**RF Origen:** N3RF34  
**Prioridad:** Should

> Como **secretario de cofradía**,  
> quiero generar todas las papeletas ordenadas por antigüedad,  
> para automatizar el reparto previo a Semana Santa.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación masiva por antigüedad
  Given 200 hermanos al corriente de pago
  When se ejecuta la generación masiva
  Then se crean 200 papeletas ordenadas por antigüedad estricta
  And se asignan posiciones automáticamente según configuración
  And se genera PDF para impresión

Scenario: Exclusión automática de no elegibles
  Given hermanos con diferentes estados
  When se genera el listado para papeletas
  Then solo se incluyen:
    | criterio                          |
    | Estado = Activo                   |
    | Al corriente de pago              |
    | Tipo = Numerario (con derecho)    |
  And los aspirantes y honorarios se excluyen
```

---

### Resumen: BC-Membership

| US | RF | Título | Prioridad |
|----|-----|--------|-----------|
| US-009 | N3RF01 | Ficha centralizada de socio | Must |
| US-010 | N3RF02 | Campos específicos cofradías | Should |
| US-011 | N3RF03 | Campos específicos clubes | Should |
| US-012 | N3RF04 | Campos específicos peñas | Should |
| US-013 | N3RF05 | Campos específicos asoc. culturales | Should |
| US-014 | N3RF06 | Gestión de estados del socio | Must |
| US-015 | N3RF07 | Tipos de socio cofradías | Should |
| US-016 | N3RF08 | Tipos de socio peñas | Should |
| US-017 | N3RF09 | Tipos de socio clubes | Should |
| US-018 | N3RF10 | Tipos de socio asoc. culturales | Should |
| US-019 | N3RF11 | Motor de reglas por tipo | Must |
| US-020 | N3RF12 | Timeline histórico del socio | Must |
| US-021 | N3RF13 | Cálculo automático antigüedad | Must |
| US-022 | N3RF14 | Estadísticas de socios | Should |
| US-023 | N3RF15 | Concepto de ejercicio/temporada | Must |
| US-024 | N3RF16 | Apertura de nuevo ejercicio | Must |
| US-025 | N3RF17 | Cierre de ejercicio | Should |
| US-026 | N3RF18 | Comparativas entre ejercicios | Could |
| US-027 | N3RF19 | Flexibilidad fechas ejercicio | Should |
| US-028 | N3RF20 | Proceso de alta simple | Must |
| US-029 | N3RF21 | Proceso de alta complejo (cofradías) | Should |
| US-030 | N3RF22 | Gestión flujo estados alta | Should |
| US-031 | N3RF23 | Gestión documentos pendientes | Should |
| US-032 | N3RF24 | Proceso de baja voluntaria | Must |
| US-033 | N3RF25 | Proceso de baja por impago | Must |
| US-034 | N3RF26 | Proceso de baja disciplinaria | Should |
| US-035 | N3RF27 | Rehabilitación de socios | Should |
| US-036 | N3RF28 | Gestión de lista de espera | Should |
| US-037 | N3RF29 | Notificación automática vacantes | Should |
| US-038 | N3RF30 | Carnet digital con QR | Must |
| US-039 | N3RF31 | Validación de carnet por escaneo | Must |
| US-040 | N3RF32 | Carnet físico imprimible | Should |
| US-041 | N3RF33 | Papeleta de sitio (cofradías) | Should |
| US-042 | N3RF34 | Generación masiva papeletas | Should |

**Total:** 34 User Stories (12 Must, 21 Should, 1 Could)

---

## 3. BC-Treasury: Gestión Económica

### 3.1 Configuración de Planes de Cuota

#### US-043: Configuración de planes de cuota
**RF Origen:** N4RF01  
**Prioridad:** Must

> Como **tesorero**,  
> quiero configurar los diferentes planes de cuota de mi entidad con sus periodicidades e importes,  
> para ofrecer flexibilidad en las modalidades de pago a los socios.

**Criterios de Aceptación:**
```gherkin
Scenario: Creación de plan de cuota periódico mensual
  Given un tesorero en Configuración > Planes de Cuota
  When crea un nuevo plan:
    | campo        | valor                          |
    | nombre       | Cuota mensual adulto           |
    | tipo         | PERIODICA                      |
    | importe      | 15.00€                         |
    | periodicidad | MENSUAL                        |
    | mesesCobro   | [1,2,3,4,5,6,7,8,9,10,11,12]   |
    | descripcion  | Pago mensual de 15€/mes        |
  Then el plan queda activo y disponible para vincular a tipos de socio

Scenario: Creación de plan trimestral con ejercicio no natural
  Given un club deportivo con ejercicio septiembre-agosto
  When crea un plan trimestral:
    | campo        | valor                          |
    | nombre       | Cuota trimestral temporada     |
    | tipo         | PERIODICA                      |
    | importe      | 40.00€                         |
    | periodicidad | TRIMESTRAL                     |
    | mesesCobro   | [9,12,3,6]                     |
  Then el plan generará cargos en sept, dic, mar, jun

Scenario: Creación de plan de cuota única (inscripción)
  Given la configuración de planes
  When crea un plan de inscripción:
    | campo        | valor                          |
    | nombre       | Cuota de inscripción           |
    | tipo         | UNICA                          |
    | importe      | 50.00€                         |
    | periodicidad | -                              |
    | mesesCobro   | -                              |
  Then el plan queda disponible para aplicar en altas

Scenario: Planes con importes no proporcionales
  Given cuota anual de referencia 120€
  When el tesorero configura planes alternativos:
    | plan       | importe | total anual | diferencia |
    | Mensual    | 12.00€  | 144€        | +20%       |
    | Trimestral | 35.00€  | 140€        | +17%       |
    | Semestral  | 65.00€  | 130€        | +8%        |
    | Anual      | 120.00€ | 120€        | referencia |
  Then cada plan puede tener importe independiente
  And no se requiere proporcionalidad matemática
```

---

#### US-044: Vinculación de planes a tipos de socio
**RF Origen:** N4RF01  
**Prioridad:** Must

> Como **tesorero**,  
> quiero vincular qué planes de cuota están disponibles para cada tipo de socio,  
> para que al dar de alta un socio solo vea las opciones aplicables a su categoría.

**Criterios de Aceptación:**
```gherkin
Scenario: Vinculación de múltiples planes a un tipo de socio
  Given tipo de socio "Adulto" y planes configurados
  When el tesorero vincula los planes:
    | plan       | esDefault | orden |
    | Mensual    | false     | 1     |
    | Trimestral | false     | 2     |
    | Semestral  | false     | 3     |
    | Anual      | true      | 4     |
    | Inscripción| -         | -     |
  Then el tipo "Adulto" tiene 5 planes disponibles
  And "Anual" aparece preseleccionado al dar alta

Scenario: Planes diferentes por tipo de socio
  Given tipos "Adulto" y "Juvenil"
  When se configuran los planes:
    | tipo    | planes disponibles                    |
    | Adulto  | Mensual, Trimestral, Semestral, Anual |
    | Juvenil | Trimestral, Anual                     |
    | Honor   | (ninguno - exento)                    |
  Then cada tipo muestra solo sus planes vinculados

Scenario: Al menos un plan por tipo (validación)
  Given un tipo de socio sin planes vinculados
  When se intenta dar de alta un socio de ese tipo
  Then el sistema advierte: "Configure planes de cuota para este tipo de socio"
```

---

#### US-045: Selección de modalidad de pago en alta de socio
**RF Origen:** N4RF01, N3RF20  
**Prioridad:** Must

> Como **secretario**,  
> quiero seleccionar la modalidad de pago al dar de alta un socio,  
> para que el socio pueda elegir cómo prefiere pagar sus cuotas.

**Criterios de Aceptación:**
```gherkin
Scenario: Selección de plan durante alta de socio
  Given alta de socio tipo "Juvenil"
  And planes disponibles: Trimestral (35€), Anual (120€)
  And descuento juvenil del 30% configurado en el tipo de socio
  When el secretario ve las opciones:
    | plan       | importeBase | descuento | importeFinal |
    | Trimestral | 35.00€      | 30%       | 24.50€       |
    | Anual      | 120.00€     | 30%       | 84.00€       | ← default
  And selecciona "Trimestral"
  Then se crea SuscripcionCuota:
    | campo           | valor      |
    | planCuotaId     | Trimestral |
    | descuento       | 30%        |
    | importeEfectivo | 24.50€     |

Scenario: Alta con múltiples suscripciones (cuota + inscripción)
  Given alta de socio nuevo
  When se completa el alta
  Then se crean 2 suscripciones:
    | tipo      | plan        | importeEfectivo | fechaBaja    |
    | PERIODICA | Trimestral  | 24.50€          | NULL         |
    | UNICA     | Inscripción | 35.00€          | (automática) |
  And se generan los cargos correspondientes

Scenario: Descuento personalizado adicional
  Given situación especial que requiere descuento extra
  When el secretario añade descuento personalizado del 10%:
    | importeBase | dtoTipo | dtoPers | importeFinal |
    | 35.00€      | 30%     | 10%     | 22.05€       |
  Then el descuento total se refleja en importeEfectivo
```

---

#### US-046: Cambio de modalidad de pago
**RF Origen:** N4RF07  
**Prioridad:** Should

> Como **socio**,  
> quiero poder cambiar mi modalidad de pago (ej: de mensual a anual),  
> para adaptar mis pagos a mi situación económica.

**Criterios de Aceptación:**
```gherkin
Scenario: Cambio de plan mensual a anual
  Given socio con suscripción mensual activa (15€/mes)
  And 3 cargos pagados (enero, febrero, marzo)
  When solicita cambio a plan anual (120€) efectivo en abril
  Then suscripción actual se cierra:
    | campo      | valor       |
    | fechaBaja  | 31/03/2025  |
    | motivoBaja | CAMBIO_PLAN |
  And se crea nueva suscripción:
    | campo           | valor      |
    | planCuotaId     | Anual      |
    | registrationDate       | 01/04/2025 |
    | importeEfectivo | 90.00€     | (prorrateo 9 meses)
  And se genera cargo de 90€ para el resto del ejercicio

Scenario: Histórico de cambios de plan
  Given un socio que ha cambiado de plan varias veces
  When se consulta su histórico de suscripciones
  Then se ve timeline:
    | periodo              | plan       | importe |
    | 01/2023 - 03/2024    | Mensual    | 15€     |
    | 04/2024 - 12/2024    | Anual      | 90€     |
    | 01/2025 - activo     | Trimestral | 35€     |
```

---

#### US-047: Generación masiva de cargos periódicos
**RF Origen:** N4RF02  
**Prioridad:** Must

> Como **sistema**,  
> quiero generar automáticamente los cargos mensuales según las suscripciones activas,  
> para que el tesorero no tenga que crear cargos manualmente.

**Criterios de Aceptación:**
```gherkin
Scenario: Proceso mensual de generación de cargos
  Given día 1 de abril de 2025
  And suscripciones activas:
    | socio         | plan       | mesesCobro         | importeEfectivo |
    | Juan García   | Mensual    | [1..12]            | 15.00€          |
    | María López   | Trimestral | [1,4,7,10]         | 35.00€          |
    | Pedro Martín  | Semestral  | [1,7]              | 65.00€          |
    | Ana Ruiz      | Anual      | [2]                | 120.00€         |
  When el sistema ejecuta generación de cargos para mes 4 (abril)
  Then se generan cargos:
    | socio         | cargo generado | periodoMes |
    | Juan García   | 15.00€         | 4          |
    | María López   | 35.00€         | 4          |
    | Pedro Martín  | (no, mes 4 ∉ [1,7]) | -     |
    | Ana Ruiz      | (no, mes 4 ∉ [2])   | -     |

Scenario: Prevención de cargos duplicados
  Given cargos de abril ya generados para Juan García
  When el proceso se ejecuta de nuevo para mes 4
  Then NO se genera cargo duplicado para Juan
  And el log indica: "Cargo mes 4 ya existe para socio 00142"

Scenario: Generación retroactiva (meses atrasados)
  Given fallo en proceso de marzo, ahora es abril
  When el tesorero ejecuta generación manual para mes 3
  Then se generan los cargos de marzo pendientes
  And los cargos de abril se generan en su proceso normal
```

---

#### US-048: Prorrateo automático en altas a mitad de ejercicio
**RF Origen:** N4RF03  
**Prioridad:** Should

> Como **tesorero**,  
> quiero que las altas a mitad de ejercicio generen solo los cargos de meses restantes,  
> para que el nuevo socio pague proporcionalmente.

**Criterios de Aceptación:**
```gherkin
Scenario: Alta en julio con plan mensual
  Given alta de socio el 15 de julio
  And plan mensual con mesesCobro = [1,2,3,4,5,6,7,8,9,10,11,12]
  When se activa la suscripción
  Then solo se programan cargos para meses >= 7:
    | periodoMes | importe |
    | 7          | 15.00€  |
    | 8          | 15.00€  |
    | ...        | ...     |
    | 12         | 15.00€  |
  And total a pagar en año de alta: 90€ (6 meses x 15€)

Scenario: Alta en julio con plan trimestral (mesesCobro = [1,4,7,10])
  Given alta de socio el 15 de julio
  When se activa la suscripción trimestral
  Then solo se programan cargos para meses >= 7 que estén en mesesCobro:
    | periodoMes | importe |
    | 7          | 35.00€  |
    | 10         | 35.00€  |
  And total a pagar en año de alta: 70€ (2 trimestres)

Scenario: Alta en julio con plan anual (mesesCobro = [2])
  Given alta de socio el 15 de julio
  And plan anual con cargo único en febrero (ya pasado)
  And configuración: "Prorrateo inmediato para plan anual"
  When se activa la suscripción
  Then se genera cargo prorrateado inmediato:
    | concepto                    | importe |
    | Cuota 2025 (6/12 meses)     | 60.00€  |
  And se marca como esProrrateo = true

Scenario: Configuración de prorrateo por entidad
  Given las opciones de prorrateo para plan anual:
    | opción             | comportamiento                        |
    | Prorrateo inmediato| Cargo proporcional al dar alta        |
    | Esperar siguiente  | Sin cargo hasta próximo ciclo         |
    | Cuota completa     | Cobrar cuota íntegra sin prorrateo    |
  When el presidente configura la opción
  Then se aplica a todas las altas con ese plan
```

---

#### US-049: Gestión de descuentos en suscripciones
**RF Origen:** N4RF04  
**Prioridad:** Must

> Como **tesorero**,  
> quiero aplicar descuentos en las suscripciones individuales,  
> para gestionar tanto descuentos por tipo como situaciones especiales.

**Criterios de Aceptación:**
```gherkin
Scenario: Descuento por tipo de socio
  Given tipo de socio "Juvenil" con descuento configurado del 30%
  And plan "Cuota anual" de 120€
  When se crea suscripción para socio juvenil
  Then la suscripción tiene:
    | campo           | valor  |
    | descuento       | 30%    |
    | importeEfectivo | 84.00€ |

Scenario: Descuento personalizado adicional
  Given socio juvenil (30% por tipo)
  And situación económica que justifica 20% adicional
  When el tesorero crea suscripción con ambos descuentos:
    | importeBase | dtoTipo | dtoPers | cálculo           | importeFinal |
    | 120.00€     | 30%     | 20%     | 120 × 0.7 × 0.8   | 67.20€       |
  Then importeEfectivo = 67.20€
  And queda registro del motivo del descuento personalizado

Scenario: Modificación de descuento en suscripción activa
  Given suscripción con descuento 30%
  When el tesorero modifica a 40%
  Then los cargos FUTUROS se generan con nuevo descuento
  And los cargos YA GENERADOS mantienen su importe original
```

---

#### US-050: Gestión de exenciones de pago
**RF Origen:** N4RF05  
**Prioridad:** Should

> Como **tesorero**,  
> quiero gestionar exenciones totales o parciales de pago,  
> para casos especiales como socios de honor o situaciones económicas difíciles.

**Criterios de Aceptación:**
```gherkin
Scenario: Exención total para socio de honor
  Given tipo de socio "Honor" sin planes vinculados
  When se da de alta un socio de honor
  Then NO se crea ninguna suscripción de cuota
  And el socio no tiene cargos generados
  And aparece en listado de "Socios exentos"

Scenario: Exención temporal por situación especial
  Given socio activo con suscripción mensual
  When el presidente aprueba exención temporal:
    | campo       | valor                     |
    | motivo      | Situación económica       |
    | periodo     | 01/2025 - 12/2025         |
    | aprobadoPor | Junta Directiva 15/01/25  |
  Then se cierra suscripción actual con motivoBaja = EXENCION
  And NO se generan cargos durante el periodo de exención
  And al finalizar, se notifica para renovar o reactivar cuota

Scenario: Exención parcial (descuento 100%)
  Given necesidad de exención pero manteniendo registro
  When se crea suscripción con descuento = 100%
  Then importeEfectivo = 0€
  And se generan cargos de 0€ (para trazabilidad)
  And el socio aparece en estadísticas de "exentos"
```

---

#### US-051: Cargo manual directo (sin suscripción)
**RF Origen:** N4RF08  
**Prioridad:** Must

> Como **tesorero**,  
> quiero crear cargos puntuales sin necesidad de configurar un plan de cuota,  
> para cobrar derramas, penalizaciones u otros conceptos esporádicos.

**Criterios de Aceptación:**
```gherkin
Scenario: Cargo manual individual
  Given necesidad de cobrar derrama por obras
  When el tesorero crea cargo manual:
    | campo        | valor                |
    | memberId      | Juan García          |
    | concepto     | Derrama obras local  |
    | importe      | 75.00€               |
    | vencimiento  | 28/02/2025           |
  Then se crea Cargo con:
    | campo          | valor              |
    | suscripcionId  | NULL               |
    | periodoMes     | NULL               |
    | esManual       | true               |

Scenario: Cargo manual masivo (derrama a todos)
  Given 340 socios activos
  When el tesorero crea cargo masivo:
    | campo        | valor                    |
    | destinatarios| Todos los socios activos |
    | concepto     | Derrama obras 2025       |
    | importe      | 75.00€                   |
  Then se crean 340 cargos manuales
  And cada cargo tiene esManual = true

Scenario: Cargo de penalización por devolución
  Given una devolución SEPA con gastos de 5€
  When el tesorero repercute gastos al socio
  Then se crea cargo manual:
    | concepto     | Gastos devolución SEPA   |
    | importe      | 5.00€                    |
    | esManual     | true                     |
```

---

#### US-052: Histórico de suscripciones del socio
**RF Origen:** N4RF01  
**Prioridad:** Should

> Como **secretario**,  
> quiero consultar el histórico de suscripciones de un socio,  
> para ver cómo han evolucionado sus modalidades de pago.

**Criterios de Aceptación:**
```gherkin
Scenario: Visualización de histórico
  Given un socio con varios cambios de plan
  When se consulta su histórico de suscripciones
  Then se muestra:
    | periodo           | plan       | importeEfectivo | motivoBaja  |
    | 01/2022 - 03/2023 | Mensual    | 15.00€          | CAMBIO_PLAN |
    | 04/2023 - 12/2024 | Anual      | 84.00€          | CAMBIO_PLAN |
    | 01/2025 - activo  | Trimestral | 24.50€          | -           |

Scenario: Detalle de suscripción
  Given el histórico de suscripciones
  When se expande una suscripción
  Then muestra:
    | dato             | valor                      |
    | Plan             | Cuota anual adulto         |
    | Importe base     | 120.00€                    |
    | Descuento        | 30% (Juvenil)              |
    | Importe efectivo | 84.00€                     |
    | Cargos generados | 2 (2023, 2024)             |
    | Total cobrado    | 168.00€                    |
```

---

### 3.2 Registro de Cobros

#### US-053: Registro de cobros multi-método
**RF Origen:** N4RF09  
**Prioridad:** Must

> Como **tesorero**,  
> quiero registrar cobros por cualquier método de pago,  
> para reflejar la realidad de cómo pagan los socios.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de pago en efectivo
  Given un socio con cargo pendiente de 24.50€
  When el tesorero registra cobro:
    | campo        | valor              |
    | método       | EFECTIVO           |
    | importe      | 24.50€             |
    | fecha        | 2025-02-04         |
  Then el cargo pasa a estado "PAGADO"
  And se genera recibo automático en PDF
  And se registra quién registró el cobro

Scenario: Registro de transferencia bancaria
  Given un cobro por transferencia recibido
  When el tesorero lo registra:
    | campo        | valor                    |
    | método       | TRANSFERENCIA            |
    | importe      | 24.50€                   |
    | referencia   | Cuota Q1 2025 - García   |
    | fechaValor   | 2025-02-03               |
  Then se vincula al cargo pendiente del socio
  And el cargo pasa a "PAGADO"

Scenario: Registro de Bizum
  Given un socio que paga por Bizum
  When se registra el cobro:
    | campo        | valor              |
    | método       | BIZUM              |
    | importe      | 24.50€             |
    | referencia   | Bizum 666123456    |
  Then queda registrado con el método correcto
  And se puede filtrar por método de pago
```

---

#### US-054: Gestión de estados de pago
**RF Origen:** N4RF10  
**Prioridad:** Must

> Como **tesorero**,  
> quiero que cada cargo tenga un estado claro,  
> para saber exactamente la situación de cada cobro.

**Criterios de Aceptación:**
```gherkin
Scenario: Estados disponibles para cargos
  Given el catálogo de estados de pago
  Then existen:
    | estado    | descripción                          | color   |
    | PENDIENTE | Cargo generado, no cobrado           | Naranja |
    | PAGADO    | Cobro confirmado                     | Verde   |
    | PARCIAL   | Pago incompleto                      | Amarillo|
    | DEVUELTO  | Recibo domiciliado rechazado         | Rojo    |
    | ANULADO   | Cargo cancelado                      | Gris    |

Scenario: Pago parcial
  Given un cargo de 35€ pendiente (cuota trimestral)
  When el socio paga 20€
  Then el cargo pasa a estado "PARCIAL"
  And muestra: "Pagado: 20€ / Pendiente: 15€"
  And se puede registrar el resto posteriormente

Scenario: Transición de DEVUELTO a PAGADO
  Given un cargo devuelto por el banco
  When el socio regulariza pagando en efectivo
  Then el estado cambia de "DEVUELTO" a "PAGADO"
  And se mantiene historial de la devolución
```

---

#### US-055: Información completa de cada cobro
**RF Origen:** N4RF11  
**Prioridad:** Must

> Como **tesorero**,  
> quiero que cada cobro tenga toda la información necesaria,  
> para tener trazabilidad completa ante auditorías o disputas.

**Criterios de Aceptación:**
```gherkin
Scenario: Datos registrados en cada cobro
  Given un pago registrado
  Then contiene:
    | campo              | ejemplo                  |
    | fechaPago          | 2025-02-04 10:35         |
    | método             | TRANSFERENCIA            |
    | importe            | 24.50€                   |
    | referencia         | TRF-2025-00142           |
    | concepto           | Cuota Q1 2025            |
    | registradoPor      | Ana Pérez (Tesorero)     |
    | fechaRegistro      | 2025-02-04 11:20         |
    | justificante       | extracto_feb.pdf         |

Scenario: Auditoría de modificaciones
  Given un cobro que se modifica
  When el tesorero corrige la fecha de pago
  Then se mantiene historial:
    | acción            | fecha           | usuario    | detalle            |
    | Creación          | 04/02 11:20     | Ana Pérez  | -                  |
    | Modificación      | 04/02 15:30     | Ana Pérez  | fecha: 03→04/02    |
```

---

#### US-056: Adjuntar justificantes a pagos
**RF Origen:** N4RF12  
**Prioridad:** Should

> Como **tesorero**,  
> quiero adjuntar comprobantes digitales a cada cobro,  
> para tener respaldo documental ante disputas.

**Criterios de Aceptación:**
```gherkin
Scenario: Adjuntar captura de transferencia
  Given un cobro por transferencia registrado
  When el tesorero adjunta el extracto bancario
  Then el archivo queda vinculado al cobro
  And se puede previsualizar sin descargar
  And formatos soportados: PDF, JPG, PNG

Scenario: Múltiples justificantes
  Given un cobro que requiere varios documentos
  When se adjuntan: extracto + email de confirmación
  Then ambos documentos quedan vinculados
  And se muestran en miniatura junto al cobro

Scenario: Justificante obligatorio por método
  Given configuración: "Justificante obligatorio para efectivo"
  When se registra pago en efectivo sin adjunto
  Then el sistema advierte: "Se recomienda adjuntar recibo firmado"
  And permite continuar (warning, no bloqueo)
```

---

#### US-057: Generación automática de recibos
**RF Origen:** N4RF13  
**Prioridad:** Must

> Como **tesorero**,  
> quiero que el sistema genere recibos automáticamente,  
> para documentar pagos en efectivo y evitar disputas.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de recibo para pago en efectivo
  Given un pago en efectivo de 24.50€ registrado
  When se confirma el cobro
  Then se genera PDF de recibo con:
    | elemento           | contenido                    |
    | Logo entidad       | [Logo cofradía]              |
    | Número recibo      | REC-2025-00042               |
    | Fecha              | 04/02/2025                   |
    | Recibido de        | Juan García López            |
    | Concepto           | Cuota Q1 2025                |
    | Importe            | 24,50 €                      |
    | Método             | Efectivo                     |
    | Firma tesorero     | [Espacio firma]              |
  And el PDF queda vinculado al cobro
  And se puede imprimir para entregar al socio

Scenario: Recibo con desglose de conceptos
  Given un pago que cubre varios cargos
  When se genera el recibo
  Then muestra desglose:
    | concepto           | importe    |
    | Cuota Q1 2025      | 24,50 €    |
    | Inscripción evento | 15,00 €    |
    | TOTAL              | 39,50 €    |
```

---

### 3.3 Gestión de Morosidad

#### US-058: Workflow de morosidad configurable
**RF Origen:** N4RF14  
**Prioridad:** Must

> Como **tesorero**,  
> quiero un proceso automatizado de gestión de morosidad,  
> para no tener que hacer seguimiento manual de impagos.

**Criterios de Aceptación:**
```gherkin
Scenario: Fases del workflow de morosidad
  Given la configuración de morosidad de la entidad
  Then el workflow tiene las fases:
    | fase | trigger           | acción                              |
    | 1    | Vencimiento       | Cargo pasa a "Vencido"              |
    | 2    | +30 días          | Email recordatorio amistoso         |
    | 3    | +60 días          | Segundo aviso formal                |
    | 4    | +90 días          | Estado socio → "PendientePago"      |
    | 5    | +180 días         | Suspensión de derechos              |
    | 6    | +365 días         | Inicio expediente baja              |
    | 7    | +730 días         | Baja por impago                     |

Scenario: Ejecución automática del workflow
  Given un cargo vencido hace 35 días
  When el sistema ejecuta el proceso nocturno de morosidad
  Then detecta que debe enviar "Email recordatorio"
  And envía el email configurado
  And registra la acción en el historial del cargo
  And emite evento MorosidadDetectada

Scenario: Regularización en cualquier fase
  Given un socio en fase 5 (suspendido)
  When paga todas las cuotas pendientes
  Then el workflow se cancela
  And el estado del socio vuelve a "Activo"
  And se restauran sus derechos inmediatamente
```

---

#### US-059: Plazos de morosidad configurables
**RF Origen:** N4RF15  
**Prioridad:** Should

> Como **presidente**,  
> quiero configurar los plazos de morosidad según nuestros estatutos,  
> para adaptar el sistema a nuestra normativa interna.

**Criterios de Aceptación:**
```gherkin
Scenario: Configuración de plazos personalizados
  Given el presidente accede a Configuración > Morosidad
  When ajusta los plazos:
    | fase                  | plazo estatutos |
    | Primer aviso          | 45 días         |
    | Segundo aviso         | 90 días         |
    | Suspensión derechos   | 180 días        |
    | Inicio expediente     | 365 días        |
    | Baja definitiva       | 730 días        |
  Then el workflow aplica los nuevos plazos
  And los socios actuales en morosidad se recalculan

Scenario: Plazos diferentes por tipo de cargo
  Given cargos ordinarios y derramas
  When se configura:
    | tipo cargo  | plazo baja |
    | Ordinario   | 730 días   |
    | Derrama     | 365 días   |
  Then las derramas tienen tratamiento más estricto
```

---

#### US-060: Documentación automática de morosidad
**RF Origen:** N4RF16  
**Prioridad:** Should

> Como **tesorero**,  
> quiero que se genere automáticamente la documentación de morosidad,  
> para cumplir con el procedimiento estatutario y tener respaldo legal.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de certificado de descubierto
  Given un socio con 2 años de impago
  When se inicia el expediente de baja
  Then se genera certificado con:
    | elemento                | contenido                      |
    | Datos socio             | Nombre, nº socio, DNI          |
    | Detalle deuda           | Q1 2023: 24.50€, Q2 2023: 24.50€...|
    | Total adeudado          | 196.00€                        |
    | Notificaciones enviadas | 15/03/23, 15/06/23, 15/09/23...|
    | Firma tesorero          | Con VºBº del presidente        |
  And el certificado queda archivado como prueba

Scenario: Registro de notificaciones con acuse
  Given envío de notificación de morosidad
  Then se registra:
    | campo              | valor                      |
    | fecha envío        | 2025-02-04                 |
    | canal              | Email                      |
    | contenido          | [Texto del aviso]          |
    | estado entrega     | Entregado / Rebotado       |
    | fecha lectura      | 2025-02-05 (si disponible) |
```

---

### 3.4 Remesas SEPA

#### US-061: Generación de ficheros SEPA
**RF Origen:** N4RF17  
**Prioridad:** Must

> Como **tesorero**,  
> quiero generar ficheros de remesa SEPA válidos,  
> para cobrar las cuotas por domiciliación bancaria sin necesidad de gestoría.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de remesa SEPA Core
  Given 200 socios con cargos pendientes y mandato SEPA activo
  When el tesorero genera la remesa:
    | campo           | valor              |
    | fechaCobro      | 2025-02-15         |
    | concepto        | Cuota Q1 2025      |
  Then se genera fichero XML ISO 20022 (pain.008.001.08)
  And el fichero incluye los 200 adeudos
  And cada adeudo tiene el tipo de secuencia correcto (FRST/RCUR)
  And el fichero es validable con herramientas SEPA

Scenario: Validación de formato SEPA
  Given el fichero XML generado
  Then cumple con:
    | validación                        | resultado |
    | Estructura XML pain.008           | ✓         |
    | Identificador acreedor válido     | ✓         |
    | IBANs en formato correcto         | ✓         |
    | Fechas en formato ISO             | ✓         |
    | Importes con 2 decimales          | ✓         |

Scenario: Remesa parcial (selección de socios)
  Given necesidad de cobrar solo a un grupo
  When el tesorero selecciona socios específicos
  And genera la remesa
  Then solo se incluyen los seleccionados
  And los demás mantienen cargos pendientes
```

---

#### US-062: Gestión del identificador de acreedor
**RF Origen:** N4RF18  
**Prioridad:** Must

> Como **tesorero**,  
> quiero registrar el identificador de acreedor de mi entidad,  
> para poder emitir remesas SEPA válidas.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de identificador de acreedor
  Given una entidad configurando SEPA
  When el tesorero introduce:
    | campo                   | valor                    |
    | identificadorAcreedor   | ES12345678901234         |
    | nombreAcreedor          | Peña El Tambor           |
    | direccion               | C/ Mayor 15, Teruel      |
  Then el identificador se valida (formato español)
  And queda configurado para las remesas

Scenario: Validación de formato
  Given un identificador introducido
  Then se valida:
    | regla                              | ejemplo válido    |
    | Prefijo país ES                    | ES...             |
    | Dígito control (posiciones 3-4)    | Calculable        |
    | Sufijo (posiciones 5-7)            | 000-999           |
    | NIF entidad (posiciones 8-16)      | CIF válido        |

Scenario: Alerta de identificador no configurado
  Given una entidad sin identificador de acreedor
  When el tesorero intenta generar remesa
  Then el sistema bloquea y muestra:
    "Configure el Identificador de Acreedor en Configuración > SEPA"
```

---

#### US-063: Gestión de mandatos SEPA
**RF Origen:** N4RF19  
**Prioridad:** Must

> Como **tesorero**,  
> quiero gestionar los mandatos SEPA de cada socio,  
> para tener autorización válida antes de domiciliar.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de nuevo mandato
  Given un socio que autoriza domiciliación
  When el tesorero registra el mandato:
    | campo              | valor                        |
    | referencia         | MAND-2025-00142              |
    | fechaFirma         | 2025-02-01                   |
    | iban               | ES9121000418450200051332     |
    | titular            | Juan García López            |
    | documentoFirmado   | mandato_juangarcia.pdf       |
  Then el mandato queda activo
  And el primer adeudo será tipo FRST

Scenario: Caducidad de mandato por inactividad
  Given un mandato sin adeudos en 36 meses
  When el sistema revisa mandatos
  Then el mandato pasa a estado "Caducado"
  And el próximo adeudo requerirá nuevo mandato
  And se notifica al tesorero

Scenario: Estados del mandato
  Given el ciclo de vida del mandato
  Then los estados son:
    | estado    | descripción                          |
    | Activo    | Válido para adeudos                  |
    | Caducado  | Sin uso en 36 meses                  |
    | Revocado  | Cancelado por el socio               |
    | Pendiente | Firmado pero sin primer uso          |
```

---

#### US-064: Tipos de secuencia SEPA automáticos
**RF Origen:** N4RF20  
**Prioridad:** Must

> Como **sistema**,  
> quiero asignar automáticamente el tipo de secuencia correcto,  
> para evitar rechazos bancarios por secuencia incorrecta.

**Criterios de Aceptación:**
```gherkin
Scenario: Primer adeudo de un mandato (FRST)
  Given un socio con mandato nuevo sin adeudos previos
  When se incluye en una remesa
  Then el tipo de secuencia es "FRST"
  And tras el cobro exitoso, el mandato se marca como "usado"

Scenario: Adeudos recurrentes (RCUR)
  Given un socio con mandato ya utilizado
  When se incluye en una nueva remesa
  Then el tipo de secuencia es "RCUR"

Scenario: Reactivación tras 36 meses (vuelve a FRST)
  Given un mandato sin uso en 37 meses
  When se incluye en remesa
  Then el tipo de secuencia es "FRST"
  And se considera "reactivación" del mandato

Scenario: Cobro único (OOFF)
  Given un cargo manual marcado como "cobro único"
  When se configura el tipo de secuencia
  Then el tipo de secuencia es "OOFF"
```

---

#### US-065: Control de plazos de presentación
**RF Origen:** N4RF21  
**Prioridad:** Should

> Como **tesorero**,  
> quiero recibir alertas sobre los plazos de presentación SEPA,  
> para evitar rechazos por presentación fuera de plazo.

**Criterios de Aceptación:**
```gherkin
Scenario: Validación de fecha de cobro
  Given fecha actual 10 de febrero
  And plazo mínimo SEPA Core: 3 días hábiles
  When el tesorero intenta generar remesa para cobro el 12 de febrero
  Then el sistema advierte: "Fecha de cobro insuficiente"
  And sugiere fecha mínima: 14 de febrero

Scenario: Cálculo de días hábiles
  Given la generación de remesa
  Then el sistema considera:
    | día             | laborable |
    | Lunes-Viernes   | Sí        |
    | Sábados         | No        |
    | Domingos        | No        |
    | Festivos nac.   | No        |

Scenario: Recordatorio de envío al banco
  Given una remesa generada para cobro el 20 de febrero
  Then el sistema muestra:
    "Enviar al banco antes del 14 de febrero (3 días hábiles)"
```

---

#### US-066: Gestión de devoluciones SEPA
**RF Origen:** N4RF22  
**Prioridad:** Must

> Como **tesorero**,  
> quiero gestionar las devoluciones de adeudos,  
> para hacer seguimiento de impagos y reintentar cuando proceda.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de devolución
  Given un adeudo devuelto por el banco
  When el tesorero registra la devolución:
    | campo              | valor              |
    | motivoSEPA         | AM04 - Fondos insuf|
    | fechaDevolucion    | 2025-02-18         |
    | gastosBancarios    | 3.50€              |
  Then el cargo vuelve a estado "DEVUELTO"
  And se registran los gastos bancarios
  And se actualiza historial del socio

Scenario: Códigos de motivo SEPA
  Given las devoluciones recibidas
  Then se clasifican por motivo:
    | código | descripción                  | acción sugerida       |
    | AC01   | IBAN incorrecto              | Verificar datos       |
    | AC04   | Cuenta cerrada               | Contactar socio       |
    | AM04   | Fondos insuficientes         | Reintentar en 15 días |
    | MD01   | Sin mandato válido           | Solicitar nuevo mandato|
    | MS02   | Rechazo del deudor           | Contactar socio       |

Scenario: Programar reintento
  Given una devolución por fondos insuficientes
  When el tesorero programa reintento:
    | campo              | valor              |
    | fechaReintento     | 2025-03-05         |
  Then el cargo se incluirá en la remesa de esa fecha
  And se mantiene historial de la devolución previa
```

---

#### US-067: Exportación de remesa para banca online
**RF Origen:** N4RF23  
**Prioridad:** Must

> Como **tesorero**,  
> quiero descargar el fichero SEPA listo para subir al banco,  
> para completar el proceso de cobro sin complicaciones técnicas.

**Criterios de Aceptación:**
```gherkin
Scenario: Descarga de fichero XML
  Given una remesa generada y validada
  When el tesorero pulsa "Descargar para banco"
  Then se descarga fichero: "remesa_20250204_cuotas.xml"
  And el nombre incluye fecha para identificación
  And el formato es compatible con banca online

Scenario: Instrucciones de subida
  Given la descarga del fichero
  Then el sistema muestra guía:
    "1. Acceda a su banca online
     2. Vaya a Cobros > Remesas > Importar fichero
     3. Seleccione el fichero descargado
     4. Verifique el resumen y confirme"

Scenario: Marcado de remesa como enviada
  Given el fichero descargado
  When el tesorero confirma "Ya enviada al banco"
  Then la remesa pasa a estado "Enviada"
  And los cargos pasan a "En proceso de cobro"
  And se registra fecha de envío
```

---

### 3.5 Pasarela de Pago Online

#### US-068: Generación de enlaces de pago
**RF Origen:** N4RF24  
**Prioridad:** Should

> Como **tesorero**,  
> quiero generar enlaces de pago para cobros puntuales,  
> para ofrecer pago con tarjeta a socios que no domicilian.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de enlace individual
  Given un cargo pendiente de 24.50€
  When el tesorero genera enlace de pago
  Then se crea URL única: https://pay.associated.es/p/abc123
  And el enlace tiene validez de 30 días
  And muestra concepto y importe al acceder

Scenario: Envío de enlace al socio
  Given el enlace generado
  When el tesorero envía por email
  Then el socio recibe email con:
    | elemento        | contenido                        |
    | Asunto          | Enlace de pago - Peña El Tambor  |
    | Concepto        | Cuota Q1 2025                    |
    | Importe         | 24,50 €                          |
    | Botón           | [Pagar ahora]                    |
    | Validez         | Hasta 06/03/2025                 |

Scenario: Pago completado
  Given un socio que accede al enlace y paga
  When completa el pago con tarjeta
  Then el cargo pasa automáticamente a "PAGADO"
  And el enlace se invalida (uso único)
  And se envía confirmación al socio y al tesorero
```

---

#### US-069: Pago mediante código QR
**RF Origen:** N4RF25  
**Prioridad:** Could

> Como **socio**,  
> quiero poder pagar escaneando un QR desde mi móvil,  
> para agilizar pagos presenciales.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de QR para cargo
  Given un cargo pendiente
  When el tesorero genera QR
  Then se muestra código QR que codifica la URL de pago
  And se puede imprimir o mostrar en pantalla

Scenario: Pago escaneando QR
  Given el socio escanea el QR con su móvil
  Then accede directamente a la pasarela de pago
  And ve el concepto e importe
  And puede pagar con Apple Pay / Google Pay / tarjeta
```

---

#### US-070: Conciliación automática de pagos online
**RF Origen:** N4RF26  
**Prioridad:** Should

> Como **sistema**,  
> quiero vincular automáticamente los pagos online con sus cargos,  
> para que el tesorero no tenga que conciliar manualmente.

**Criterios de Aceptación:**
```gherkin
Scenario: Conciliación automática
  Given un pago recibido vía pasarela
  When la pasarela notifica el cobro (webhook)
  Then el sistema identifica el cargo por referencia
  And actualiza el estado a "PAGADO"
  And registra el método como "TARJETA_ONLINE"
  And notifica al tesorero del cobro recibido

Scenario: Pago no conciliable
  Given un pago sin referencia identificable
  When el sistema intenta conciliar
  Then lo marca como "Pendiente de conciliación manual"
  And notifica al tesorero para revisión
```

---

#### US-071: Gestión de comisiones de pasarela
**RF Origen:** N4RF27  
**Prioridad:** Could

> Como **tesorero**,  
> quiero decidir quién asume las comisiones de pasarela,  
> para controlar el coste de ofrecer pago online.

**Criterios de Aceptación:**
```gherkin
Scenario: Comisión asumida por la entidad
  Given configuración "Entidad asume comisiones"
  And comisión de pasarela del 2%
  When un socio paga 24.50€
  Then el socio paga exactamente 24.50€
  And la entidad recibe 24.01€ (24.50€ - 0.49€ comisión)

Scenario: Comisión repercutida al socio
  Given configuración "Socio asume comisiones"
  When un socio va a pagar 24.50€
  Then ve: "Importe: 24.50€ + 0.49€ comisión = 24.99€"
  And puede decidir si continúa o no
  And la entidad recibe los 24.50€ íntegros
```

---

### 3.6 Contabilidad y Fiscalidad

#### US-072: Libro de ingresos y gastos
**RF Origen:** N4RF28  
**Prioridad:** Must

> Como **tesorero**,  
> quiero llevar un registro ordenado de ingresos y gastos,  
> para tener la contabilidad básica de mi asociación.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de ingreso
  Given el tesorero registra un ingreso
  When introduce:
    | campo        | valor                    |
    | fecha        | 2025-02-04               |
    | tipo         | Ingreso                  |
    | categoría    | Cuotas socios            |
    | concepto     | Cobro remesa febrero     |
    | importe      | 4.900,00€                |
    | justificante | extracto_feb.pdf         |
  Then el movimiento queda registrado
  And actualiza el saldo acumulado

Scenario: Registro de gasto
  Given un gasto a registrar
  When el tesorero introduce:
    | campo        | valor                    |
    | fecha        | 2025-02-05               |
    | tipo         | Gasto                    |
    | categoría    | Suministros              |
    | concepto     | Factura electricidad     |
    | importe      | 120,00€                  |
    | proveedor    | Iberdrola                |
    | factura      | factura_iber_feb.pdf     |
  Then el gasto queda registrado
  And se descuenta del saldo

Scenario: Categorías de ingreso/gasto
  Given el plan de categorías
  Then incluye como mínimo:
    | tipo    | categorías                              |
    | Ingreso | Cuotas, Subvenciones, Eventos, Donativos|
    | Gasto   | Suministros, Servicios, Personal, Eventos|
```

---

#### US-073: Plan de cuentas para ENL
**RF Origen:** N4RF29  
**Prioridad:** Could

> Como **tesorero de asociación de utilidad pública**,  
> quiero usar el plan contable oficial de ENL,  
> para cumplir con la normativa contable obligatoria.

**Criterios de Aceptación:**
```gherkin
Scenario: Activación del plan contable ENL
  Given una asociación declarada de utilidad pública
  When el presidente activa el modo "Contabilidad ENL"
  Then el sistema carga el plan de cuentas RD 1491/2011
  And las categorías se mapean a cuentas contables:
    | categoría       | cuenta ENL                    |
    | Cuotas socios   | 720 - Cuotas de usuarios      |
    | Subvenciones    | 740 - Subvenciones oficiales  |
    | Donativos       | 723 - Aportaciones            |

Scenario: Fondo social en lugar de capital
  Given el balance de una ENL
  Then muestra "Fondo Social" (no "Capital Social")
  And refleja el patrimonio de la entidad sin ánimo de lucro
```

---

#### US-074: Informes contables para ENL
**RF Origen:** N4RF30  
**Prioridad:** Should

> Como **tesorero**,  
> quiero generar los informes contables obligatorios,  
> para presentar en Asamblea y ante la Administración.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de informe económico para Asamblea
  Given el cierre del ejercicio 2024
  When el tesorero genera el informe
  Then se crea PDF con:
    | sección                  | contenido                    |
    | Resumen ingresos         | Por categoría con totales    |
    | Resumen gastos           | Por categoría con totales    |
    | Resultado ejercicio      | Superávit/Déficit            |
    | Comparativa año anterior | Variaciones %                |
    | Gráficos                 | Distribución ingresos/gastos |

Scenario: Balance de situación
  Given contabilidad del ejercicio
  When se genera balance
  Then muestra:
    | activo              | pasivo + fondo social        |
    | Tesorería           | Fondo social                 |
    | Deudores (cuotas)   | Acreedores                   |
    | Inmovilizado        | Subvenciones pendientes      |

Scenario: Apartado 12 de memoria (utilidad pública)
  Given una asociación de utilidad pública
  When genera la memoria
  Then incluye Apartado 12 obligatorio:
    - Identificación de la entidad
    - Bases de presentación
    - Aplicación de elementos patrimoniales
```

---

#### US-075: Alertas de obligaciones fiscales
**RF Origen:** N4RF31  
**Prioridad:** Should

> Como **tesorero**,  
> quiero recibir alertas de plazos fiscales,  
> para no olvidar presentar declaraciones obligatorias.

**Criterios de Aceptación:**
```gherkin
Scenario: Calendario de obligaciones fiscales
  Given el inicio del año fiscal
  Then el sistema muestra calendario:
    | modelo | descripción                | plazo         |
    | 182    | Donativos recibidos        | 1-31 enero    |
    | 190    | Resumen retenciones IRPF   | 1-31 enero    |
    | 111    | Retenciones trimestrales   | 1-20 abr/jul/oct/ene |
    | 200    | Impuesto Sociedades        | 1-25 julio    |
    | 347    | Operaciones >3.005€        | 1-28 febrero  |

Scenario: Alerta anticipada
  Given el plazo del Modelo 182 termina el 31 de enero
  When faltan 15 días
  Then el tesorero recibe alerta:
    "Recordatorio: Modelo 182 (Donativos) - Plazo hasta 31/01"
  And se repite a 7 días y 3 días del vencimiento

Scenario: Marcar como presentado
  Given una obligación con alerta activa
  When el tesorero marca "Ya presentado"
  Then la alerta se desactiva
  And queda registro de la fecha de presentación
```

---

#### US-076: Control de umbrales de exención fiscal
**RF Origen:** N4RF32  
**Prioridad:** Should

> Como **tesorero**,  
> quiero monitorizar los umbrales de exención del Impuesto de Sociedades,  
> para saber si mi entidad está obligada a declarar.

**Criterios de Aceptación:**
```gherkin
Scenario: Dashboard de umbrales fiscales
  Given los ingresos del ejercicio actual
  Then el sistema muestra:
    | umbral                          | límite   | actual   | estado |
    | Ingresos totales                | 75.000€  | 45.000€  | ✓ OK   |
    | Rentas no exentas sin retención | 2.000€   | 500€     | ✓ OK   |
  And indica: "Exento de declarar Impuesto Sociedades"

Scenario: Alerta al aproximarse a umbral
  Given ingresos acumulados de 70.000€
  When se registra un nuevo ingreso de 3.000€
  Then el sistema alerta:
    "Atención: Ingresos al 97% del umbral de exención (73.000€/75.000€)"
  And sugiere consultar con asesor fiscal

Scenario: Superación de umbral
  Given ingresos que superan 75.000€
  Then el sistema indica:
    "Obligación de presentar Modelo 200 (Impuesto Sociedades)"
  And añade la obligación al calendario fiscal
```

---

#### US-077: Exportación de datos para Modelo 182
**RF Origen:** N4RF33  
**Prioridad:** Should

> Como **tesorero**,  
> quiero exportar el listado de donantes para el Modelo 182,  
> para cumplimentar la declaración sin errores.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de listado de donantes
  Given donativos recibidos en el ejercicio
  When el tesorero exporta para Modelo 182
  Then se genera fichero con:
    | NIF donante | Nombre              | Importe   |
    | 12345678A   | Juan García López   | 500,00€   |
    | 87654321B   | María Pérez Sánchez | 250,00€   |
    | ...         | ...                 | ...       |
    | TOTAL       |                     | 5.750,00€ |

Scenario: Validación de NIFs
  Given el listado de donantes
  Then se valida que cada NIF es correcto
  And se marcan los inválidos para corrección
  And solo se exportan los validados
```

---

### 3.7 Caja por Turnos (Peñas)

#### US-078: Apertura de caja por turno
**RF Origen:** N4RF34  
**Prioridad:** Should

> Como **responsable de turno de barra**,  
> quiero abrir caja con un fondo inicial asignado,  
> para empezar mi turno con control del efectivo.

**Criterios de Aceptación:**
```gherkin
Scenario: Apertura de turno
  Given el evento "Fiestas 2025" activo
  When el responsable abre turno:
    | campo           | valor              |
    | responsable     | Pedro Martínez     |
    | fondoInicial    | 100,00€            |
    | horaInicio      | 2025-07-15 20:00   |
    | ubicación       | Barra principal    |
  Then el turno queda abierto
  And se puede registrar ventas
  And se asocia al evento activo

Scenario: Fondo inicial verificado
  Given apertura de turno con fondo 100€
  When el responsable confirma que tiene el efectivo
  Then queda registro del fondo entregado
  And el responsable anterior firma la entrega (si aplica)
```

---

#### US-079: Registro de ventas por turno
**RF Origen:** N4RF35  
**Prioridad:** Should

> Como **responsable de turno**,  
> quiero registrar las ventas de forma rápida,  
> para llevar control de lo vendido durante mi turno.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro rápido de ventas
  Given un turno de caja abierto
  When el responsable registra ventas:
    | producto      | cantidad | precio | total  |
    | Cerveza       | 50       | 2,00€  | 100,00€|
    | Bocadillo     | 20       | 4,00€  | 80,00€ |
    | Refresco      | 30       | 1,50€  | 45,00€ |
  Then el total de ventas del turno es 225,00€
  And se actualiza en tiempo real

Scenario: Productos predefinidos
  Given la configuración de productos de barra
  Then existen botones rápidos para:
    | producto      | precio |
    | Cerveza       | 2,00€  |
    | Tinto verano  | 2,50€  |
    | Bocadillo     | 4,00€  |
  And se pueden añadir productos personalizados
```

---

#### US-080: Cierre de turno con arqueo
**RF Origen:** N4RF36  
**Prioridad:** Should

> Como **responsable de turno**,  
> quiero hacer arqueo al cerrar mi turno,  
> para verificar que el efectivo cuadra con las ventas.

**Criterios de Aceptación:**
```gherkin
Scenario: Proceso de arqueo
  Given un turno con ventas de 225€ y fondo inicial de 100€
  When el responsable hace arqueo:
    | concepto            | valor   |
    | Efectivo contado    | 320,00€ |
    | Fondo inicial       | 100,00€ |
    | Ventas registradas  | 225,00€ |
    | Efectivo esperado   | 325,00€ |
    | Diferencia          | -5,00€  |
  Then se detecta descuadre de 5€
  And se solicita explicación al responsable

Scenario: Cierre con firma
  Given el arqueo completado
  When el responsable confirma:
    | campo           | valor                        |
    | observaciones   | Posible error en cambio      |
    | firmaResponsable| ✓                            |
  Then el turno se cierra
  And queda registro del descuadre
  And el efectivo se entrega al siguiente turno o tesorero

Scenario: Turno sin descuadre
  Given arqueo donde efectivo coincide con esperado
  Then el cierre es limpio
  And no se requiere explicación adicional
```

---

#### US-081: Balance consolidado de evento
**RF Origen:** N4RF37  
**Prioridad:** Should

> Como **tesorero**,  
> quiero ver el balance consolidado de todos los turnos de un evento,  
> para conocer el resultado económico total.

**Criterios de Aceptación:**
```gherkin
Scenario: Consolidación de turnos
  Given evento "Fiestas 2025" con 12 turnos cerrados
  When el tesorero consulta el balance
  Then ve resumen:
    | concepto              | valor        |
    | Turnos totales        | 12           |
    | Ventas totales        | 8.500,00€    |
    | Descuadres totales    | -15,00€      |
    | Gastos aprovisionamiento| 2.800,00€  |
    | Beneficio neto        | 5.685,00€    |

Scenario: Detalle por turno
  Given el balance consolidado
  When el tesorero despliega detalle
  Then ve cada turno con:
    | turno | responsable    | ventas   | descuadre |
    | 1     | Pedro Martínez | 650,00€  | 0,00€     |
    | 2     | Ana López      | 720,00€  | -5,00€    |
    | ...   | ...            | ...      | ...       |
```

---

#### US-082: Cierre económico de evento
**RF Origen:** N4RF38  
**Prioridad:** Should

> Como **tesorero**,  
> quiero cerrar el evento y registrar el resultado en contabilidad,  
> para consolidar los ingresos del evento en las cuentas de la entidad.

**Criterios de Aceptación:**
```gherkin
Scenario: Cierre de evento con traspaso a contabilidad
  Given el evento "Fiestas 2025" con todos los turnos cerrados
  When el tesorero cierra el evento
  Then se genera asiento contable:
    | cuenta              | debe      | haber     |
    | Caja/Banco          | 5.685,00€ |           |
    | Ingresos eventos    |           | 8.500,00€ |
    | Gastos eventos      | 2.815,00€ |           |
  And el evento queda cerrado (no modificable)
  And se genera informe final del evento

Scenario: Validaciones pre-cierre
  Given el evento con turnos pendientes
  When el tesorero intenta cerrar
  Then el sistema bloquea:
    "Hay 2 turnos sin cerrar. Ciérrelos antes de consolidar."
```

---

### Resumen: BC-Treasury

| US | RF | Título | Prioridad |
|----|-----|--------|-----------|
| **Configuración de Cuotas** ||||
| US-043 | N4RF01 | Configuración de planes de cuota | Must |
| US-044 | N4RF01 | Vinculación de planes a tipos de socio | Must |
| US-045 | N4RF01 | Selección modalidad pago en alta | Must |
| US-046 | N4RF07 | Cambio de modalidad de pago | Should |
| US-047 | N4RF02 | Generación masiva cargos periódicos | Must |
| US-048 | N4RF03 | Prorrateo automático en altas | Should |
| US-049 | N4RF04 | Gestión descuentos en suscripciones | Must |
| US-050 | N4RF05 | Gestión de exenciones | Should |
| US-051 | N4RF01 | Cargo manual directo (sin suscripción) | Must |
| US-052 | N4RF01 | Histórico suscripciones del socio | Should |
| **Registro de Cobros** ||||
| US-053 | N4RF09 | Registro de cobros multi-método | Must |
| US-054 | N4RF10 | Gestión de estados de pago | Must |
| US-055 | N4RF11 | Información completa de cobro | Must |
| US-056 | N4RF12 | Adjuntar justificantes a pagos | Should |
| US-057 | N4RF13 | Generación automática de recibos | Must |
| **Morosidad** ||||
| US-058 | N4RF14 | Workflow de morosidad | Must |
| US-059 | N4RF15 | Plazos morosidad configurables | Should |
| US-060 | N4RF16 | Documentación automática morosidad | Should |
| **Remesas SEPA** ||||
| US-061 | N4RF17 | Generación ficheros SEPA | Must |
| US-062 | N4RF18 | Gestión identificador acreedor | Must |
| US-063 | N4RF19 | Gestión de mandatos SEPA | Must |
| US-064 | N4RF20 | Tipos secuencia SEPA automáticos | Must |
| US-065 | N4RF21 | Control plazos presentación | Should |
| US-066 | N4RF22 | Gestión devoluciones SEPA | Must |
| US-067 | N4RF23 | Exportación remesa banca online | Must |
| **Pasarela Online** ||||
| US-068 | N4RF24 | Generación enlaces de pago | Should |
| US-069 | N4RF25 | Pago mediante código QR | Could |
| US-070 | N4RF26 | Conciliación automática pagos | Should |
| US-071 | N4RF27 | Gestión comisiones pasarela | Could |
| **Contabilidad y Fiscalidad** ||||
| US-072 | N4RF28 | Libro de ingresos y gastos | Must |
| US-073 | N4RF29 | Plan de cuentas ENL | Could |
| US-074 | N4RF30 | Informes contables ENL | Should |
| US-075 | N4RF31 | Alertas obligaciones fiscales | Should |
| US-076 | N4RF32 | Control umbrales exención fiscal | Should |
| US-077 | N4RF33 | Exportación datos Modelo 182 | Should |
| **Caja por Turnos** ||||
| US-078 | N4RF34 | Apertura caja por turno | Should |
| US-079 | N4RF35 | Registro de ventas por turno | Should |
| US-080 | N4RF36 | Cierre de turno con arqueo | Should |
| US-081 | N4RF37 | Balance consolidado evento | Should |
| US-082 | N4RF38 | Cierre económico de evento | Should |

**Total:** 40 User Stories (18 Must, 19 Should, 3 Could)

---

## 4. BC-Events: Actividades y Participación

### 4.1 Registro y Tipos de Eventos

#### US-083: Registro de eventos
**RF Origen:** N5RF01  
**Prioridad:** Must

> Como **organizador**,  
> quiero crear eventos con toda la información relevante,  
> para que los socios conozcan las actividades planificadas.

**Criterios de Aceptación:**
```gherkin
Scenario: Creación de evento básico
  Given un organizador con permisos de gestión de eventos
  When crea un nuevo evento:
    | campo        | valor                          |
    | nombre       | Asamblea General Ordinaria     |
    | descripción  | Asamblea anual de la entidad   |
    | tipo         | Asamblea                       |
    | fechaInicio  | 2025-03-15 18:00               |
    | fechaFin     | 2025-03-15 21:00               |
    | ubicación    | Salón de actos, C/ Mayor 15    |
    | responsable  | Juan García (Presidente)       |
  Then el evento queda registrado
  And aparece en el calendario de la entidad
  And se emite evento EventoCreado

Scenario: Evento con aforo limitado
  Given la creación de un evento
  When se configura aforo:
    | campo        | valor              |
    | aforoMaximo  | 150                |
    | listaEspera  | true               |
  Then el sistema controla las plazas disponibles
  And muestra "150 plazas disponibles"

Scenario: Evento con precio de inscripción
  Given la creación de un evento
  When se configura precio:
    | campo        | valor              |
    | precio       | 25.00€             |
    | pagoAnticip  | true               |
  Then al inscribirse se genera cargo en BC-Treasury
  And la inscripción queda pendiente hasta confirmar pago

Scenario: Documentación asociada al evento
  Given un evento creado
  When el organizador adjunta documentos:
    | documento            | tipo        |
    | programa_evento.pdf  | Programa    |
    | normas_asistencia.pdf| Normativa   |
  Then los documentos quedan vinculados al evento
  And son accesibles para los socios inscritos
```

---

#### US-084: Tipos de eventos por colectividad
**RF Origen:** N5RF02  
**Prioridad:** Should

> Como **administrador**,  
> quiero configurar tipos de eventos específicos para mi colectividad,  
> para adaptar el sistema a nuestra tipología de actividades.

**Criterios de Aceptación:**
```gherkin
Scenario: Tipos de evento para cofradías
  Given una entidad configurada como "Cofradía"
  Then los tipos de evento disponibles incluyen:
    | tipo              | campos específicos                    |
    | Culto             | tipoActo (novena, triduo, besamanos)  |
    | Procesión         | recorrido, pasos, horaSalida          |
    | Junta Directiva   | ordenDelDía, quórum                   |
    | Ensayo costaleros | cuadrilla, paso, ubicación            |
    | Asamblea          | ordenDelDía, tipoAsamblea             |

Scenario: Tipos de evento para peñas
  Given una entidad configurada como "Peña"
  Then los tipos de evento disponibles incluyen:
    | tipo              | campos específicos                    |
    | Comida popular    | menús, alergias, precio               |
    | Fiesta patronal   | acto, ubicación, horario              |
    | Excursión         | destino, transporte, precio           |
    | Asamblea          | ordenDelDía, tipoAsamblea             |

Scenario: Tipos de evento para clubes deportivos
  Given una entidad configurada como "Club deportivo"
  Then los tipos de evento disponibles incluyen:
    | tipo              | campos específicos                    |
    | Entrenamiento     | categoría, ubicación, técnico         |
    | Partido           | rival, competición, convocatoria      |
    | Torneo            | formato, equipos, premios             |
    | Asamblea          | ordenDelDía, tipoAsamblea             |

Scenario: Tipos de evento para asociaciones culturales
  Given una entidad configurada como "Asociación cultural"
  Then los tipos de evento disponibles incluyen:
    | tipo              | campos específicos                    |
    | Taller            | materiales, nivel, plazas             |
    | Conferencia       | ponente, tema, duración               |
    | Excursión         | destino, transporte, precio           |
    | Asamblea          | ordenDelDía, tipoAsamblea             |

Scenario: Configuración de tipo personalizado
  Given un administrador en Configuración > Tipos de Evento
  When crea un nuevo tipo personalizado:
    | campo              | valor                  |
    | nombre             | Cata de vinos          |
    | requiereInscripción| true                   |
    | camposExtra        | bodega, tipoVino       |
  Then el nuevo tipo está disponible al crear eventos
```

---

### 4.2 Calendario y Sincronización

#### US-085: Calendario de actividades
**RF Origen:** N5RF03  
**Prioridad:** Must

> Como **socio**,  
> quiero ver un calendario con todos los eventos de mi entidad,  
> para planificar mi participación en las actividades.

**Criterios de Aceptación:**
```gherkin
Scenario: Vista mensual del calendario
  Given el calendario de la entidad
  When el socio accede a la vista mensual
  Then ve todos los eventos del mes
  And cada evento muestra: nombre, fecha, tipo, estado inscripción
  And los eventos se colorean por tipo

Scenario: Vista semanal del calendario
  Given el calendario de la entidad
  When el socio selecciona vista semanal
  Then ve los eventos de la semana con mayor detalle horario
  And puede hacer clic para ver detalles completos

Scenario: Vista de lista/agenda
  Given el calendario de la entidad
  When el socio selecciona vista lista
  Then ve los próximos eventos ordenados cronológicamente
  And muestra plazas disponibles si aplica

Scenario: Filtrado por tipo de evento
  Given múltiples eventos de diferentes tipos
  When el socio filtra por "Asambleas"
  Then solo ve eventos de tipo Asamblea
  And puede combinar filtros (tipo + mes)

Scenario: Eventos pasados vs futuros
  Given el calendario con historial
  When el socio consulta eventos pasados
  Then puede ver eventos anteriores en modo solo lectura
  And los eventos futuros permiten inscripción (si abierta)
```

---

#### US-086: Exportación a calendarios externos
**RF Origen:** N5RF04  
**Prioridad:** Should

> Como **socio**,  
> quiero exportar eventos a mi calendario personal,  
> para tener los eventos de la entidad junto con mis citas personales.

**Criterios de Aceptación:**
```gherkin
Scenario: Exportación individual en formato iCal
  Given un evento publicado
  When el socio pulsa "Añadir a mi calendario"
  Then se descarga fichero .ics con:
    | campo     | contenido                      |
    | SUMMARY   | Asamblea General Ordinaria     |
    | DTSTART   | 20250315T180000                |
    | DTEND     | 20250315T210000                |
    | LOCATION  | Salón de actos, C/ Mayor 15    |
    | DESCRIPTION| Asamblea anual de la entidad  |
  And el fichero es compatible con Google Calendar, Outlook, Apple Calendar

Scenario: Suscripción al calendario completo
  Given el calendario de la entidad
  When el socio copia la URL de suscripción iCal
  Then puede añadirla a su app de calendario
  And los nuevos eventos se sincronizan automáticamente
  And las modificaciones se reflejan en su calendario

Scenario: URL de suscripción personalizada por socio
  Given la suscripción al calendario
  Then la URL es única por socio (incluye token)
  And solo muestra eventos a los que tiene acceso
  And no expone información de otros socios
```

---

### 4.3 Inscripciones y Control de Aforo

#### US-087: Inscripción online a eventos
**RF Origen:** N5RF05  
**Prioridad:** Must

> Como **socio**,  
> quiero inscribirme a eventos desde el portal,  
> para no tener que contactar a la junta por WhatsApp o email.

**Criterios de Aceptación:**
```gherkin
Scenario: Inscripción básica a evento gratuito
  Given un evento con inscripción abierta y plazas disponibles
  When el socio pulsa "Inscribirme"
  Then se registra la inscripción
  And el socio recibe confirmación por email
  And las plazas disponibles se actualizan (-1)
  And se emite evento InscripcionRealizada

Scenario: Inscripción a evento de pago
  Given un evento con precio de 25€
  When el socio se inscribe
  Then se genera cargo en BC-Treasury
  And la inscripción queda en estado "Pendiente de pago"
  And se envía enlace de pago al socio
  And tras confirmar pago, inscripción pasa a "Confirmada"

Scenario: Inscripción con acompañantes
  Given un evento que permite acompañantes
  When el socio se inscribe con 2 acompañantes:
    | nombre           | relación    |
    | María García     | Cónyuge     |
    | Pedro García Jr  | Hijo        |
  Then se registran las 3 plazas
  And el cargo incluye importe de los 3

Scenario: Cancelación de inscripción
  Given un socio inscrito a un evento
  When cancela su inscripción antes de la fecha límite
  Then la inscripción pasa a "Cancelada"
  And se libera la plaza
  And si hay lista de espera, se notifica al siguiente
  And si había pago, se gestiona reembolso según política
```

---

#### US-088: Control de aforo en tiempo real
**RF Origen:** N5RF06  
**Prioridad:** Must

> Como **organizador**,  
> quiero que el sistema controle el aforo automáticamente,  
> para no superar la capacidad del evento.

**Criterios de Aceptación:**
```gherkin
Scenario: Visualización de plazas disponibles
  Given un evento con aforo máximo de 100 plazas
  And 75 inscripciones confirmadas
  Then el sistema muestra: "25 plazas disponibles"
  And la barra de ocupación indica 75%

Scenario: Bloqueo al completar aforo
  Given un evento con 1 plaza disponible
  When un socio se inscribe (ocupa la última plaza)
  Then el sistema muestra: "Aforo completo"
  And nuevas inscripciones van a lista de espera
  And se emite evento AforoCompletado

Scenario: Actualización en tiempo real
  Given varios socios consultando el mismo evento
  When uno se inscribe
  Then los demás ven las plazas actualizadas sin recargar
  And se previenen inscripciones duplicadas (optimistic locking)

Scenario: Reserva temporal de plaza
  Given un socio iniciando inscripción a evento de pago
  Then se reserva plaza temporalmente (15 minutos)
  And si no completa pago, la plaza se libera automáticamente
  And otro socio puede inscribirse
```

---

#### US-089: Lista de espera automática
**RF Origen:** N5RF07  
**Prioridad:** Should

> Como **socio**,  
> quiero apuntarme a lista de espera cuando no hay plazas,  
> para tener opción de asistir si alguien cancela.

**Criterios de Aceptación:**
```gherkin
Scenario: Inscripción en lista de espera
  Given un evento con aforo completo
  When el socio intenta inscribirse
  Then el sistema ofrece: "¿Desea apuntarse a lista de espera?"
  And si acepta, queda registrado con posición en cola
  And recibe confirmación: "Posición 3 en lista de espera"

Scenario: Visualización de posición
  Given un socio en lista de espera
  When consulta su inscripción
  Then ve:
    | estado           | Lista de espera   |
    | posición         | 3                 |
    | personas delante | 2                 |

Scenario: Movimiento en la cola
  Given 3 socios en lista de espera (pos 1, 2, 3)
  When el socio en posición 1 es admitido
  Then los demás avanzan: posición 2→1, 3→2
  And reciben notificación de su nueva posición
```

---

#### US-090: Notificación automática a lista de espera
**RF Origen:** N5RF08  
**Prioridad:** Should

> Como **sistema**,  
> quiero notificar automáticamente cuando hay plazas disponibles,  
> para que los socios en espera puedan confirmar rápidamente.

**Criterios de Aceptación:**
```gherkin
Scenario: Notificación al liberar plaza
  Given lista de espera con 3 socios
  When se cancela una inscripción confirmada
  Then se notifica al primer socio en espera:
    "¡Plaza disponible! Confirme su asistencia en 24h"
  And se le da plazo de 24h para confirmar
  And se emite evento PlazaLiberada

Scenario: Confirmación dentro del plazo
  Given un socio notificado de plaza disponible
  When confirma dentro del plazo
  Then su inscripción pasa a "Confirmada"
  And se genera cargo si el evento tiene precio
  And se notifica: "Inscripción confirmada"

Scenario: Expiración de plazo
  Given un socio notificado que no responde en 24h
  When expira el plazo
  Then se notifica al siguiente en lista de espera
  And el socio que no respondió:
    | opción A | Vuelve al final de la cola       |
    | opción B | Se elimina de lista (configurable)|
```

---

#### US-091: Cierre automático de inscripciones
**RF Origen:** N5RF09  
**Prioridad:** Should

> Como **organizador**,  
> quiero que las inscripciones se cierren automáticamente en fecha límite,  
> para no tener que cerrarlas manualmente.

**Criterios de Aceptación:**
```gherkin
Scenario: Configuración de fecha límite
  Given la creación de un evento
  When el organizador configura:
    | campo              | valor          |
    | fechaLimiteInscr   | 2025-03-10     |
    | horaLimite         | 23:59          |
  Then las inscripciones se cierran automáticamente el 10/03 a las 23:59

Scenario: Cierre automático
  Given fecha límite alcanzada
  When el sistema ejecuta el proceso de cierre
  Then el evento pasa a "Inscripciones cerradas"
  And nuevas inscripciones son rechazadas
  And el organizador recibe listado final de inscritos

Scenario: Cierre anticipado por aforo
  Given un evento que completa aforo antes de fecha límite
  Then las inscripciones directas se cierran
  And la lista de espera sigue activa hasta fecha límite
  And el organizador puede reabrir manualmente si hay bajas

Scenario: Reapertura manual
  Given inscripciones cerradas
  When el organizador reabre inscripciones
  Then se reactiva el formulario de inscripción
  And se puede configurar nueva fecha límite
```

---

#### US-092: Inscripción con pago vinculado
**RF Origen:** N5RF10  
**Prioridad:** Must

> Como **sistema**,  
> quiero generar automáticamente el cargo al inscribirse,  
> para mantener sincronizadas inscripciones y pagos.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de cargo al inscribirse
  Given un evento con precio de 35€
  When el socio completa la inscripción
  Then se crea Cargo en BC-Treasury:
    | campo        | valor                      |
    | memberId      | [socio inscrito]           |
    | concepto     | Inscripción: Comida Fiestas|
    | importe      | 35.00€                     |
    | esManual     | false                      |
    | eventoId     | [referencia al evento]     |
  And la inscripción queda "Pendiente de pago"

Scenario: Confirmación automática tras pago
  Given una inscripción pendiente de pago
  When BC-Treasury notifica pago confirmado (evento PagoCobrado)
  Then la inscripción pasa a "Confirmada"
  And el socio recibe confirmación definitiva

Scenario: Precio diferenciado por tipo de socio
  Given un evento con precios:
    | tipoSocio | precio |
    | Adulto    | 35€    |
    | Juvenil   | 25€    |
    | Infantil  | 15€    |
  When se inscribe un socio juvenil
  Then el cargo generado es de 25€

Scenario: Cancelación con reembolso
  Given inscripción pagada
  When el socio cancela antes del plazo de reembolso
  Then se registra solicitud de reembolso en BC-Treasury
  And el organizador aprueba/rechaza según política
```

---

#### US-093: Datos de inscripción configurables
**RF Origen:** N5RF11  
**Prioridad:** Should

> Como **organizador**,  
> quiero configurar qué datos pedir en cada inscripción,  
> para recoger la información específica que necesito.

**Criterios de Aceptación:**
```gherkin
Scenario: Campos básicos de inscripción
  Given cualquier inscripción
  Then se registra automáticamente:
    | campo            | origen           |
    | memberId          | Usuario logueado |
    | fechaInscripción | Automática       |
    | estado           | Según flujo      |

Scenario: Campos personalizados por evento
  Given un evento de comida popular
  When el organizador configura campos adicionales:
    | campo              | tipo        | obligatorio |
    | menúElegido        | select      | sí          |
    | alergias           | textarea    | no          |
    | necesidadesEspeciales| textarea  | no          |
  Then el formulario de inscripción incluye estos campos
  And se validan los obligatorios

Scenario: Opciones de menú con límite
  Given campos configurados con opciones:
    | campo        | opciones                        | límite   |
    | menúElegido  | Normal, Vegetariano, Infantil   | 20 veg   |
  When se alcanzan 20 inscripciones vegetarianas
  Then la opción "Vegetariano" se deshabilita
  And muestra: "Menú vegetariano agotado"

Scenario: Resumen de opciones para organizador
  Given inscripciones completadas
  When el organizador consulta el resumen
  Then ve consolidado:
    | menú        | cantidad |
    | Normal      | 85       |
    | Vegetariano | 20       |
    | Infantil    | 15       |
  And puede exportar para el catering
```

---

### 4.4 Check-in y Control de Asistencia

#### US-094: Check-in por QR
**RF Origen:** N5RF12  
**Prioridad:** Must

> Como **organizador**,  
> quiero registrar asistencia escaneando el QR del carnet,  
> para saber quién ha asistido realmente al evento.

**Criterios de Aceptación:**
```gherkin
Scenario: Check-in exitoso
  Given un evento con inscripciones confirmadas
  And el socio Juan García inscrito y al corriente de pago
  When el organizador escanea su QR con la app
  Then el sistema muestra:
    | campo        | valor                   |
    | nombre       | Juan García López       |
    | nºSocio      | 00142                   |
    | inscripción  | ✓ Confirmada            |
    | estado       | Al corriente de pago    |
    | foto         | [Foto del socio]        |
  And se registra check-in con hora actual
  And se marca visualmente como "Asistió"

Scenario: Check-in de socio no inscrito
  Given un socio que no está inscrito al evento
  When se escanea su QR
  Then el sistema muestra advertencia:
    "Socio no inscrito a este evento"
  And ofrece opción de inscripción rápida (si hay plazas)

Scenario: Check-in de socio con pago pendiente
  Given un socio inscrito pero con pago pendiente
  When se escanea su QR
  Then el sistema muestra:
    | estado       | ⚠️ Pendiente de pago    |
    | importe      | 35.00€                  |
  And ofrece opciones: "Permitir entrada" / "Cobrar ahora"

Scenario: QR de ejercicio anterior
  Given un socio con carnet del ejercicio pasado
  When se escanea el QR
  Then el sistema indica: "Carnet de ejercicio 2024. No válido para 2025"
  And busca si tiene carnet vigente
```

---

#### US-095: Check-in manual por lista
**RF Origen:** N5RF13  
**Prioridad:** Must

> Como **organizador**,  
> quiero marcar asistencia desde una lista,  
> para cuando no es posible escanear QR.

**Criterios de Aceptación:**
```gherkin
Scenario: Lista de inscritos con check-in
  Given el evento con 50 inscritos
  When el organizador accede a "Control de asistencia"
  Then ve lista con:
    | nº | nombre           | estado pago | asistió |
    | 1  | Ana López        | ✓ Pagado    | ☐       |
    | 2  | Juan García      | ✓ Pagado    | ☐       |
    | 3  | María Pérez      | ⚠️ Pendiente| ☐       |
  And puede marcar checkbox de asistencia

Scenario: Búsqueda rápida en lista
  Given una lista larga de inscritos
  When el organizador busca "García"
  Then se filtran solo los inscritos que coinciden
  And puede marcar check-in directamente

Scenario: Check-in offline
  Given problemas de conectividad en el evento
  When el organizador marca asistencias sin conexión
  Then se guardan localmente
  And se sincronizan cuando hay conexión
  And se resuelven conflictos (última escritura gana)
```

---

#### US-096: Registro de hora de entrada
**RF Origen:** N5RF14  
**Prioridad:** Should

> Como **sistema**,  
> quiero registrar la hora exacta de check-in,  
> para actividades que requieren control horario (formaciones subvencionadas).

**Criterios de Aceptación:**
```gherkin
Scenario: Registro automático de hora
  Given check-in de un socio (por QR o manual)
  Then se registra:
    | campo        | valor           |
    | memberId      | 00142           |
    | eventoId     | EVT-2025-015    |
    | horaCheckIn  | 2025-03-15 18:05|
    | método       | QR / Manual     |
    | registradoPor| org@entidad.es  |

Scenario: Múltiples check-ins (entrada/salida)
  Given un evento de formación de 4 horas
  When el organizador habilita "Control entrada/salida"
  Then cada socio puede tener:
    | acción  | hora  |
    | Entrada | 18:00 |
    | Salida  | 22:00 |
  And se calcula tiempo de permanencia: 4h 00m
```

---

#### US-097: Informe de asistencia
**RF Origen:** N5RF15  
**Prioridad:** Should

> Como **organizador**,  
> quiero un informe comparando inscritos vs asistentes,  
> para analizar la tasa de asistencia.

**Criterios de Aceptación:**
```gherkin
Scenario: Resumen de asistencia
  Given un evento finalizado con check-ins registrados
  When el organizador genera informe de asistencia
  Then ve:
    | métrica              | valor |
    | Inscritos            | 50    |
    | Asistentes           | 42    |
    | Tasa de asistencia   | 84%   |
    | No presentados       | 8     |

Scenario: Detalle de no presentados
  Given el informe de asistencia
  When el organizador consulta "No presentados"
  Then ve listado con:
    | socio           | estado pago | motivo (si informó) |
    | Pedro Martínez  | Pagado      | -                   |
    | Ana Ruiz        | Pagado      | Enfermedad          |
  And puede contactarles para futuras actividades

Scenario: Comparativa histórica
  Given múltiples ediciones del mismo evento
  When el organizador consulta histórico
  Then ve evolución:
    | edición | inscritos | asistentes | tasa |
    | 2023    | 45        | 38         | 84%  |
    | 2024    | 52        | 44         | 85%  |
    | 2025    | 50        | 42         | 84%  |
```

---

#### US-098: Exportación para justificación de subvenciones
**RF Origen:** N5RF16  
**Prioridad:** Should

> Como **organizador**,  
> quiero exportar listados de asistencia en formato oficial,  
> para justificar actividades subvencionadas.

**Criterios de Aceptación:**
```gherkin
Scenario: Exportación de listado con firmas
  Given un evento con asistencia registrada
  When el organizador exporta para subvención
  Then se genera PDF con:
    | columna        | contenido            |
    | Nº             | Correlativo          |
    | Nombre         | Nombre completo      |
    | DNI            | Censurado (***1234A) |
    | Hora entrada   | 18:05                |
    | Hora salida    | 22:00                |
    | Firma          | [Espacio firma]      |
  And incluye cabecera con datos del evento
  And pie con datos de la entidad y fecha

Scenario: Formato específico por convocatoria
  Given requisitos específicos de una subvención
  When el organizador selecciona plantilla "Gobierno de Aragón"
  Then el listado incluye campos adicionales requeridos:
    | campo adicional    |
    | Municipio          |
    | Fecha nacimiento   |
  And cumple con el formato oficial

Scenario: Exportación a Excel
  Given la necesidad de procesar datos
  When el organizador exporta a Excel
  Then se genera .xlsx con todos los campos
  And se pueden añadir columnas para firma escaneada
```

---

### 4.5 Eventos Específicos: Comidas Populares (Peñas)

#### US-099: Gestión de comidas populares
**RF Origen:** N5RF17  
**Prioridad:** Should

> Como **organizador de peña**,  
> quiero gestionar comidas populares con sus particularidades,  
> para controlar menús, alergias y cobro anticipado.

**Criterios de Aceptación:**
```gherkin
Scenario: Creación de evento de comida
  Given un organizador de peña
  When crea evento tipo "Comida popular":
    | campo           | valor                      |
    | nombre          | Comida de Fiestas 2025     |
    | fecha           | 2025-07-18 14:00           |
    | aforoMáximo     | 200                        |
    | precioBase      | 40.00€                     |
    | fechaLímiteInscr| 2025-07-10                 |
  Then se habilitan campos específicos de comida
  And se configura pago anticipado obligatorio

Scenario: Configuración de menús
  Given un evento de comida
  When el organizador define menús:
    | menú        | precio | plazas | descripción           |
    | Normal      | 40€    | 150    | Menú completo adulto  |
    | Vegetariano | 40€    | 30     | Sin carne             |
    | Infantil    | 25€    | 50     | Menú reducido <12 años|
  Then los socios eligen menú al inscribirse
  And el sistema controla plazas por menú

Scenario: Inscripción con selección de menú
  Given el evento de comida con menús configurados
  When un socio se inscribe:
    | campo        | valor       |
    | menú         | Vegetariano |
    | alergias     | Gluten      |
    | notas        | Sin sal     |
  Then se genera cargo de 40€
  And queda registrada la preferencia alimentaria
```

---

#### US-100: Control de alergias en eventos
**RF Origen:** N5RF18  
**Prioridad:** Should

> Como **organizador**,  
> quiero recoger y alertar sobre alergias alimentarias,  
> para garantizar la seguridad de los asistentes.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de alergias en inscripción
  Given un evento con comida
  When el socio se inscribe
  Then el formulario incluye:
    | campo                | tipo        |
    | Alergias alimentarias| multiselect |
    | Intolerancias        | multiselect |
    | Otras restricciones  | textarea    |
  And las opciones predefinidas incluyen: Gluten, Lactosa, Frutos secos, Mariscos, Huevo

Scenario: Alerta de alergias para organizador
  Given inscripciones con alergias registradas
  When el organizador consulta el resumen
  Then ve panel destacado:
    | alergia       | inscritos |
    | Gluten        | 5         |
    | Frutos secos  | 3         |
    | Lactosa       | 8         |
  And puede exportar listado detallado

Scenario: Información para catering
  Given el listado de alergias
  When se exporta para el catering
  Then incluye:
    | comensal        | menú        | alergias              |
    | Juan García     | Normal      | Gluten                |
    | María López     | Vegetariano | Frutos secos, Lactosa |
```

---

#### US-101: Lista de comensales para catering
**RF Origen:** N5RF19  
**Prioridad:** Should

> Como **organizador**,  
> quiero generar listado consolidado para el catering,  
> para hacer el pedido correctamente.

**Criterios de Aceptación:**
```gherkin
Scenario: Resumen de menús para pedido
  Given inscripciones cerradas
  When el organizador genera resumen para catering
  Then obtiene:
    | menú        | cantidad | notas                    |
    | Normal      | 120      | 5 sin gluten             |
    | Vegetariano | 25       | 3 sin frutos secos       |
    | Infantil    | 35       | 2 sin lactosa            |
    | TOTAL       | 180      |                          |

Scenario: Exportación detallada
  Given la necesidad del catering de listado nominal
  When el organizador exporta lista completa
  Then genera Excel con:
    | nº  | nombre        | menú        | alergias      | notas   |
    | 1   | Ana López     | Normal      | -             | -       |
    | 2   | Juan García   | Vegetariano | Gluten        | Sin sal |
    | ... | ...           | ...         | ...           | ...     |

Scenario: Cambios de última hora
  Given cambios en inscripciones después de enviar al catering
  When el organizador genera "Cambios desde [fecha]"
  Then ve solo las modificaciones:
    | acción      | comensal     | detalle                |
    | Nueva       | Pedro Ruiz   | Normal, sin alergias   |
    | Cancelada   | María Pérez  | Vegetariano            |
    | Modificada  | Ana López    | Añadida alergia: Huevo |
```

---

### 4.6 Eventos Específicos: Procesiones y Cultos (Cofradías)

#### US-102: Generación de papeletas de sitio
**RF Origen:** N5RF20  
**Prioridad:** Should

> Como **secretario de cofradía**,  
> quiero generar papeletas de sitio por antigüedad,  
> para organizar la procesión según tradición.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación automática por antigüedad
  Given 200 hermanos con derecho a procesionar
  And configuración de secciones de la procesión
  When el secretario genera papeletas
  Then se asignan posiciones por antigüedad estricta:
    | posición | hermano         | antigüedad | sección       |
    | 1        | José Martínez   | 45 años    | Cruz de guía  |
    | 2        | Ana García      | 42 años    | Estandarte    |
    | ...      | ...             | ...        | ...           |
  And solo se incluyen hermanos al corriente de pago
  And solo se incluyen hermanos tipo "Numerario"

Scenario: Exclusiones automáticas
  Given la generación de papeletas
  Then se excluyen automáticamente:
    | exclusión                  | motivo                    |
    | Socios tipo "Aspirante"    | Sin derechos plenos       |
    | Socios tipo "Honorario"    | No procesionan            |
    | Estado "PendientePago"     | Morosidad                 |
    | Estado "Suspendido"        | Sanción                   |

Scenario: Papeleta individual
  Given las posiciones asignadas
  When se genera papeleta de Juan García
  Then el PDF contiene:
    | campo              | valor                  |
    | Nombre             | Juan García López      |
    | Nº antigüedad      | 15                     |
    | Posición procesión | Paso del Cristo, fila 3|
    | Sección            | Hermanos de carga      |
    | Ejercicio          | 2025                   |
    | QR validación      | [QR único]             |
```

---

#### US-103: Reserva de insignias y varas
**RF Origen:** N5RF21  
**Prioridad:** Could

> Como **hermano**,  
> quiero solicitar reserva de insignia o vara,  
> para participar portando un elemento del cortejo.

**Criterios de Aceptación:**
```gherkin
Scenario: Catálogo de elementos reservables
  Given la configuración de la procesión
  Then existen elementos con reserva:
    | elemento          | cantidad | requisito antigüedad |
    | Cruz de guía      | 1        | 20 años              |
    | Estandarte        | 1        | 15 años              |
    | Varas de palio    | 8        | 10 años              |
    | Bocinas           | 4        | 5 años               |

Scenario: Solicitud de reserva
  Given un hermano con 12 años de antigüedad
  When solicita reserva de "Vara de palio"
  Then el sistema verifica requisitos
  And registra la solicitud
  And queda pendiente de aprobación por Junta

Scenario: Asignación por antigüedad
  Given múltiples solicitudes para el mismo elemento
  When la Junta procesa las reservas
  Then se asigna por orden de antigüedad
  And se notifica a los asignados y no asignados
```

---

#### US-104: Publicación de listas de procesión
**RF Origen:** N5RF22  
**Prioridad:** Should

> Como **secretario**,  
> quiero publicar las listas en fecha tradicional,  
> para mantener la tradición (típicamente Viernes de Dolores).

**Criterios de Aceptación:**
```gherkin
Scenario: Programación de publicación
  Given las papeletas generadas
  When el secretario programa publicación:
    | campo              | valor              |
    | fechaPublicación   | 2025-04-04 12:00   |
    | descripción        | Viernes de Dolores |
  Then las listas permanecen ocultas hasta esa fecha
  And a las 12:00 se publican automáticamente

Scenario: Notificación de publicación
  Given la publicación programada
  When llega la fecha/hora
  Then se notifica a todos los hermanos
  And cada uno puede consultar su papeleta en el portal
  And se habilita descarga de papeleta individual

Scenario: Lista pública vs privada
  Given la configuración de privacidad
  When se publican las listas
  Then la lista general (posición + nombre) es pública para hermanos
  And los datos personales (DNI, contacto) son privados
```

---

#### US-105: Gestión de cuadrillas de costaleros
**RF Origen:** N5RF23  
**Prioridad:** Could

> Como **capataz**,  
> quiero gestionar mi cuadrilla de costaleros,  
> para organizar ensayos y la salida procesional.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de cuadrilla
  Given un paso que requiere 24 costaleros
  When el capataz configura la cuadrilla:
    | campo           | valor              |
    | paso            | Paso del Cristo    |
    | costaleros      | 24                 |
    | relevos         | 12                 |
    | trabajaderas    | 6 (4 costaleros c/u)|
  Then la cuadrilla queda definida
  And se pueden asignar costaleros a posiciones

Scenario: Igualá digital
  Given un costalero candidato
  When se registra su igualá:
    | campo        | valor   |
    | altura       | 175 cm  |
    | posiciónPref | Delantera|
    | experiencia  | 5 años  |
  Then queda registrado para asignación
  And el capataz ve costaleros por altura

Scenario: Asignación a trabajadera
  Given costaleros con igualá registrada
  When el capataz asigna:
    | trabajadera | posición  | costalero       | altura |
    | 1-Delantera | Interior  | Juan García     | 175 cm |
    | 1-Delantera | Exterior  | Pedro López     | 176 cm |
  Then se valida homogeneidad de alturas
  And se genera listado de la cuadrilla
```

---

#### US-106: Notificaciones de ensayos
**RF Origen:** N5RF24  
**Prioridad:** Should

> Como **capataz**,  
> quiero convocar ensayos a mi cuadrilla,  
> para que confirmen asistencia.

**Criterios de Aceptación:**
```gherkin
Scenario: Convocatoria de ensayo
  Given una cuadrilla de 36 costaleros (24 + 12 relevos)
  When el capataz convoca ensayo:
    | campo        | valor              |
    | fecha        | 2025-04-01 21:00   |
    | ubicación    | Casa Hermandad     |
    | duración     | 2 horas            |
    | obligatorio  | true               |
  Then se notifica a los 36 costaleros
  And se solicita confirmación de asistencia

Scenario: Control de confirmaciones
  Given el ensayo convocado
  When los costaleros responden
  Then el capataz ve:
    | estado       | cantidad |
    | Confirmado   | 28       |
    | No puede     | 5        |
    | Sin respuesta| 3        |
  And puede contactar a los que no responden

Scenario: Registro de asistencia a ensayos
  Given el ensayo realizado
  When el capataz registra asistencia
  Then queda historial por costalero:
    | costalero     | ensayos convocados | asistencias | % |
    | Juan García   | 8                  | 7           | 88%|
```

---

#### US-107: Calendario de cultos
**RF Origen:** N5RF25  
**Prioridad:** Should

> Como **secretario de cofradía**,  
> quiero gestionar el calendario de cultos,  
> para organizar novenas, triduos, quinarios y besamanos.

**Criterios de Aceptación:**
```gherkin
Scenario: Tipos de culto predefinidos
  Given la configuración de cofradía
  Then existen tipos de culto:
    | tipo        | duración típica | descripción              |
    | Novena      | 9 días          | 9 días previos a fiesta  |
    | Triduo      | 3 días          | 3 días de preparación    |
    | Quinario    | 5 días          | 5 días de culto          |
    | Besamanos   | 1-3 días        | Veneración de imagen     |
    | Vía Crucis  | 1 día           | Estaciones               |

Scenario: Creación de novena
  Given el calendario de cultos
  When el secretario crea novena:
    | campo        | valor                    |
    | nombre       | Novena a Ntra. Sra.      |
    | fechaInicio  | 2025-03-06               |
    | fechaFin     | 2025-03-14               |
    | hora         | 20:00                    |
    | ubicación    | Iglesia de San Pedro     |
  Then se crean 9 eventos diarios automáticamente
  And aparecen en el calendario de la cofradía

Scenario: Publicación en calendario parroquial
  Given el calendario de cultos
  When se exporta para la parroquia
  Then se genera iCal con todos los actos religiosos
  And se puede compartir con la diócesis
```

---

#### US-108: Control de aforo en cultos
**RF Origen:** N5RF26  
**Prioridad:** Could

> Como **secretario**,  
> quiero controlar el aforo en besamanos multitudinarios,  
> para garantizar la seguridad y el orden.

**Criterios de Aceptación:**
```gherkin
Scenario: Besamanos con turnos horarios
  Given un besamanos de 2 días con aforo limitado a 100 personas/hora
  When el secretario configura:
    | día   | horario     | turnos        |
    | Sábado| 10:00-14:00 | 4 turnos/hora |
    | Sábado| 17:00-21:00 | 4 turnos/hora |
    | Domingo| 10:00-14:00| 4 turnos/hora |
  Then se habilita inscripción por turnos
  And cada turno tiene 100 plazas

Scenario: Inscripción a turno de besamanos
  Given turnos disponibles
  When un hermano se inscribe:
    | campo  | valor               |
    | turno  | Sábado 11:00-12:00  |
  Then queda reservada su plaza
  And recibe confirmación con hora asignada

Scenario: Control de acceso el día del besamanos
  Given los turnos con inscripciones
  When llega la hora del turno
  Then se permite acceso a los inscritos de ese turno
  And se registra asistencia por QR o lista
```

---

### 4.7 Eventos Específicos: Competiciones (Clubes)

#### US-109: Calendario de competición
**RF Origen:** N5RF27  
**Prioridad:** Should

> Como **coordinador deportivo**,  
> quiero gestionar el calendario de competiciones,  
> para organizar partidos, ligas y torneos.

**Criterios de Aceptación:**
```gherkin
Scenario: Tipos de competición
  Given un club deportivo
  Then existen tipos de evento deportivo:
    | tipo          | campos específicos                  |
    | Partido liga  | jornada, rival, competición, local  |
    | Partido copa  | eliminatoria, rival, ida/vuelta     |
    | Amistoso      | rival, ubicación                    |
    | Torneo        | formato, equipos, fases             |

Scenario: Creación de partido de liga
  Given el calendario de competición
  When el coordinador crea partido:
    | campo        | valor                    |
    | tipo         | Partido liga             |
    | competición  | 2ª Regional Grupo 3      |
    | jornada      | 15                       |
    | rival        | CD Alcañiz               |
    | fecha        | 2025-03-16 12:00         |
    | ubicación    | Campo Municipal          |
    | local        | true                     |
  Then el partido aparece en el calendario
  And se puede generar convocatoria

Scenario: Importación de calendario federativo
  Given el calendario publicado por la federación
  When el coordinador importa desde Excel/CSV
  Then se crean todos los partidos de la temporada
  And se pueden ajustar horarios posteriormente
```

---

#### US-110: Convocatoria de jugadores
**RF Origen:** N5RF28  
**Prioridad:** Should

> Como **entrenador**,  
> quiero convocar jugadores para partidos,  
> para que confirmen disponibilidad.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de convocatoria
  Given un partido programado
  And plantilla de 25 jugadores
  When el entrenador genera convocatoria:
    | campo              | valor      |
    | convocados         | 18         |
    | fechaLímiteResp    | 2025-03-14 |
  Then se notifica a los 18 convocados
  And se solicita confirmación de disponibilidad

Scenario: Límites por categoría
  Given convocatoria para partido de liga
  When el entrenador selecciona jugadores
  Then el sistema valida:
    | regla                          | límite |
    | Máximo jugadores convocados    | 18     |
    | Mínimo fichas del filial       | 0      |
    | Máximo fichas de superior      | 3      |
  And alerta si se superan límites

Scenario: Confirmación de jugadores
  Given la convocatoria enviada
  When los jugadores responden
  Then el entrenador ve:
    | estado       | jugadores |
    | Disponible   | 15        |
    | No disponible| 2         |
    | Sin respuesta| 1         |
  And puede ajustar convocatoria según respuestas

Scenario: Alerta de jugador sancionado
  Given un jugador con sanción pendiente
  When el entrenador intenta convocarlo
  Then el sistema alerta:
    "⚠️ Pedro López: Sancionado 1 partido (acumulación amarillas)"
  And bloquea su inclusión en convocatoria
```

---

#### US-111: Control de sanciones acumuladas
**RF Origen:** N5RF29  
**Prioridad:** Should

> Como **delegado**,  
> quiero llevar control de tarjetas y sanciones,  
> para evitar alineaciones indebidas.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de tarjetas
  Given un partido finalizado
  When el delegado registra incidencias:
    | jugador       | incidencia        | minuto |
    | Pedro López   | Tarjeta amarilla  | 35     |
    | Juan García   | Tarjeta amarilla  | 67     |
    | Pedro López   | Tarjeta amarilla  | 82     |
  Then Pedro López acumula 2 amarillas = Expulsión
  And se registra sanción automática: 1 partido

Scenario: Acumulación de amarillas
  Given el ciclo de sanciones configurado:
    | amarillas acumuladas | sanción          |
    | 5                    | 1 partido        |
    | 10                   | 2 partidos       |
  When un jugador llega a 5 amarillas en la temporada
  Then se genera sanción automática
  And se notifica al entrenador

Scenario: Panel de sanciones pendientes
  Given el delegado consulta sanciones
  Then ve:
    | jugador       | tipo              | partidos | cumplidos |
    | Pedro López   | Expulsión directa | 2        | 0         |
    | Ana García    | Acumulación (5)   | 1        | 1 (cumplida)|
  And los jugadores sancionados no pueden ser convocados

Scenario: Historial de sanciones
  Given un jugador con historial
  When se consulta su ficha
  Then ve todas las sanciones de la temporada:
    | fecha      | partido           | sanción           | cumplida |
    | 2025-01-15 | vs CD Alcañiz     | Amarilla (3ª)     | -        |
    | 2025-02-20 | vs UD Teruel      | Amarilla (4ª)     | -        |
    | 2025-03-10 | vs CF Calamocha   | Amarilla (5ª)     | 1 partido|
```

---

#### US-112: Registro de resultados y estadísticas
**RF Origen:** N5RF30  
**Prioridad:** Should

> Como **delegado**,  
> quiero registrar resultados y estadísticas de partidos,  
> para llevar histórico deportivo del club.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de resultado
  Given un partido finalizado
  When el delegado registra:
    | campo        | valor              |
    | resultado    | 3-1                |
    | local        | Club Local (3)     |
    | visitante    | CD Rival (1)       |
  Then el resultado queda registrado
  And se actualiza la clasificación (si integración)

Scenario: Registro de goleadores
  Given el resultado registrado
  When el delegado añade goleadores:
    | jugador       | goles | asistencias |
    | Pedro López   | 2     | 0           |
    | Juan García   | 1     | 1           |
    | Ana Ruiz      | 0     | 2           |
  Then se actualizan estadísticas individuales

Scenario: Estadísticas de temporada
  Given los partidos registrados
  When se consultan estadísticas
  Then se ve:
    | jugador       | PJ | Goles | Asist | Amarillas | Rojas |
    | Pedro López   | 15 | 12    | 3     | 4         | 0     |
    | Juan García   | 14 | 8     | 7     | 2         | 0     |
  And se pueden exportar para web/redes

Scenario: Acta de partido
  Given el partido con todos los datos
  When el delegado genera acta
  Then se crea PDF con:
    | sección              | contenido                    |
    | Datos partido        | Fecha, hora, campo, árbitro  |
    | Alineaciones         | Titulares y suplentes        |
    | Goles                | Minuto y autor               |
    | Tarjetas             | Minuto, jugador, tipo        |
    | Cambios              | Minuto, entra, sale          |
    | Resultado final      | 3-1                          |
```

---

### Resumen: BC-Events

| US | RF | Título | Prioridad |
|----|-----|--------|-----------|
| **Registro y Tipos** ||||
| US-083 | N5RF01 | Registro de eventos | Must |
| US-084 | N5RF02 | Tipos de eventos por colectividad | Should |
| **Calendario** ||||
| US-085 | N5RF03 | Calendario de actividades | Must |
| US-086 | N5RF04 | Exportación a calendarios externos | Should |
| **Inscripciones y Aforo** ||||
| US-087 | N5RF05 | Inscripción online a eventos | Must |
| US-088 | N5RF06 | Control de aforo en tiempo real | Must |
| US-089 | N5RF07 | Lista de espera automática | Should |
| US-090 | N5RF08 | Notificación a lista de espera | Should |
| US-091 | N5RF09 | Cierre automático de inscripciones | Should |
| US-092 | N5RF10 | Inscripción con pago vinculado | Must |
| US-093 | N5RF11 | Datos de inscripción configurables | Should |
| **Check-in y Asistencia** ||||
| US-094 | N5RF12 | Check-in por QR | Must |
| US-095 | N5RF13 | Check-in manual por lista | Must |
| US-096 | N5RF14 | Registro de hora de entrada | Should |
| US-097 | N5RF15 | Informe de asistencia | Should |
| US-098 | N5RF16 | Exportación para subvenciones | Should |
| **Comidas Populares (Peñas)** ||||
| US-099 | N5RF17 | Gestión de comidas populares | Should |
| US-100 | N5RF18 | Control de alergias en eventos | Should |
| US-101 | N5RF19 | Lista de comensales para catering | Should |
| **Procesiones y Cultos (Cofradías)** ||||
| US-102 | N5RF20 | Generación de papeletas de sitio | Should |
| US-103 | N5RF21 | Reserva de insignias y varas | Could |
| US-104 | N5RF22 | Publicación de listas de procesión | Should |
| US-105 | N5RF23 | Gestión de cuadrillas de costaleros | Could |
| US-106 | N5RF24 | Notificaciones de ensayos | Should |
| US-107 | N5RF25 | Calendario de cultos | Should |
| US-108 | N5RF26 | Control de aforo en cultos | Could |
| **Competiciones (Clubes)** ||||
| US-109 | N5RF27 | Calendario de competición | Should |
| US-110 | N5RF28 | Convocatoria de jugadores | Should |
| US-111 | N5RF29 | Control de sanciones acumuladas | Should |
| US-112 | N5RF30 | Registro de resultados y estadísticas | Should |

**Total:** 30 User Stories (7 Must, 20 Should, 3 Could)

---

## 5. BC-Communication: Notificaciones y Mensajería

### 5.1 Canales de Comunicación

#### US-113: Envío de comunicaciones por email
**RF Origen:** N6RF01  
**Prioridad:** Must

> Como **secretario**,  
> quiero enviar comunicaciones masivas por email a los socios,  
> para informar de forma oficial sin depender de WhatsApp.

**Criterios de Aceptación:**
```gherkin
Scenario: Envío de email a todos los socios
  Given el secretario en Comunicaciones > Nuevo envío
  When configura el email:
    | campo        | valor                          |
    | canal        | Email                          |
    | destinatarios| Todos los socios activos       |
    | asunto       | Convocatoria Asamblea 2025     |
    | cuerpo       | [Contenido con formato]        |
  And pulsa "Enviar"
  Then se encolan los emails para envío
  And se muestra progreso: "Enviando 340/340..."
  And al finalizar se registra en histórico

Scenario: Email con adjuntos
  Given la composición de un email
  When el secretario adjunta documentos:
    | documento            | tamaño  |
    | convocatoria.pdf     | 250 KB  |
    | orden_del_dia.pdf    | 120 KB  |
  Then los adjuntos se incluyen en el email
  And el tamaño total no supera 10 MB

Scenario: Previsualización antes de enviar
  Given el email configurado
  When el secretario pulsa "Previsualizar"
  Then ve el email tal como lo recibirá el socio
  And puede corregir antes de enviar

Scenario: Envío programado
  Given el email listo para enviar
  When el secretario programa envío:
    | fechaEnvio   | 2025-03-10 09:00  |
  Then el email queda programado
  And se enviará automáticamente en la fecha/hora indicada
```

---

#### US-114: Envío de SMS para urgencias
**RF Origen:** N6RF02  
**Prioridad:** Could

> Como **presidente**,  
> quiero poder enviar SMS para comunicaciones urgentes,  
> para llegar a socios que no consultan el email frecuentemente.

**Criterios de Aceptación:**
```gherkin
Scenario: Envío de SMS urgente
  Given una emergencia que comunicar
  When el presidente configura SMS:
    | campo        | valor                          |
    | canal        | SMS                            |
    | destinatarios| Junta Directiva                |
    | mensaje      | URGENTE: Reunión extraordinaria mañana 19h |
  Then se muestra coste estimado: "12 SMS × 0.08€ = 0.96€"
  And requiere confirmación antes de enviar

Scenario: Control de crédito SMS
  Given el saldo de SMS de la entidad
  When se consulta antes de enviar
  Then muestra: "Saldo: 500 SMS disponibles"
  And alerta si el envío supera el saldo

Scenario: Límite de caracteres
  Given la composición de un SMS
  When el mensaje supera 160 caracteres
  Then el sistema indica: "2 SMS por destinatario"
  And actualiza el coste estimado
```

---

#### US-115: Notificaciones push vía PWA
**RF Origen:** N6RF03  
**Prioridad:** Should

> Como **sistema**,  
> quiero enviar notificaciones push a los socios,  
> para comunicaciones instantáneas sin coste adicional.

**Criterios de Aceptación:**
```gherkin
Scenario: Envío de notificación push
  Given un socio con la PWA instalada y permisos de notificación
  When el sistema envía notificación:
    | campo        | valor                          |
    | título       | Nueva comunicación             |
    | cuerpo       | Se ha publicado la convocatoria|
    | acción       | Abrir comunicación             |
  Then el socio recibe notificación en su dispositivo
  And al pulsar, abre la PWA en la comunicación

Scenario: Socios sin PWA o sin permisos
  Given un envío por push
  When hay socios sin PWA instalada
  Then se registra como "No entregable"
  And se sugiere envío alternativo por email

Scenario: Gestión de suscripciones push
  Given un socio en su portal
  When accede a Preferencias > Notificaciones
  Then puede activar/desactivar notificaciones push
  And el cambio se aplica inmediatamente
```

---

#### US-116: Tablón de anuncios interno
**RF Origen:** N6RF04  
**Prioridad:** Should

> Como **secretario**,  
> quiero publicar anuncios en un tablón interno,  
> para que los socios vean información importante al acceder al portal.

**Criterios de Aceptación:**
```gherkin
Scenario: Publicación de anuncio
  Given el secretario en Tablón > Nuevo anuncio
  When publica:
    | campo            | valor                      |
    | título           | Fechas de Fiestas 2025     |
    | contenido        | Del 15 al 20 de julio...   |
    | destacado        | true                       |
    | fechaExpiracion  | 2025-07-21                 |
  Then el anuncio aparece en el tablón del portal
  And los destacados aparecen primero

Scenario: Visualización en portal del socio
  Given un socio que accede al portal
  Then ve el tablón de anuncios en la página principal
  And los anuncios más recientes primero
  And puede marcar "leído" para ocultar

Scenario: Expiración automática
  Given un anuncio con fecha de expiración
  When llega la fecha
  Then el anuncio se oculta automáticamente
  And queda en archivo para consulta histórica

Scenario: Anuncio con imagen
  Given la publicación de un anuncio
  When se adjunta imagen destacada
  Then se muestra como miniatura en el tablón
  And se puede ampliar al hacer clic
```

---

### 5.2 Segmentación y Plantillas

#### US-117: Segmentación de destinatarios
**RF Origen:** N6RF05  
**Prioridad:** Must

> Como **secretario**,  
> quiero segmentar los destinatarios de comunicaciones,  
> para enviar mensajes relevantes a cada grupo.

**Criterios de Aceptación:**
```gherkin
Scenario: Segmentación por tipo de socio
  Given la creación de una comunicación
  When el secretario selecciona destinatarios:
    | criterio      | valor        |
    | tipoSocio     | Numerario    |
  Then se calcula: "245 destinatarios"
  And se excluyen otros tipos (Aspirante, Honor, etc.)

Scenario: Segmentación por estado de pago
  Given la necesidad de contactar morosos
  When el secretario filtra:
    | criterio      | valor          |
    | estadoPago    | PendientePago  |
  Then se muestran solo socios con deuda pendiente

Scenario: Segmentación combinada
  Given criterios múltiples
  When el secretario combina:
    | criterio      | valor              |
    | tipoSocio     | Numerario          |
    | estadoPago    | AlCorriente        |
    | antiguedad    | >= 5 años          |
  Then se calcula la intersección: "182 destinatarios"

Scenario: Segmentos guardados
  Given un segmento usado frecuentemente
  When el secretario guarda el segmento:
    | nombre        | Socios veteranos activos |
  Then puede reutilizarlo en futuras comunicaciones
  And el segmento se recalcula dinámicamente

Scenario: Exclusión de destinatarios
  Given un segmento definido
  When el secretario excluye socios específicos
  Then esos socios no reciben la comunicación
  And queda registro de la exclusión
```

---

#### US-118: Plantillas de comunicación
**RF Origen:** N6RF06  
**Prioridad:** Should

> Como **secretario**,  
> quiero usar plantillas predefinidas,  
> para mantener consistencia en las comunicaciones.

**Criterios de Aceptación:**
```gherkin
Scenario: Plantillas de sistema
  Given las plantillas predefinidas
  Then existen plantillas para:
    | código              | descripción                    |
    | BIENVENIDA          | Email de alta de socio         |
    | RECORDATORIO_PAGO   | Aviso de cuota próxima         |
    | AVISO_DOMICILIACION | Notificación de cargo SEPA     |
    | CONVOCATORIA_EVENTO | Invitación a evento            |
    | RECORDATORIO_EVENTO | Recordatorio de evento próximo |
  And las plantillas de sistema no son editables

Scenario: Plantilla personalizada
  Given el secretario en Plantillas > Nueva
  When crea plantilla:
    | campo        | valor                          |
    | nombre       | Felicitación cumpleaños        |
    | asunto       | ¡Feliz cumpleaños, {{nombre}}! |
    | cuerpo       | Desde {{entidad}} te deseamos...|
  Then la plantilla queda disponible para uso

Scenario: Variables disponibles
  Given la edición de una plantilla
  Then puede usar variables:
    | variable           | descripción              |
    | {{nombre}}         | Nombre del socio         |
    | {{apellidos}}      | Apellidos del socio      |
    | {{numeroSocio}}    | Número de socio          |
    | {{entidad}}        | Nombre de la entidad     |
    | {{ejercicio}}      | Ejercicio actual         |
```

---

#### US-119: Personalización con datos del socio
**RF Origen:** N6RF07  
**Prioridad:** Should

> Como **sistema**,  
> quiero personalizar comunicaciones con datos del socio,  
> para que cada mensaje sea relevante y personal.

**Criterios de Aceptación:**
```gherkin
Scenario: Sustitución de variables
  Given una plantilla con variables:
    "Estimado/a {{nombre}}, tu número de socio es {{numeroSocio}}"
  When se envía a Juan García (nº 00142)
  Then el email recibido dice:
    "Estimado/a Juan, tu número de socio es 00142"

Scenario: Variable no disponible
  Given una variable que el socio no tiene (ej: teléfono vacío)
  When se procesa la plantilla
  Then la variable se sustituye por texto vacío o valor por defecto
  And se registra advertencia para revisión

Scenario: Previsualización con datos reales
  Given la previsualización de un envío
  When el secretario selecciona "Ver con datos de socio"
  Then puede elegir un socio de ejemplo
  And ve el mensaje con sus datos reales sustituidos
```

---

### 5.3 Histórico y Estadísticas

#### US-120: Histórico de comunicaciones
**RF Origen:** N6RF08  
**Prioridad:** Must

> Como **secretario**,  
> quiero consultar el histórico de comunicaciones,  
> para saber qué se envió, cuándo y a quién.

**Criterios de Aceptación:**
```gherkin
Scenario: Listado de comunicaciones enviadas
  Given el histórico de comunicaciones
  When el secretario accede a Comunicaciones > Histórico
  Then ve listado con:
    | fecha      | asunto                    | canal | destinatarios | estado   |
    | 04/02/2025 | Convocatoria Asamblea     | Email | 340           | Enviado  |
    | 01/02/2025 | Recordatorio cuotas       | Email | 52            | Enviado  |
    | 28/01/2025 | Urgente: cambio fecha     | SMS   | 12            | Enviado  |

Scenario: Detalle de comunicación
  Given una comunicación en el histórico
  When el secretario ve el detalle
  Then muestra:
    | campo              | valor                        |
    | Asunto             | Convocatoria Asamblea        |
    | Fecha envío        | 04/02/2025 10:30             |
    | Canal              | Email                        |
    | Destinatarios      | 340 socios                   |
    | Enviados           | 338                          |
    | Rebotados          | 2                            |
    | Aperturas          | 215 (64%)                    |
    | Enviado por        | Ana Pérez (Secretaria)       |

Scenario: Ver destinatarios de una comunicación
  Given el detalle de una comunicación
  When el secretario consulta "Ver destinatarios"
  Then ve lista de socios que la recibieron
  And puede filtrar por estado (entregado, rebotado, abierto)

Scenario: Histórico por socio
  Given la ficha de un socio
  When se consulta "Comunicaciones recibidas"
  Then ve todas las comunicaciones enviadas a ese socio
  And puede verificar si las recibió/abrió
```

---

#### US-121: Estadísticas de apertura de emails
**RF Origen:** N6RF09  
**Prioridad:** Should

> Como **secretario**,  
> quiero conocer las estadísticas de apertura,  
> para saber si los socios leen las comunicaciones.

**Criterios de Aceptación:**
```gherkin
Scenario: Tasa de apertura de email
  Given un email enviado hace 7 días
  When el secretario consulta estadísticas
  Then ve:
    | métrica              | valor    |
    | Enviados             | 340      |
    | Entregados           | 338      |
    | Rebotados            | 2        |
    | Abiertos             | 215      |
    | Tasa de apertura     | 63.6%    |
    | Clics en enlaces     | 45       |

Scenario: Evolución temporal de aperturas
  Given un email con tracking de apertura
  Then el sistema registra:
    | día        | aperturas acumuladas |
    | Día 1      | 180                  |
    | Día 2      | 200                  |
    | Día 3      | 210                  |
    | Día 7      | 215                  |

Scenario: Socios que no abren emails
  Given estadísticas de múltiples envíos
  When el secretario consulta "Socios inactivos"
  Then ve socios que no han abierto ningún email en 6 meses
  And puede contactarles por otro canal
```

---

### 5.4 Notificaciones Automáticas

#### US-122: Notificación de confirmación de alta
**RF Origen:** N6RF10  
**Prioridad:** Must

> Como **sistema**,  
> quiero enviar email de bienvenida al registrar un socio,  
> para confirmar el alta y dar información inicial.

**Criterios de Aceptación:**
```gherkin
Scenario: Email de bienvenida automático
  Given un nuevo socio registrado
  When BC-Membership emite evento SocioRegistrado
  Then BC-Communication envía email con:
    | elemento           | contenido                      |
    | Asunto             | ¡Bienvenido/a a [Entidad]!     |
    | Saludo             | Hola Juan,                     |
    | Contenido          | Tu alta ha sido registrada...  |
    | Nº socio           | 00142                          |
    | Acceso portal      | [Enlace para crear contraseña] |
    | Documentos adjuntos| Estatutos, guía del socio      |

Scenario: Configuración de plantilla de bienvenida
  Given la plantilla de bienvenida
  When el presidente la personaliza
  Then puede añadir mensaje personalizado
  And adjuntar documentos específicos de la entidad
```

---

#### US-123: Notificación de recordatorio de pago
**RF Origen:** N6RF11  
**Prioridad:** Should

> Como **sistema**,  
> quiero enviar recordatorio antes del vencimiento de cuotas,  
> para que los socios se preparen para el pago.

**Criterios de Aceptación:**
```gherkin
Scenario: Recordatorio antes de vencimiento
  Given configuración: recordatorio 7 días antes
  And un cargo con vencimiento el 15/02/2025
  When llega el 08/02/2025
  Then se envía email al socio:
    | elemento           | contenido                      |
    | Asunto             | Recordatorio: cuota próxima    |
    | Concepto           | Cuota Q1 2025                  |
    | Importe            | 24,50 €                        |
    | Vencimiento        | 15/02/2025                     |
    | Forma de pago      | Domiciliación bancaria         |

Scenario: Configuración de días de antelación
  Given la configuración de notificaciones
  When el tesorero ajusta:
    | notificación              | días antes |
    | Recordatorio de pago      | 7          |
    | Segundo recordatorio      | 3          |
  Then se aplica a futuros vencimientos
```

---

#### US-124: Notificación de recibo domiciliado
**RF Origen:** N6RF12  
**Prioridad:** Must

> Como **sistema**,  
> quiero avisar antes de pasar un recibo SEPA,  
> para que el socio tenga fondos y no haya sorpresas.

**Criterios de Aceptación:**
```gherkin
Scenario: Aviso previo a domiciliación
  Given una remesa SEPA programada para el 15/02
  And configuración: aviso 5 días antes
  When llega el 10/02/2025
  Then se envía email a todos los socios en la remesa:
    | elemento           | contenido                      |
    | Asunto             | Aviso: cargo en cuenta próximo |
    | Fecha cargo        | 15/02/2025                     |
    | Importe            | 24,50 €                        |
    | Concepto           | Cuota Q1 2025                  |
    | Cuenta             | ES91 2100 **** **** 1234       |

Scenario: Agrupación de avisos
  Given un socio con 2 cargos en la misma remesa
  Then recibe un único email con ambos conceptos:
    | concepto           | importe    |
    | Cuota Q1 2025      | 24,50 €    |
    | Inscripción evento | 35,00 €    |
    | TOTAL              | 59,50 €    |
```

---

#### US-125: Notificación de impago
**RF Origen:** N6RF13  
**Prioridad:** Must

> Como **sistema**,  
> quiero notificar automáticamente cuando se detecta un impago,  
> para iniciar el proceso de regularización.

**Criterios de Aceptación:**
```gherkin
Scenario: Aviso de devolución SEPA
  Given una devolución SEPA recibida
  When BC-Treasury emite evento PagoDevuelto
  Then se envía email al socio:
    | elemento           | contenido                      |
    | Asunto             | Incidencia con tu recibo       |
    | Motivo             | Fondos insuficientes (AM04)    |
    | Importe            | 24,50 €                        |
    | Acción requerida   | Contactar con tesorería        |
    | Plazo              | 15 días                        |

Scenario: Escalado de avisos según workflow de morosidad
  Given el workflow de morosidad configurado
  When se alcanza cada fase
  Then se envía la notificación correspondiente:
    | fase | días | tipo de aviso                    |
    | 1    | +30  | Recordatorio amistoso            |
    | 2    | +60  | Segundo aviso formal             |
    | 3    | +90  | Aviso de suspensión de derechos  |
```

---

#### US-126: Notificación de convocatoria de asamblea
**RF Origen:** N6RF14  
**Prioridad:** Must

> Como **sistema**,  
> quiero enviar convocatorias de asamblea con plazos correctos,  
> para cumplir con los requisitos estatutarios.

**Criterios de Aceptación:**
```gherkin
Scenario: Convocatoria con plazo estatutario
  Given una asamblea programada para el 15/03/2025
  And plazo estatutario de convocatoria: 15 días
  When el secretario programa la convocatoria
  Then el sistema advierte si la fecha es < 15 días antes
  And sugiere fecha de envío: 28/02/2025 o antes

Scenario: Contenido de la convocatoria
  Given la convocatoria de asamblea
  Then el email incluye:
    | elemento           | contenido                      |
    | Asunto             | Convocatoria Asamblea General  |
    | Tipo               | Ordinaria                      |
    | Fecha              | 15/03/2025 18:00               |
    | Lugar              | Salón de actos, C/ Mayor 15    |
    | 1ª convocatoria    | 18:00                          |
    | 2ª convocatoria    | 18:30                          |
    | Orden del día      | 1. Lectura acta anterior...    |
    | Adjunto            | orden_del_dia.pdf              |

Scenario: Segunda convocatoria recordatoria
  Given configuración de segundo recordatorio
  When faltan 3 días para la asamblea
  Then se envía recordatorio automático
```

---

#### US-127: Notificación de inscripción a evento
**RF Origen:** N6RF15  
**Prioridad:** Should

> Como **sistema**,  
> quiero confirmar automáticamente las inscripciones a eventos,  
> para que el socio tenga constancia de su registro.

**Criterios de Aceptación:**
```gherkin
Scenario: Confirmación de inscripción
  Given una inscripción a evento realizada
  When BC-Events emite evento InscripcionRealizada
  Then se envía email de confirmación:
    | elemento           | contenido                      |
    | Asunto             | Inscripción confirmada         |
    | Evento             | Comida de Fiestas 2025         |
    | Fecha              | 18/07/2025 14:00               |
    | Lugar              | Plaza Mayor                    |
    | Opciones           | Menú: Vegetariano              |
    | Importe            | 35,00 € (pendiente de pago)    |
    | QR entrada         | [Código QR para check-in]      |

Scenario: Confirmación tras pago
  Given inscripción pendiente de pago
  When se confirma el pago
  Then se envía segunda confirmación:
    "Tu inscripción está completa. ¡Te esperamos!"
```

---

#### US-128: Notificación de recordatorio de evento
**RF Origen:** N6RF16  
**Prioridad:** Should

> Como **sistema**,  
> quiero recordar eventos próximos a los inscritos,  
> para reducir el número de ausencias.

**Criterios de Aceptación:**
```gherkin
Scenario: Recordatorio automático
  Given un evento con fecha 18/07/2025
  And configuración: recordatorio 2 días antes
  When llega el 16/07/2025
  Then se envía a todos los inscritos:
    | elemento           | contenido                      |
    | Asunto             | Recordatorio: Comida de Fiestas|
    | Fecha              | Pasado mañana, 18/07 a las 14h |
    | Lugar              | Plaza Mayor                    |
    | Tu menú            | Vegetariano                    |
    | Notas              | Recuerda traer tu carnet       |

Scenario: Configuración de recordatorios por evento
  Given la configuración de un evento
  When el organizador define recordatorios:
    | días antes | canal         |
    | 7          | Email         |
    | 2          | Email + Push  |
    | 0 (día D)  | Push          |
  Then se programan los envíos automáticos
```

---

### Resumen: BC-Communication

| US | RF | Título | Prioridad |
|----|-----|--------|-----------|
| **5.1 Canales de Comunicación** ||||
| US-113 | N6RF01 | Envío de comunicaciones por email | Must |
| US-114 | N6RF02 | Envío de SMS para urgencias | Could |
| US-115 | N6RF03 | Notificaciones push vía PWA | Should |
| US-116 | N6RF04 | Tablón de anuncios interno | Should |
| **5.2 Segmentación y Plantillas** ||||
| US-117 | N6RF05 | Segmentación de destinatarios | Must |
| US-118 | N6RF06 | Plantillas de comunicación | Should |
| US-119 | N6RF07 | Personalización con datos del socio | Should |
| **5.3 Histórico y Estadísticas** ||||
| US-120 | N6RF08 | Histórico de comunicaciones | Must |
| US-121 | N6RF09 | Estadísticas de apertura de emails | Should |
| **5.4 Notificaciones Automáticas** ||||
| US-122 | N6RF10 | Notificación de confirmación de alta | Must |
| US-123 | N6RF11 | Notificación de recordatorio de pago | Should |
| US-124 | N6RF12 | Notificación de recibo domiciliado | Must |
| US-125 | N6RF13 | Notificación de impago | Must |
| US-126 | N6RF14 | Notificación de convocatoria asamblea | Must |
| US-127 | N6RF15 | Notificación de inscripción a evento | Should |
| US-128 | N6RF16 | Notificación de recordatorio evento | Should |

**Total:** 16 User Stories (7 Must, 8 Should, 1 Could)

---

## 6. BC-Documents: Gestión Documental

### 6.1 Libro de Actas

#### US-129: Gestión de libro de actas digital
**RF Origen:** N6RF17  
**Prioridad:** Must

> Como **secretario**,  
> quiero gestionar el libro de actas de forma digital,  
> para cumplir con la obligación legal (LO 1/2002) sin errores.

**Criterios de Aceptación:**
```gherkin
Scenario: Creación de nueva acta
  Given el secretario en Actas > Nueva acta
  When crea un acta:
    | campo        | valor                          |
    | tipo         | Asamblea General Ordinaria     |
    | fecha        | 2025-03-15                     |
    | lugar        | Salón de actos, C/ Mayor 15    |
  Then se asigna número correlativo automático: "ACTA-2025-003"
  And el número no puede modificarse

Scenario: Numeración correlativa automática
  Given actas existentes: ACTA-2025-001, ACTA-2025-002
  When se crea nueva acta en 2025
  Then se asigna: ACTA-2025-003
  When se crea primera acta de 2026
  Then se asigna: ACTA-2026-001

Scenario: Acta no editable tras aprobación
  Given un acta en estado "Borrador"
  When el presidente la aprueba
  Then pasa a estado "Aprobada"
  And no puede modificarse (solo adjuntar correcciones)
  And queda sellada con fecha de aprobación
```

---

#### US-130: Plantillas de actas por tipo de reunión
**RF Origen:** N6RF18  
**Prioridad:** Should

> Como **secretario**,  
> quiero usar plantillas según el tipo de reunión,  
> para mantener estructura homogénea en las actas.

**Criterios de Aceptación:**
```gherkin
Scenario: Plantilla de Asamblea General Ordinaria
  Given la creación de acta tipo "Asamblea General Ordinaria"
  Then la plantilla incluye secciones:
    | sección                              |
    | 1. Constitución de la Asamblea       |
    | 2. Lectura y aprobación del acta anterior |
    | 3. Informe de gestión de la Junta    |
    | 4. Aprobación de cuentas del ejercicio |
    | 5. Aprobación de presupuesto         |
    | 6. Ruegos y preguntas                |
    | 7. Cierre de la sesión               |

Scenario: Plantilla de Junta Directiva
  Given la creación de acta tipo "Junta Directiva"
  Then la plantilla incluye:
    | sección                              |
    | 1. Asistentes                        |
    | 2. Orden del día                     |
    | 3. Desarrollo de los puntos          |
    | 4. Acuerdos adoptados                |
    | 5. Cierre                            |

Scenario: Plantilla de Asamblea Extraordinaria
  Given la creación de acta tipo "Asamblea Extraordinaria"
  Then la plantilla enfatiza:
    | sección                              |
    | Motivo de la convocatoria            |
    | Punto único / Puntos específicos     |
    | Votación y resultado                 |
```

---

#### US-131: Campos obligatorios en actas
**RF Origen:** N6RF19  
**Prioridad:** Must

> Como **sistema**,  
> quiero validar que las actas tengan todos los campos obligatorios,  
> para evitar actas incompletas que puedan ser impugnadas.

**Criterios de Aceptación:**
```gherkin
Scenario: Validación de campos obligatorios
  Given un acta en borrador
  When el secretario intenta aprobar
  Then el sistema valida:
    | campo              | obligatorio | estado    |
    | Fecha y hora       | ✓           | ✓ OK      |
    | Lugar              | ✓           | ✓ OK      |
    | Asistentes         | ✓           | ✓ 45 reg. |
    | Orden del día      | ✓           | ✓ OK      |
    | Acuerdos           | ✓           | ⚠️ Vacío  |
    | Firma secretario   | ✓           | ⚠️ Falta  |
    | VºBº presidente    | ✓           | ⚠️ Falta  |
  And bloquea aprobación hasta completar

Scenario: Registro de acuerdos con votación
  Given la redacción de un acuerdo
  When se registra:
    | campo              | valor                      |
    | descripción        | Aprobar presupuesto 2025   |
    | votos a favor      | 42                         |
    | votos en contra    | 2                          |
    | abstenciones       | 1                          |
    | resultado          | Aprobado por mayoría       |
  Then el acuerdo queda registrado con trazabilidad
```

---

#### US-132: Registro de asistentes con firma
**RF Origen:** N6RF20  
**Prioridad:** Should

> Como **secretario**,  
> quiero registrar los asistentes a las reuniones,  
> para documentar quién participó en cada acta.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de asistentes desde listado
  Given los socios con derecho a voto
  When el secretario registra asistencia:
    | socio           | asiste | delegación en |
    | Juan García     | ✓      | -             |
    | María López     | ✓      | -             |
    | Pedro Martínez  | ✗      | Juan García   |
  Then se calcula: 2 presentes + 1 delegación = 3 votos

Scenario: Hoja de firmas digital
  Given el registro de asistentes
  When el secretario genera hoja de firmas
  Then se crea PDF con:
    | nº | nombre          | firma        |
    | 1  | Juan García     | [espacio]    |
    | 2  | María López     | [espacio]    |
  And puede imprimirse para firma física
  And luego escanearse y adjuntarse al acta

Scenario: Firma digital (opcional)
  Given dispositivo táctil disponible
  When el asistente firma en pantalla
  Then la firma se captura digitalmente
  And se asocia al registro de asistencia
```

---

#### US-133: Control de quórum
**RF Origen:** N6RF21  
**Prioridad:** Should

> Como **secretario**,  
> quiero que el sistema calcule el quórum automáticamente,  
> para saber si la reunión está válidamente constituida.

**Criterios de Aceptación:**
```gherkin
Scenario: Cálculo de quórum según estatutos
  Given configuración de quórum:
    | tipo reunión              | 1ª convocatoria | 2ª convocatoria |
    | Asamblea Ordinaria        | 50% + 1         | Sin mínimo      |
    | Asamblea Extraordinaria   | 2/3             | 50% + 1         |
    | Junta Directiva           | 50% + 1         | -               |
  And 200 socios con derecho a voto
  When hay 95 asistentes en 1ª convocatoria de Asamblea Ordinaria
  Then el sistema indica: "⚠️ No hay quórum (95/101 necesarios)"
  And sugiere pasar a 2ª convocatoria

Scenario: Quórum alcanzado
  Given Asamblea Ordinaria en 2ª convocatoria
  And 45 asistentes de 200 socios
  Then el sistema indica: "✓ Quórum válido (sin mínimo en 2ª conv.)"
  And permite continuar con la reunión

Scenario: Registro de quórum en acta
  Given el acta de la reunión
  Then se registra automáticamente:
    | dato                    | valor              |
    | Socios con derecho      | 200                |
    | Asistentes presentes    | 45                 |
    | Delegaciones            | 5                  |
    | Total votos             | 50                 |
    | Convocatoria            | 2ª                 |
    | Quórum                  | Válido             |
```

---

#### US-134: Archivo histórico de actas
**RF Origen:** N6RF22  
**Prioridad:** Must

> Como **socio**,  
> quiero consultar las actas históricas de mi entidad,  
> para conocer las decisiones tomadas en el pasado.

**Criterios de Aceptación:**
```gherkin
Scenario: Listado de actas aprobadas
  Given un socio con acceso al portal
  When consulta Documentos > Actas
  Then ve listado de actas aprobadas:
    | número        | tipo                    | fecha      |
    | ACTA-2025-002 | Asamblea Extraordinaria | 15/01/2025 |
    | ACTA-2025-001 | Junta Directiva         | 10/01/2025 |
    | ACTA-2024-012 | Asamblea Ordinaria      | 15/12/2024 |

Scenario: Búsqueda en actas
  Given el archivo de actas
  When el socio busca "presupuesto 2024"
  Then encuentra actas que mencionan ese término
  And muestra extracto con el texto resaltado

Scenario: Actas restringidas
  Given actas de Junta Directiva (confidenciales)
  When un socio ordinario consulta actas
  Then no ve las actas de Junta Directiva
  And solo ve actas de Asamblea (públicas para socios)
```

---

#### US-135: Exportación de actas a PDF
**RF Origen:** N6RF23  
**Prioridad:** Must

> Como **secretario**,  
> quiero exportar actas en formato PDF,  
> para archivo físico o envío oficial.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de PDF de acta
  Given un acta aprobada
  When el secretario exporta a PDF
  Then se genera documento con:
    | sección              | contenido                    |
    | Cabecera             | Logo, nombre entidad         |
    | Número               | ACTA-2025-003                |
    | Tipo y fecha         | Asamblea Ordinaria 15/03/25  |
    | Contenido            | [Texto completo del acta]    |
    | Acuerdos             | [Con resultados votaciones]  |
    | Firmas               | Secretario + VºBº Presidente |
    | Anexos               | Lista asistentes, delegaciones|

Scenario: PDF con marca de agua "COPIA"
  Given un acta exportada múltiples veces
  When se exporta para socio (no original)
  Then incluye marca de agua "COPIA"
  And el original sin marca solo lo genera el secretario
```

---

### 6.2 Repositorio de Documentos

#### US-136: Repositorio centralizado de documentos
**RF Origen:** N7RF01  
**Prioridad:** Must

> Como **directivo**,  
> quiero almacenar todos los documentos de la entidad en un lugar central,  
> para que no se pierdan con los cambios de junta.

**Criterios de Aceptación:**
```gherkin
Scenario: Subida de documento
  Given un directivo con permisos de documentos
  When sube un documento:
    | campo        | valor                          |
    | archivo      | estatutos_2024.pdf             |
    | nombre       | Estatutos vigentes             |
    | categoría    | Estatutos y reglamentos        |
    | descripción  | Aprobados en Asamblea 15/12/24 |
  Then el documento queda almacenado
  And se registra fecha y usuario que lo subió

Scenario: Acceso desde cualquier dispositivo
  Given documentos almacenados
  When un directivo accede desde el móvil
  Then puede ver y descargar los documentos
  And no necesita acceso al ordenador del tesorero anterior
```

---

#### US-137: Estructura de carpetas predefinida
**RF Origen:** N7RF02  
**Prioridad:** Should

> Como **sistema**,  
> quiero ofrecer una estructura de carpetas inicial,  
> para que los documentos estén organizados desde el principio.

**Criterios de Aceptación:**
```gherkin
Scenario: Estructura inicial
  Given una entidad recién creada
  Then tiene carpetas predefinidas:
    | carpeta                    | descripción                    |
    | Estatutos y reglamentos    | Documentos constitutivos       |
    | Actas de reuniones         | Enlace al módulo de actas      |
    | Documentación fiscal       | Modelos, certificados          |
    | Facturas y justificantes   | Gastos e ingresos              |
    | Subvenciones               | Solicitudes, justificaciones   |
    | Contratos y convenios      | Acuerdos con terceros          |
    | Seguros y pólizas          | RC, accidentes, local          |
    | Patrimonio                 | Inventarios, valoraciones      |
    | Comunicaciones oficiales   | Correspondencia institucional  |

Scenario: Subcarpetas personalizadas
  Given la estructura de carpetas
  When el administrador crea subcarpeta "Facturas 2025"
  Then la subcarpeta queda dentro de "Facturas y justificantes"
  And puede reorganizar documentos existentes
```

---

#### US-138: Metadatos de documentos
**RF Origen:** N7RF03  
**Prioridad:** Should

> Como **directivo**,  
> quiero añadir información descriptiva a cada documento,  
> para facilitar su búsqueda y clasificación.

**Criterios de Aceptación:**
```gherkin
Scenario: Metadatos al subir documento
  Given la subida de un documento
  Then se registran metadatos:
    | metadato           | origen     | ejemplo              |
    | nombreArchivo      | Automático | factura_0042.pdf     |
    | nombreDescriptivo  | Usuario    | Factura electricidad |
    | categoría          | Usuario    | Facturas             |
    | fechaDocumento     | Usuario    | 15/01/2025           |
    | fechaSubida        | Automático | 04/02/2025 10:30     |
    | subidoPor          | Automático | Ana Pérez            |
    | etiquetas          | Usuario    | luz, suministros     |
    | descripción        | Usuario    | Factura enero 2025   |

Scenario: Etiquetas personalizadas
  Given un documento con etiquetas
  When el usuario añade: "urgente", "pendiente de pago"
  Then puede filtrar documentos por estas etiquetas
```

---

#### US-139: Subida de documentos multi-formato
**RF Origen:** N7RF04  
**Prioridad:** Must

> Como **directivo**,  
> quiero subir documentos en cualquier formato habitual,  
> para almacenar toda la documentación independientemente de su origen.

**Criterios de Aceptación:**
```gherkin
Scenario: Formatos soportados
  Given la subida de documentos
  Then se aceptan formatos:
    | formato     | extensiones          | límite    |
    | Documentos  | .pdf, .doc, .docx    | 25 MB     |
    | Hojas cálculo| .xls, .xlsx, .csv   | 25 MB     |
    | Imágenes    | .jpg, .png, .gif     | 10 MB     |
    | Otros       | .zip, .txt           | 25 MB     |

Scenario: Validación de formato
  Given un archivo con extensión no permitida (.exe)
  When se intenta subir
  Then el sistema rechaza: "Formato no permitido"

Scenario: Compresión automática de imágenes
  Given una imagen de 8 MB
  When se sube al repositorio
  Then se comprime automáticamente si supera 2 MB
  And se mantiene calidad aceptable para visualización
```

---

#### US-140: Previsualización de documentos
**RF Origen:** N7RF05  
**Prioridad:** Should

> Como **directivo**,  
> quiero previsualizar documentos sin descargarlos,  
> para revisar rápidamente sin llenar mi dispositivo de archivos.

**Criterios de Aceptación:**
```gherkin
Scenario: Previsualización de PDF
  Given un documento PDF almacenado
  When el usuario pulsa "Ver"
  Then se muestra el PDF en el navegador
  And puede navegar entre páginas
  And tiene opción de descargar si necesita

Scenario: Previsualización de imágenes
  Given una imagen almacenada
  When el usuario pulsa "Ver"
  Then se muestra en un visor con zoom
  And puede rotar si es necesario

Scenario: Documentos sin previsualización
  Given un archivo .xlsx
  When el usuario pulsa "Ver"
  Then se ofrece descarga directa
  Y mensaje: "Este formato requiere aplicación externa"
```

---

#### US-141: Búsqueda de documentos
**RF Origen:** N7RF06  
**Prioridad:** Must

> Como **directivo**,  
> quiero buscar documentos por diversos criterios,  
> para encontrar rápidamente lo que necesito.

**Criterios de Aceptación:**
```gherkin
Scenario: Búsqueda por nombre
  Given documentos en el repositorio
  When el usuario busca "factura electricidad"
  Then encuentra documentos con ese texto en nombre o descripción

Scenario: Filtros combinados
  Given la búsqueda de documentos
  When el usuario aplica filtros:
    | filtro        | valor              |
    | categoría     | Facturas           |
    | fecha desde   | 01/01/2025         |
    | fecha hasta   | 31/01/2025         |
    | etiqueta      | luz                |
  Then solo ve documentos que cumplen todos los criterios

Scenario: Ordenación de resultados
  Given resultados de búsqueda
  When el usuario ordena por "Fecha documento desc"
  Then ve los más recientes primero
```

---

#### US-142: Permisos por carpeta
**RF Origen:** N7RF07  
**Prioridad:** Should

> Como **administrador**,  
> quiero controlar quién accede a qué documentos,  
> para proteger información confidencial.

**Criterios de Aceptación:**
```gherkin
Scenario: Permisos por rol
  Given la estructura de carpetas
  When se configuran permisos:
    | carpeta              | presidente | tesorero | secretario | socio |
    | Estatutos            | RW         | R        | RW         | R     |
    | Facturas             | R          | RW       | R          | -     |
    | Actas Junta          | RW         | R        | RW         | -     |
    | Actas Asamblea       | RW         | R        | RW         | R     |
  Then cada rol ve solo lo permitido
  (R=lectura, W=escritura, -=sin acceso)

Scenario: Documento confidencial
  Given un documento en carpeta restringida
  When un socio intenta acceder
  Then recibe: "No tiene permisos para ver este documento"
```

---

#### US-143: Límite de almacenamiento por plan
**RF Origen:** N7RF08  
**Prioridad:** Must

> Como **sistema**,  
> quiero controlar el espacio de almacenamiento usado,  
> para mantener la sostenibilidad del servicio.

**Criterios de Aceptación:**
```gherkin
Scenario: Visualización de uso
  Given el panel de administración
  Then muestra:
    | métrica              | valor         |
    | Espacio usado        | 2.3 GB        |
    | Espacio disponible   | 2.7 GB        |
    | Límite del plan      | 5 GB          |
    | % utilizado          | 46%           |

Scenario: Alerta de espacio bajo
  Given uso al 80% del límite
  Then se notifica al administrador:
    "El almacenamiento está al 80%. Considere liberar espacio o ampliar plan."

Scenario: Bloqueo al superar límite
  Given uso al 100% del límite
  When se intenta subir nuevo documento
  Then se bloquea: "Espacio agotado. Elimine documentos o amplíe plan."
```

---

#### US-144: Control de versiones de documentos
**RF Origen:** N7RF09  
**Prioridad:** Could

> Como **directivo**,  
> quiero mantener versiones anteriores de documentos,  
> para recuperar versiones si hay errores o para auditoría.

**Criterios de Aceptación:**
```gherkin
Scenario: Nueva versión de documento
  Given un documento "Estatutos" existente
  When el secretario sube nueva versión
  Then puede elegir: "Reemplazar" o "Nueva versión"
  And si elige "Nueva versión":
    | versión | fecha      | usuario    |
    | v3      | 04/02/2025 | Ana Pérez  |
    | v2      | 15/12/2024 | Juan García|
    | v1      | 01/01/2020 | Pedro López|

Scenario: Restaurar versión anterior
  Given múltiples versiones de un documento
  When el administrador restaura v2
  Then v2 se convierte en la versión actual
  And la versión reemplazada se mantiene en historial
```

---

#### US-145: OCR para facturas
**RF Origen:** N7RF10  
**Prioridad:** Could

> Como **tesorero**,  
> quiero que el sistema extraiga datos de facturas automáticamente,  
> para no tener que teclear toda la información.

**Criterios de Aceptación:**
```gherkin
Scenario: Extracción automática de datos
  Given una factura PDF subida
  When el sistema aplica OCR
  Then extrae:
    | campo           | valor extraído       | confianza |
    | Proveedor       | Iberdrola S.A.       | 95%       |
    | CIF proveedor   | A12345678            | 98%       |
    | Número factura  | 2025-00123           | 90%       |
    | Fecha           | 15/01/2025           | 95%       |
    | Base imponible  | 100,00 €             | 85%       |
    | IVA             | 21,00 €              | 85%       |
    | Total           | 121,00 €             | 90%       |
  And el tesorero revisa y confirma

Scenario: Datos no reconocidos
  Given factura con OCR parcial
  When algunos campos no se reconocen
  Then se marcan para introducción manual
  And el tesorero completa los vacíos
```

---

#### US-146: Búsqueda en contenido de documentos
**RF Origen:** N7RF11  
**Prioridad:** Could

> Como **directivo**,  
> quiero buscar dentro del contenido de los documentos,  
> para encontrar información aunque no recuerde el nombre del archivo.

**Criterios de Aceptación:**
```gherkin
Scenario: Búsqueda full-text
  Given documentos PDF con texto reconocible
  When el usuario busca "subvención cultura 2024"
  Then encuentra documentos que contienen esas palabras
  And muestra extracto con el texto resaltado

Scenario: Indexación de nuevos documentos
  Given un documento PDF recién subido
  When el sistema lo procesa
  Then extrae el texto e indexa para búsquedas
  And el documento es buscable en minutos
```

---

#### US-147: Vinculación de documentos con otros módulos
**RF Origen:** N7RF12  
**Prioridad:** Should

> Como **tesorero**,  
> quiero vincular documentos con registros de otros módulos,  
> para tener trazabilidad completa.

**Criterios de Aceptación:**
```gherkin
Scenario: Factura vinculada a gasto
  Given un gasto registrado en contabilidad
  When el tesorero adjunta la factura
  Then el documento queda vinculado al asiento contable
  And desde el gasto se puede ver la factura
  And desde la factura se puede ver el gasto

Scenario: Acta vinculada a asamblea
  Given una asamblea registrada en eventos
  When se genera el acta
  Then queda vinculada automáticamente al evento
  And desde el evento se accede al acta

Scenario: Justificante vinculado a cobro
  Given un cobro en tesorería
  When el tesorero adjunta justificante de transferencia
  Then el documento queda vinculado al cobro
  And sirve como respaldo ante disputas
```

---

### Resumen: BC-Documents

| US | RF | Título | Prioridad |
|----|-----|--------|-----|-----------|
| **6.1 Libro de Actas** ||||
| US-129 | N6RF17 | Gestión de libro de actas digital | Must |
| US-130 | N6RF18 | Plantillas de actas por tipo | Should |
| US-131 | N6RF19 | Campos obligatorios en actas | Must |
| US-132 | N6RF20 | Registro de asistentes con firma | Should |
| US-133 | N6RF21 | Control de quórum | Should |
| US-134 | N6RF22 | Archivo histórico de actas | Must |
| US-135 | N6RF23 | Exportación de actas a PDF | Must |
| **6.2 Repositorio de Documentos** ||||
| US-136 | N7RF01 | Repositorio centralizado | Must |
| US-137 | N7RF02 | Estructura de carpetas predefinida | Should |
| US-138 | N7RF03 | Metadatos de documentos | Should |
| US-139 | N7RF04 | Subida de documentos multi-formato | Must |
| US-140 | N7RF05 | Previsualización de documentos | Should |
| US-141 | N7RF06 | Búsqueda de documentos | Must |
| US-142 | N7RF07 | Permisos por carpeta | Should |
| US-143 | N7RF08 | Límite de almacenamiento por plan | Must |
| US-144 | N7RF09 | Control de versiones | Could |
| US-145 | N7RF10 | OCR para facturas | Could |
| US-146 | N7RF11 | Búsqueda en contenido | Could |
| US-147 | N7RF12 | Vinculación con otros módulos | Should |

**Total:** 19 User Stories (8 Must, 8 Should, 3 Could)

---

## 7. Transversal: Importación y Exportación

### 7.1 Importación de Datos

#### US-148: Importación de socios desde Excel/CSV
**RF Origen:** N8RF01  
**Prioridad:** Must

> Como **administrador**,  
> quiero importar listados de socios desde Excel o CSV,  
> para migrar los datos existentes sin teclear uno a uno.

**Criterios de Aceptación:**
```gherkin
Scenario: Importación desde Excel
  Given un archivo Excel con listado de socios
  When el administrador accede a Herramientas > Importar > Socios
  And sube el archivo "socios_2024.xlsx"
  Then el sistema analiza el archivo
  And muestra vista previa de las primeras 10 filas
  And detecta las columnas disponibles

Scenario: Importación desde CSV
  Given un archivo CSV con separador punto y coma
  When se sube "socios_export.csv"
  Then el sistema detecta automáticamente el separador
  And permite seleccionar codificación (UTF-8, ISO-8859-1)

Scenario: Requisitos mínimos de columnas
  Given el análisis del archivo
  Then el sistema indica campos obligatorios:
    | campo      | obligatorio | detectado |
    | Nombre     | ✓           | ✓         |
    | Apellidos  | ✓           | ✓         |
    | DNI/NIE    | ✓           | ⚠️        |
    | Email      | ✓           | ✓         |
  And advierte de campos obligatorios no detectados
```

---

#### US-149: Mapeo flexible de columnas
**RF Origen:** N8RF02  
**Prioridad:** Must

> Como **administrador**,  
> quiero mapear las columnas de mi archivo con los campos del sistema,  
> para importar datos aunque mi Excel tenga estructura diferente.

**Criterios de Aceptación:**
```gherkin
Scenario: Interfaz de mapeo
  Given las columnas detectadas del archivo
  When el administrador accede a "Mapear columnas"
  Then ve interfaz de correspondencia:
    | Columna Excel     | Campo Sistema     |
    | "Nombre socio"    | [Nombre ▼]        |
    | "Apellido 1"      | [Primer Apellido ▼]|
    | "DNI"             | [DNI/NIE ▼]       |
    | "Correo"          | [Email ▼]         |
  And puede seleccionar la correspondencia para cada columna

Scenario: Detección automática
  Given columnas con nombres estándar
  When el sistema analiza "Nombre", "Email", "Telefono"
  Then sugiere mapeo automático
  And el administrador puede ajustar si es incorrecto

Scenario: Columnas sin correspondencia
  Given una columna "Observaciones internas"
  When no existe campo equivalente en el sistema
  Then se puede mapear a "Campo personalizado"
  Or ignorar la columna

Scenario: Guardar configuración de mapeo
  Given un mapeo completo validado
  When el administrador guarda como "Plantilla Excel Anterior"
  Then puede reutilizarla en futuras importaciones
```

---

#### US-150: Validación previa con informe de errores
**RF Origen:** N8RF03  
**Prioridad:** Must

> Como **administrador**,  
> quiero validar los datos antes de importar,  
> para detectar errores y evitar contaminar la base de datos.

**Criterios de Aceptación:**
```gherkin
Scenario: Validación de formato de datos
  Given los datos mapeados
  When el sistema ejecuta validación
  Then genera informe:
    | fila | campo   | error                           |
    | 15   | DNI     | Formato inválido: "12345"       |
    | 23   | Email   | Formato inválido: "juan@"       |
    | 45   | Fecha   | Formato no reconocido: "15/2025"|
    | 67   | Tipo    | Valor no reconocido: "VIP"      |

Scenario: Validación de campos obligatorios
  Given registros con campos vacíos
  Then se detectan:
    | fila | campo     | error              |
    | 8    | Apellidos | Campo obligatorio  |
    | 12   | DNI       | Campo obligatorio  |

Scenario: Resumen de validación
  Given el informe completo
  Then muestra resumen:
    | Total registros | 400 |
    | Válidos         | 385 |
    | Con errores     | 15  |
    | % éxito         | 96% |
  And permite descargar informe en Excel

Scenario: Corrección antes de importar
  Given errores detectados
  When el administrador pulsa "Corregir en origen"
  Then puede descargar archivo con errores marcados
  And tras corrección, reimportar
```

---

#### US-151: Gestión de duplicados en importación
**RF Origen:** N8RF04  
**Prioridad:** Should

> Como **administrador**,  
> quiero que el sistema detecte duplicados durante la importación,  
> para evitar crear socios repetidos.

**Criterios de Aceptación:**
```gherkin
Scenario: Detección de duplicados por DNI
  Given un socio existente con DNI 12345678A
  And el archivo de importación contiene ese mismo DNI
  Then el sistema marca como duplicado:
    | fila | DNI        | existente        | acción sugerida |
    | 25   | 12345678A  | Juan García (42) | Ignorar         |

Scenario: Opciones de tratamiento de duplicados
  Given duplicados detectados
  Then el administrador puede elegir:
    | opción       | descripción                           |
    | Ignorar      | No importar el registro duplicado     |
    | Sobrescribir | Actualizar el existente con nuevos datos |
    | Crear nuevo  | Crear como socio diferente (advertencia) |

Scenario: Aplicar decisión global
  Given 20 duplicados detectados
  When el administrador elige "Ignorar todos"
  Then la opción se aplica a todos los duplicados
  And puede cambiar individualmente si necesita

Scenario: Detección por email cuando no hay DNI
  Given registros sin DNI pero con email
  Then el sistema usa email como criterio secundario
  And marca posibles duplicados por email coincidente
```

---

#### US-152: Importación de histórico de pagos
**RF Origen:** N8RF05  
**Prioridad:** Should

> Como **tesorero**,  
> quiero importar el histórico de pagos si lo tengo,  
> para mantener la trazabilidad de antigüedad y morosidad.

**Criterios de Aceptación:**
```gherkin
Scenario: Importación vinculada a socios
  Given socios ya importados en el sistema
  And archivo de histórico de pagos
  When se importa el histórico
  Then se vinculan pagos a socios por DNI o número de socio:
    | DNI        | Concepto      | Fecha      | Importe |
    | 12345678A  | Cuota 2023    | 15/01/2023 | 50,00 € |
    | 12345678A  | Cuota 2024    | 18/01/2024 | 55,00 € |

Scenario: Pagos sin socio asociado
  Given un pago con DNI no existente en el sistema
  Then el sistema advierte:
    "DNI 98765432B no encontrado - pago no importado"
  And permite importar sin vincular o ignorar

Scenario: Cálculo de morosidad tras importación
  Given histórico importado
  When se completa la importación
  Then el sistema recalcula estados:
    | socio       | último pago | estado     |
    | Juan García | 18/01/2024  | Al día     |
    | María López | 15/01/2022  | Moroso 2y  |
```

---

### 7.2 Exportación de Datos

#### US-153: Exportación de listado de socios
**RF Origen:** N8RF06  
**Prioridad:** Must

> Como **secretario**,  
> quiero exportar listados de socios filtrados,  
> para múltiples propósitos: Asamblea, banco, subvenciones.

**Criterios de Aceptación:**
```gherkin
Scenario: Exportación completa
  Given el listado de todos los socios activos
  When el secretario pulsa "Exportar"
  Then puede elegir campos a incluir:
    | campo         | incluir |
    | Nº socio      | ✓       |
    | Nombre        | ✓       |
    | Apellidos     | ✓       |
    | DNI           | ✓       |
    | Email         | ✓       |
    | Teléfono      | ✓       |
    | Tipo socio    | ✓       |
    | Fecha alta    | ✓       |
    | IBAN          | ☐       |

Scenario: Exportación con filtros
  Given filtros aplicados: tipo=Numerario, estado=Activo
  When se exporta
  Then solo incluye socios que cumplen los filtros

Scenario: Exportación para Asamblea
  Given la plantilla "Listado Asamblea"
  Then exporta: Nº, Nombre, Apellidos, Fecha alta
  And ordena por número de socio
  And incluye columna firma en blanco

Scenario: Exportación para banco
  Given la plantilla "Datos bancarios"
  Then exporta: Nombre completo, DNI, IBAN
  And solo socios con domiciliación activa
```

---

#### US-154: Exportación de informe de cuotas y pagos
**RF Origen:** N8RF07  
**Prioridad:** Must

> Como **tesorero**,  
> quiero exportar informes de cuotas y pagos por ejercicio,  
> para preparar la documentación de Asamblea.

**Criterios de Aceptación:**
```gherkin
Scenario: Informe de recaudación por ejercicio
  Given el ejercicio 2024 seleccionado
  When el tesorero exporta "Informe de cuotas"
  Then genera documento con:
    | Cuotas emitidas      | 18.500,00 € |
    | Cuotas cobradas      | 17.200,00 € |
    | Pendiente de cobro   |  1.300,00 € |
    | % recaudación        | 93%         |
    | Socios al corriente  | 344         |
    | Socios con deuda     | 26          |

Scenario: Detalle por socio
  Given el informe de cuotas
  Then incluye anexo con:
    | Nº    | Nombre       | Emitido  | Cobrado  | Pendiente |
    | 00042 | Juan García  | 55,00 €  | 55,00 €  | 0,00 €    |
    | 00043 | María López  | 55,00 €  | 0,00 €   | 55,00 €   |

Scenario: Comparativa con ejercicio anterior
  Given datos del ejercicio 2023
  Then incluye comparativa:
    | Métrica         | 2023    | 2024    | Variación |
    | Recaudado       | 16.800€ | 17.200€ | +2,4%     |
    | % recaudación   | 91%     | 93%     | +2pp      |
```

---

#### US-155: Exportación de libro de ingresos y gastos
**RF Origen:** N8RF08  
**Prioridad:** Should

> Como **tesorero**,  
> quiero exportar el libro de ingresos y gastos,  
> para archivo contable o revisión externa.

**Criterios de Aceptación:**
```gherkin
Scenario: Libro de ingresos y gastos
  Given movimientos contables del ejercicio
  When el tesorero exporta "Libro contable"
  Then genera documento con:
    | Fecha      | Concepto              | Categoría    | Ingreso | Gasto   | Saldo     |
    | 01/01/2024 | Saldo inicial         | -            | -       | -       | 5.230,00  |
    | 15/01/2024 | Cuotas Q1             | Cuotas       | 4.500,00| -       | 9.730,00  |
    | 20/01/2024 | Alquiler local        | Gastos fijos | -       | 350,00  | 9.380,00  |
    | ...        | ...                   | ...          | ...     | ...     | ...       |

Scenario: Resumen por categorías
  Given el libro completo
  Then incluye resumen:
    | Categoría      | Ingresos  | Gastos    |
    | Cuotas         | 17.200,00 | -         |
    | Subvenciones   | 3.000,00  | -         |
    | Eventos        | 2.500,00  | 1.800,00  |
    | Gastos fijos   | -         | 4.200,00  |
    | **TOTAL**      | 22.700,00 | 6.000,00  |
    | **Excedente**  |           | 16.700,00 |
```

---

#### US-156: Exportación de datos para Modelo 182
**RF Origen:** N8RF09  
**Prioridad:** Should

> Como **tesorero**,  
> quiero exportar los datos necesarios para el Modelo 182,  
> para cumplir con la declaración de donativos a Hacienda.

**Criterios de Aceptación:**
```gherkin
Scenario: Listado de donantes para Modelo 182
  Given la entidad es de utilidad pública
  And hay donaciones >150€ en el ejercicio
  When el tesorero exporta "Datos Modelo 182"
  Then genera archivo con formato AEAT:
    | NIF        | Apellidos y nombre   | Importe  | Deducción |
    | 12345678A  | García López, Juan   | 300,00 € | 80%       |
    | 87654321B  | Martínez Pérez, Ana  | 500,00 € | 80%       |

Scenario: Validación de NIF
  Given donantes con NIF incompleto
  Then el sistema advierte antes de exportar:
    "2 donantes sin NIF válido - no incluidos en la exportación"

Scenario: Filtro de importes
  Given donaciones de diversas cuantías
  Then solo exporta donaciones ≥150€ anuales por donante
  And agrupa si hay múltiples donaciones del mismo donante
```

---

#### US-157: Exportación de listado de asistentes a evento
**RF Origen:** N8RF10  
**Prioridad:** Should

> Como **organizador de evento**,  
> quiero exportar el listado de inscritos,  
> para catering, control de acceso y justificación de subvenciones.

**Criterios de Aceptación:**
```gherkin
Scenario: Listado para catering
  Given un evento con inscripciones con opciones de menú
  When se exporta "Listado para catering"
  Then genera:
    | Resumen menús        |     |
    | Normal               | 120 |
    | Vegetariano          | 25  |
    | Infantil             | 35  |
    | TOTAL                | 180 |
  And detalle: Nº, Nombre, Menú, Alergias, Notas

Scenario: Listado para control de acceso
  Given evento con check-in por QR
  When se exporta "Listado acceso"
  Then incluye: Nº socio, Nombre, QR (código), Estado pago

Scenario: Listado para subvención
  Given formato oficial de subvención
  When se exporta "Justificación asistencia"
  Then genera PDF con: Nº, Nombre, DNI censurado, Firma
  And cabecera con datos del evento y entidad
```

---

#### US-158: Exportación de histórico de comunicaciones
**RF Origen:** N8RF11  
**Prioridad:** Could

> Como **secretario**,  
> quiero exportar el histórico de comunicaciones,  
> para auditorías o respuesta a disputas.

**Criterios de Aceptación:**
```gherkin
Scenario: Histórico completo
  Given las comunicaciones del ejercicio
  When se exporta "Histórico comunicaciones"
  Then genera listado:
    | Fecha      | Tipo  | Asunto                 | Destinatarios | Estado  |
    | 04/02/2025 | Email | Convocatoria Asamblea  | 340           | Enviado |
    | 01/02/2025 | Email | Recordatorio cuotas    | 52            | Enviado |

Scenario: Detalle de envío específico
  Given una comunicación seleccionada
  When se exporta detalle
  Then incluye lista de destinatarios con estado individual
```

---

#### US-159: Formatos de exportación
**RF Origen:** N8RF12  
**Prioridad:** Must

> Como **usuario**,  
> quiero elegir el formato de exportación según el uso,  
> para trabajar con los datos de forma adecuada.

**Criterios de Aceptación:**
```gherkin
Scenario: Selección de formato
  Given cualquier exportación disponible
  When el usuario pulsa "Exportar"
  Then puede elegir formato:
    | formato | uso típico                    |
    | Excel   | Trabajo posterior, análisis   |
    | CSV     | Integración con otros sistemas|
    | PDF     | Presentación formal, archivo  |

Scenario: Excel con formato
  Given exportación a Excel
  Then aplica formato: cabeceras en negrita, columnas autoajustadas
  And nombre de archivo: "Socios_Entidad_20250204.xlsx"

Scenario: PDF con membrete
  Given exportación a PDF
  Then incluye membrete de la entidad (logo, nombre, CIF)
  And pie de página con fecha de generación
```

---

#### US-160: Backup periódico de datos
**RF Origen:** N8RF13  
**Prioridad:** Should

> Como **administrador**,  
> quiero poder descargar un backup completo de los datos,  
> para tener copia de seguridad propia de la entidad.

**Criterios de Aceptación:**
```gherkin
Scenario: Descarga de backup manual
  Given el administrador en Configuración > Backup
  When pulsa "Generar backup"
  Then el sistema genera archivo comprimido con:
    | contenido         | formato |
    | Socios            | CSV     |
    | Movimientos       | CSV     |
    | Documentos        | ZIP     |
    | Comunicaciones    | CSV     |
    | Configuración     | JSON    |

Scenario: Backup programado (notificación)
  Given configuración de backup automático
  When el administrador habilita "Backup semanal"
  Then recibe notificación con enlace de descarga cada semana
  And el enlace caduca en 7 días

Scenario: Información del backup
  Given el backup generado
  Then incluye archivo README con:
    | dato              | valor           |
    | Fecha generación  | 04/02/2025      |
    | Entidad           | Peña El Tambor  |
    | Registros socios  | 340             |
    | Tamaño total      | 45 MB           |
```

---

### Resumen: Importación y Exportación

| US | RF | Título | Prioridad |
|----|-----|--------|-----------|
| **7.1 Importación (N8)** ||||
| US-148 | N8RF01 | Importación de socios desde Excel/CSV | Must |
| US-149 | N8RF02 | Mapeo flexible de columnas | Must |
| US-150 | N8RF03 | Validación previa con informe de errores | Must |
| US-151 | N8RF04 | Gestión de duplicados en importación | Should |
| US-152 | N8RF05 | Importación de histórico de pagos | Should |
| **7.2 Exportación (N8)** ||||
| US-153 | N8RF06 | Exportación de listado de socios | Must |
| US-154 | N8RF07 | Exportación de informe de cuotas y pagos | Must |
| US-155 | N8RF08 | Exportación de libro de ingresos y gastos | Should |
| US-156 | N8RF09 | Exportación de datos para Modelo 182 | Should |
| US-157 | N8RF10 | Exportación de listado de asistentes | Should |
| US-158 | N8RF11 | Exportación de histórico de comunicaciones | Could |
| US-159 | N8RF12 | Formatos de exportación | Must |
| US-160 | N8RF13 | Backup periódico de datos | Should |

---

## 8. Transversal: Visibilidad y Reporting

### 8.1 Dashboard y KPIs

#### US-161: Dashboard principal
**RF Origen:** N9RF01  
**Prioridad:** Must

> Como **directivo**,  
> quiero ver un panel de control con métricas clave,  
> para conocer el estado de la entidad de un vistazo.

**Criterios de Aceptación:**
```gherkin
Scenario: Vista del dashboard al acceder
  Given un directivo que inicia sesión
  When accede al sistema
  Then ve el dashboard con widgets de resumen:
    | widget              | dato ejemplo        |
    | Socios activos      | 340 (+5 este mes)   |
    | Recaudación mes     | 2.450 € / 3.200 €   |
    | Próximo evento      | Asamblea (15/03)    |
    | Alertas pendientes  | 2                   |

Scenario: Actualización en tiempo real
  Given el dashboard visible
  When otro usuario registra un nuevo socio
  Then el contador de socios se actualiza sin recargar

Scenario: Período configurable
  Given los widgets con datos
  When el directivo cambia el período a "Último trimestre"
  Then los datos se recalculan para ese período
```

---

#### US-162: KPIs de socios
**RF Origen:** N9RF02  
**Prioridad:** Must

> Como **secretario**,  
> quiero ver indicadores de la masa social,  
> para detectar tendencias de crecimiento o pérdida.

**Criterios de Aceptación:**
```gherkin
Scenario: Widget de socios
  Given el dashboard del secretario
  Then ve KPIs de socios:
    | métrica                  | valor    |
    | Socios activos           | 340      |
    | vs ejercicio anterior    | +12 (+4%)|
    | Altas este ejercicio     | 25       |
    | Bajas este ejercicio     | 13       |
    | Distribución por tipo    | [gráfico]|

Scenario: Distribución por tipo de socio
  Given el widget de distribución
  Then muestra gráfico circular:
    | tipo       | cantidad | %    |
    | Numerario  | 280      | 82%  |
    | Juvenil    | 35       | 10%  |
    | Honorario  | 15       | 5%   |
    | Aspirante  | 10       | 3%   |
```

---

#### US-163: KPIs económicos
**RF Origen:** N9RF03  
**Prioridad:** Must

> Como **tesorero**,  
> quiero ver indicadores económicos actualizados,  
> para conocer el estado de recaudación sin calcular manualmente.

**Criterios de Aceptación:**
```gherkin
Scenario: Widget económico
  Given el dashboard del tesorero
  Then ve KPIs económicos:
    | métrica                | valor       |
    | Cuotas emitidas        | 18.500 €    |
    | Cuotas cobradas        | 17.200 €    |
    | % recaudación          | 93%         |
    | Pendiente de cobro     | 1.300 €     |
    | Morosos                | 26 (8%)     |

Scenario: Alerta de morosidad
  Given el % de morosos > 10%
  Then el widget muestra alerta en rojo
  And sugiere: "Ver listado de morosos"

Scenario: Ingresos vs gastos
  Given datos contables del ejercicio
  Then muestra:
    | concepto   | importe    |
    | Ingresos   | 22.700 €   |
    | Gastos     | 6.000 €    |
    | Excedente  | 16.700 €   |
```

---

#### US-164: KPIs de eventos
**RF Origen:** N9RF04  
**Prioridad:** Should

> Como **responsable de actividades**,  
> quiero ver indicadores de eventos próximos,  
> para conocer el nivel de participación.

**Criterios de Aceptación:**
```gherkin
Scenario: Widget de eventos
  Given el dashboard con eventos próximos
  Then muestra:
    | evento            | fecha    | inscritos | aforo | % |
    | Asamblea General  | 15/03    | 45        | -     | - |
    | Comida Fiestas    | 18/07    | 120       | 200   | 60%|
    | Excursión Teruel  | 25/04    | 35        | 40    | 88%|

Scenario: Alerta de aforo
  Given un evento al 90% de aforo
  Then muestra indicador naranja
  And al 100% muestra "COMPLETO" en rojo
```

---

#### US-165: Gráfico de evolución de socios
**RF Origen:** N9RF05  
**Prioridad:** Should

> Como **presidente**,  
> quiero ver la evolución de socios en los últimos años,  
> para detectar tendencias de crecimiento o declive.

**Criterios de Aceptación:**
```gherkin
Scenario: Gráfico de línea temporal
  Given datos históricos de 5 ejercicios
  Then muestra gráfico de línea:
    | ejercicio | socios |
    | 2020      | 310    |
    | 2021      | 295    |
    | 2022      | 305    |
    | 2023      | 328    |
    | 2024      | 340    |

Scenario: Detalle al hacer hover
  Given el gráfico de evolución
  When el usuario pasa el cursor sobre un punto
  Then muestra tooltip: "2023: 328 socios (+23 vs 2022)"
```

---

#### US-166: Gráfico de recaudación mensual
**RF Origen:** N9RF06  
**Prioridad:** Should

> Como **tesorero**,  
> quiero ver la recaudación mes a mes,  
> para identificar patrones estacionales.

**Criterios de Aceptación:**
```gherkin
Scenario: Gráfico de barras mensual
  Given recaudación del ejercicio actual
  Then muestra gráfico de barras por mes:
    | mes    | cobrado  | emitido  |
    | Enero  | 8.500 €  | 9.000 €  |
    | Febrero| 4.200 €  | 4.500 €  |
    | ...    | ...      | ...      |

Scenario: Comparativa con año anterior
  Given datos del ejercicio anterior
  Then puede superponer línea de comparación
  And tooltip muestra: "Feb 2024: 4.200 € vs Feb 2023: 3.800 € (+10%)"
```

---

#### US-167: Dashboard adaptado por rol
**RF Origen:** N9RF07  
**Prioridad:** Should

> Como **sistema**,  
> quiero mostrar dashboards adaptados a cada rol,  
> para que cada usuario vea la información relevante.

**Criterios de Aceptación:**
```gherkin
Scenario: Dashboard de tesorero
  Given un usuario con rol Tesorero
  Then su dashboard prioriza:
    | widget prioritario   |
    | KPIs económicos      |
    | Gráfico recaudación  |
    | Próximas remesas     |
    | Morosos destacados   |

Scenario: Dashboard de secretario
  Given un usuario con rol Secretario
  Then su dashboard prioriza:
    | widget prioritario     |
    | KPIs socios            |
    | Últimas altas/bajas    |
    | Comunicaciones recientes|
    | Próxima Asamblea       |

Scenario: Dashboard de socio
  Given un socio accediendo al portal
  Then ve dashboard simplificado:
    | widget                 |
    | Mi estado de cuotas    |
    | Próximos eventos       |
    | Últimos avisos         |
```

---

### 8.2 Informes Predefinidos

#### US-168: Informe de socios para Asamblea
**RF Origen:** N9RF08  
**Prioridad:** Must

> Como **secretario**,  
> quiero generar el informe de socios para Asamblea,  
> para presentar la situación de la masa social.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de informe
  Given el secretario en Informes > Asamblea
  When genera "Informe de socios"
  Then crea PDF con:
    | sección                    | contenido                    |
    | Resumen ejecutivo          | Socios activos, variación    |
    | Movimientos del ejercicio  | Altas, bajas, cambios        |
    | Distribución por tipo      | Tabla + gráfico              |
    | Evolución histórica        | Gráfico 5 años               |
    | Listado nominal (anexo)    | Opcional                     |

Scenario: Comparativa con ejercicio anterior
  Given datos del ejercicio anterior disponibles
  Then el informe incluye comparativas automáticas
```

---

#### US-169: Informe económico para Asamblea
**RF Origen:** N9RF09  
**Prioridad:** Must

> Como **tesorero**,  
> quiero generar el informe económico para Asamblea,  
> para presentar las cuentas del ejercicio.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de informe económico
  Given el tesorero en Informes > Asamblea
  When genera "Informe económico"
  Then crea PDF con:
    | sección                    | contenido                    |
    | Resumen ejecutivo          | Ingresos, gastos, excedente  |
    | Recaudación de cuotas      | Emitido vs cobrado, %        |
    | Desglose de ingresos       | Por categoría                |
    | Desglose de gastos         | Por categoría                |
    | Comparativa presupuestaria | Real vs presupuesto          |
    | Balance (si utilidad púb.) | Según PGC ENL                |
```

---

#### US-170: Certificado de estar al corriente de pago
**RF Origen:** N9RF10  
**Prioridad:** Must

> Como **socio**,  
> quiero obtener certificado de estar al corriente de pago,  
> para acceder a descuentos o acreditar mi condición.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación desde portal del socio
  Given un socio al corriente de pago
  When accede a "Mis documentos" > "Certificados"
  Then puede generar "Certificado de estar al corriente"
  And el PDF incluye:
    | dato               | valor                           |
    | Nombre socio       | Juan García López               |
    | Nº socio           | 00142                           |
    | DNI                | 12345***A                       |
    | Fecha              | 04/02/2025                      |
    | Texto              | "Está al corriente de sus       |
    |                    | obligaciones económicas..."     |
    | Firma digital      | [Sello entidad]                 |
    | Código verificación| ABC123XYZ                       |

Scenario: Socio con deuda pendiente
  Given un socio con cuotas impagadas
  When intenta generar certificado
  Then el sistema indica: "No disponible - deuda pendiente de 55,00 €"
  And sugiere regularizar situación

Scenario: Verificación de certificado
  Given un tercero con el código de verificación
  When accede a la URL pública de verificación
  Then puede comprobar autenticidad del certificado
```

---

#### US-171: Certificado de composición de Junta
**RF Origen:** N9RF11  
**Prioridad:** Should

> Como **secretario**,  
> quiero generar certificado de composición de Junta,  
> para presentar al Registro de Asociaciones.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de certificado
  Given la composición actual de la Junta Directiva
  When el secretario genera "Certificado Junta"
  Then crea PDF con formato oficial:
    | sección            | contenido                        |
    | Identificación     | Nombre entidad, CIF, Registro    |
    | Composición        | Cargo, Nombre, DNI, Fecha posesión|
    | Acuerdo origen     | Asamblea de fecha X              |
    | Certificación      | Texto legal                      |
    | Firmas             | Secretario + VºBº Presidente     |

Scenario: Formato Registro de Aragón
  Given entidad aragonesa
  Then el certificado sigue modelo oficial aragonés
  And incluye campos específicos del Decreto 260/2012
```

---

#### US-172: Memoria de actividades para subvenciones
**RF Origen:** N9RF12  
**Prioridad:** Should

> Como **presidente**,  
> quiero generar memoria de actividades,  
> para justificar subvenciones recibidas.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación de memoria
  Given eventos realizados en el período
  And gastos asociados registrados
  When se genera "Memoria de actividades"
  Then crea documento con:
    | sección                    | contenido                    |
    | Datos de la entidad        | Nombre, CIF, domicilio       |
    | Resumen de actividades     | Listado con fechas           |
    | Detalle por actividad      | Descripción, participantes   |
    | Recursos utilizados        | Humanos, materiales          |
    | Justificación económica    | Gastos, facturas             |
    | Valoración y conclusiones  | Objetivos cumplidos          |
    | Anexos                     | Fotos, listados asistencia   |

Scenario: Plantilla según convocatoria
  Given diferentes formatos de subvención
  When el presidente elige "Gobierno de Aragón - Cultura"
  Then se aplica plantilla con campos requeridos por esa convocatoria
```

---

### Resumen: Visibilidad y Reporting

| US | RF | Título | Prioridad |
|----|-----|--------|-----------|
| **8.1 Dashboard y KPIs (N9)** ||||
| US-161 | N9RF01 | Dashboard principal | Must |
| US-162 | N9RF02 | KPIs de socios | Must |
| US-163 | N9RF03 | KPIs económicos | Must |
| US-164 | N9RF04 | KPIs de eventos | Should |
| US-165 | N9RF05 | Gráfico de evolución de socios | Should |
| US-166 | N9RF06 | Gráfico de recaudación mensual | Should |
| US-167 | N9RF07 | Dashboard adaptado por rol | Should |
| **8.2 Informes (N9)** ||||
| US-168 | N9RF08 | Informe de socios para Asamblea | Must |
| US-169 | N9RF09 | Informe económico para Asamblea | Must |
| US-170 | N9RF10 | Certificado de estar al corriente | Must |
| US-171 | N9RF11 | Certificado de composición de Junta | Should |
| US-172 | N9RF12 | Memoria de actividades para subvenciones | Should |

---

## 9. Transversal: Portal del Socio

### 9.1 Acceso y Autenticación

#### US-173: Portal del socio (PWA)
**RF Origen:** N10RF01  
**Prioridad:** Must

> Como **socio**,  
> quiero acceder a un portal donde consultar mis datos,  
> para no tener que preguntar constantemente a la junta.

**Criterios de Aceptación:**
```gherkin
Scenario: Acceso al portal
  Given un socio con credenciales válidas
  When accede a portal.entidad.associated.app
  Then ve su página de inicio personalizada con:
    | sección              | contenido                    |
    | Bienvenida           | "Hola, Juan"                 |
    | Estado cuotas        | "Al corriente" / "Pendiente" |
    | Próximos eventos     | Listado de 3 próximos        |
    | Últimos avisos       | 2 comunicaciones recientes   |

Scenario: Diseño responsive
  Given acceso desde móvil
  Then la interfaz se adapta a pantalla pequeña
  And menú accesible desde hamburguesa
  And botones de tamaño táctil adecuado

Scenario: Navegación principal
  Given el portal del socio
  Then tiene menú con secciones:
    | sección          |
    | Inicio           |
    | Mis datos        |
    | Mis cuotas       |
    | Eventos          |
    | Documentos       |
    | Comunicaciones   |
    | Configuración    |
```

---

#### US-174: Acceso con email y contraseña
**RF Origen:** N10RF13  
**Prioridad:** Must

> Como **socio**,  
> quiero acceder con mi email y contraseña,  
> para un acceso seguro y tradicional.

**Criterios de Aceptación:**
```gherkin
Scenario: Login tradicional
  Given un socio con cuenta activada
  When introduce email y contraseña correctos
  Then accede al portal
  And se registra sesión con timestamp

Scenario: Primer acceso
  Given un socio sin contraseña establecida
  When recibe email de bienvenida
  Then el enlace permite crear contraseña
  And debe cumplir requisitos de seguridad (8+ chars, mayús, núm)

Scenario: Recuperación de contraseña
  Given un socio que olvidó su contraseña
  When pulsa "¿Olvidaste tu contraseña?"
  Then recibe email con enlace de restablecimiento
  And el enlace caduca en 24 horas
```

---

#### US-175: Acceso con enlace mágico
**RF Origen:** N10RF14  
**Prioridad:** Should

> Como **socio**,  
> quiero acceder sin recordar contraseña,  
> para un acceso sin fricción cuando no recuerdo mis credenciales.

**Criterios de Aceptación:**
```gherkin
Scenario: Solicitud de enlace mágico
  Given un socio en la página de login
  When introduce su email y pulsa "Enviar enlace de acceso"
  Then recibe email con enlace único
  And mensaje: "Te hemos enviado un enlace. Revisa tu correo."

Scenario: Uso del enlace mágico
  Given el email con enlace recibido
  When el socio pulsa el enlace
  Then accede directamente al portal sin contraseña
  And el enlace queda invalidado (uso único)

Scenario: Expiración del enlace
  Given un enlace mágico no utilizado
  When pasan 15 minutos
  Then el enlace expira
  And si se intenta usar, muestra: "Enlace caducado. Solicita uno nuevo."
```

---

### 9.2 Consultas del Socio

#### US-176: Consulta de datos personales
**RF Origen:** N10RF02  
**Prioridad:** Must

> Como **socio**,  
> quiero ver y solicitar modificación de mis datos,  
> para mantener mi información actualizada.

**Criterios de Aceptación:**
```gherkin
Scenario: Visualización de datos
  Given el socio en "Mis datos"
  Then ve su ficha con:
    | campo          | valor                    | editable |
    | Nombre         | Juan                     | No       |
    | Apellidos      | García López             | No       |
    | DNI            | 12345***A                | No       |
    | Email          | juan@email.com           | Sí       |
    | Teléfono       | 666123456                | Sí       |
    | Dirección      | C/ Mayor 15, 44001       | Sí       |
    | Nº socio       | 00142                    | No       |
    | Fecha alta     | 15/03/2018               | No       |

Scenario: Solicitud de modificación de datos no editables
  Given el socio quiere cambiar su nombre (error registro)
  When pulsa "Solicitar corrección"
  Then puede enviar mensaje al secretario
  And queda registro de la solicitud

Scenario: Modificación de datos editables
  Given el socio cambia su teléfono
  When guarda los cambios
  Then el dato se actualiza inmediatamente
  And recibe confirmación: "Datos actualizados correctamente"
```

---

#### US-177: Consulta de estado de cuotas
**RF Origen:** N10RF03  
**Prioridad:** Must

> Como **socio**,  
> quiero ver el estado de mis cuotas,  
> para saber si estoy al corriente sin preguntar al tesorero.

**Criterios de Aceptación:**
```gherkin
Scenario: Socio al corriente
  Given un socio sin deudas pendientes
  When accede a "Mis cuotas"
  Then ve:
    | estado     | ✅ Al corriente de pago |
    | próxima    | Q2 2025 - 30/06/2025    |
    | importe    | 55,00 €                 |

Scenario: Socio con deuda
  Given un socio con cuota impagada
  Then ve:
    | estado     | ⚠️ Pendiente de pago    |
    | deuda      | 55,00 €                 |
    | concepto   | Cuota Q1 2025           |
    | vencimiento| 15/01/2025 (vencido)    |

Scenario: Historial de pagos
  Given la sección de cuotas
  Then incluye historial:
    | concepto      | fecha pago | importe  | estado  |
    | Cuota Q4 2024 | 18/12/2024 | 55,00 €  | Pagado  |
    | Cuota Q3 2024 | 15/09/2024 | 55,00 €  | Pagado  |
    | ...           | ...        | ...      | ...     |
```

---

#### US-178: Descarga de recibos y justificantes
**RF Origen:** N10RF04  
**Prioridad:** Must

> Como **socio**,  
> quiero descargar mis recibos de pago,  
> para tener justificantes sin pedirlos al tesorero.

**Criterios de Aceptación:**
```gherkin
Scenario: Descarga de recibo
  Given un pago registrado
  When el socio pulsa "Descargar recibo"
  Then obtiene PDF con:
    | dato               | valor                    |
    | Nº recibo          | 2025-00142-001           |
    | Fecha emisión      | 15/01/2025               |
    | Concepto           | Cuota Q1 2025            |
    | Importe            | 55,00 €                  |
    | Estado             | PAGADO                   |
    | Fecha pago         | 18/01/2025               |
    | Forma de pago      | Domiciliación bancaria   |

Scenario: Descarga de certificado anual de cuotas
  Given pagos del ejercicio completo
  When el socio pulsa "Certificado anual"
  Then obtiene PDF resumen de todos los pagos del año
  And puede usarlo para desgravaciones fiscales
```

---

#### US-179: Acceso al carnet digital
**RF Origen:** N10RF05  
**Prioridad:** Must

> Como **socio**,  
> quiero acceder a mi carnet digital,  
> para identificarme sin llevar el carnet físico.

**Criterios de Aceptación:**
```gherkin
Scenario: Visualización del carnet
  Given el socio en "Mi carnet"
  Then ve carnet digital con:
    | elemento         | contenido                |
    | Logo entidad     | [imagen]                 |
    | Foto socio       | [imagen]                 |
    | Nombre           | Juan García López        |
    | Nº socio         | 00142                    |
    | Tipo             | Numerario                |
    | Validez          | 2025                     |
    | QR               | [código QR escaneable]   |

Scenario: Añadir a wallet del móvil
  Given el carnet digital
  When el socio pulsa "Añadir a Apple Wallet" / "Google Pay"
  Then el carnet se instala en el wallet del dispositivo
  And está disponible incluso sin conexión

Scenario: Descarga en PDF
  Given el carnet digital
  When el socio pulsa "Descargar PDF"
  Then obtiene versión imprimible del carnet
```

---

#### US-180: Consulta de calendario de eventos
**RF Origen:** N10RF06  
**Prioridad:** Should

> Como **socio**,  
> quiero ver el calendario de eventos,  
> para conocer las actividades de mi entidad.

**Criterios de Aceptación:**
```gherkin
Scenario: Vista de calendario
  Given el socio en "Eventos"
  Then ve calendario con eventos próximos
  And puede cambiar vista: mensual, semanal, lista

Scenario: Detalle de evento
  Given un evento en el calendario
  When el socio pulsa sobre él
  Then ve detalle:
    | dato           | valor                    |
    | Nombre         | Comida de Fiestas        |
    | Fecha          | 18/07/2025               |
    | Hora           | 14:00                    |
    | Lugar          | Plaza Mayor              |
    | Plazas         | 120/200 ocupadas         |
    | Precio         | 35,00 €                  |
    | Inscripción    | [Botón inscribirme]      |
```

---

#### US-181: Inscripción a eventos desde portal
**RF Origen:** N10RF07  
**Prioridad:** Should

> Como **socio**,  
> quiero inscribirme a eventos desde el portal,  
> para no tener que contactar a la junta.

**Criterios de Aceptación:**
```gherkin
Scenario: Inscripción a evento gratuito
  Given un evento sin coste con plazas disponibles
  When el socio pulsa "Inscribirme"
  Then queda inscrito inmediatamente
  And recibe confirmación por email

Scenario: Inscripción a evento de pago
  Given un evento con precio 35,00 €
  When el socio pulsa "Inscribirme"
  Then ve resumen con importe
  And puede elegir forma de pago
  And tras confirmar, genera cargo pendiente o pago inmediato

Scenario: Inscripción con opciones
  Given evento con campos adicionales (menú, alergias)
  When el socio se inscribe
  Then debe completar formulario:
    | campo      | opciones                    |
    | Menú       | Normal / Vegetariano        |
    | Alergias   | [texto libre]               |
```

---

#### US-182: Consulta de avisos y comunicaciones
**RF Origen:** N10RF08  
**Prioridad:** Should

> Como **socio**,  
> quiero consultar las comunicaciones recibidas,  
> para tener archivo accesible de avisos.

**Criterios de Aceptación:**
```gherkin
Scenario: Bandeja de comunicaciones
  Given el socio en "Comunicaciones"
  Then ve listado:
    | fecha      | asunto                     | leído |
    | 04/02/2025 | Convocatoria Asamblea      | ✓     |
    | 01/02/2025 | Recordatorio cuotas        | ✓     |
    | 15/01/2025 | Feliz año nuevo            | ✓     |

Scenario: Marcar como leído
  Given una comunicación nueva
  When el socio la abre
  Then se marca como leída
  And desaparece el indicador de "nueva"
```

---

#### US-183: Acceso a documentos públicos
**RF Origen:** N10RF09  
**Prioridad:** Should

> Como **socio**,  
> quiero acceder a documentos públicos de la entidad,  
> para consultar estatutos o actas sin solicitarlos.

**Criterios de Aceptación:**
```gherkin
Scenario: Documentos públicos disponibles
  Given el socio en "Documentos"
  Then ve documentos marcados como públicos:
    | documento                  | fecha      |
    | Estatutos vigentes         | 15/12/2024 |
    | Acta Asamblea 2024         | 20/03/2024 |
    | Reglamento interno         | 10/01/2020 |

Scenario: Descarga de documento
  Given un documento público
  When el socio pulsa "Descargar"
  Then obtiene el archivo original (PDF)
```

---

### 9.3 Configuración del Socio

#### US-184: Actualización de preferencias de comunicación
**RF Origen:** N10RF10  
**Prioridad:** Should

> Como **socio**,  
> quiero configurar cómo me contactan,  
> para recibir comunicaciones por mi canal preferido.

**Criterios de Aceptación:**
```gherkin
Scenario: Preferencias de canal
  Given el socio en "Configuración" > "Comunicaciones"
  Then puede configurar:
    | tipo comunicación      | email | push | SMS |
    | Cuotas y pagos         | ✓     | ✓    | ☐   |
    | Eventos                | ✓     | ✓    | ☐   |
    | Avisos generales       | ✓     | ☐    | ☐   |
    | Urgencias              | ✓     | ✓    | ✓   |

Scenario: Aplicación de preferencias
  Given preferencias guardadas
  When la entidad envía comunicación
  Then respeta los canales seleccionados por el socio
```

---

#### US-185: Gestión de consentimientos RGPD
**RF Origen:** N10RF11  
**Prioridad:** Must

> Como **socio**,  
> quiero gestionar mis consentimientos,  
> para tener control sobre el uso de mis datos.

**Criterios de Aceptación:**
```gherkin
Scenario: Visualización de consentimientos
  Given el socio en "Configuración" > "Privacidad"
  Then ve sus consentimientos:
    | consentimiento                     | estado | fecha       |
    | Comunicaciones de la entidad       | ✓      | 15/03/2018  |
    | Publicación de imagen en web/RRSS  | ✓      | 15/03/2018  |
    | Cesión a federación                | ☐      | -           |

Scenario: Revocación de consentimiento
  Given un consentimiento otorgado
  When el socio lo revoca
  Then se registra la revocación con fecha
  And se aplica inmediatamente (no más comunicaciones comerciales, etc.)

Scenario: Otorgamiento de nuevo consentimiento
  Given un consentimiento no otorgado
  When el socio lo acepta
  Then se registra con fecha y texto exacto del consentimiento
```

---

#### US-186: PWA instalable
**RF Origen:** N10RF12  
**Prioridad:** Should

> Como **socio**,  
> quiero instalar la app en mi móvil,  
> para acceso rápido como si fuera app nativa.

**Criterios de Aceptación:**
```gherkin
Scenario: Prompt de instalación
  Given un socio accediendo desde Chrome móvil
  When visita el portal por segunda vez
  Then aparece banner: "Añadir Associated a pantalla de inicio"

Scenario: Instalación exitosa
  Given el socio acepta instalar
  Then aparece icono en pantalla de inicio
  And al abrirlo, carga sin barra de navegador (standalone)

Scenario: Funcionamiento offline básico
  Given la PWA instalada
  When el socio pierde conexión
  Then puede ver su carnet digital (cacheado)
  And ve mensaje "Sin conexión" para otras funciones
```

---

#### US-187: Consentimiento para notificaciones push
**RF Origen:** N10RF15  
**Prioridad:** Should

> Como **sistema**,  
> quiero solicitar consentimiento para push,  
> para cumplir normativa y no molestar sin permiso.

**Criterios de Aceptación:**
```gherkin
Scenario: Solicitud de permiso
  Given un socio que accede por primera vez a la PWA
  When el sistema detecta soporte de notificaciones
  Then muestra mensaje explicativo:
    "¿Quieres recibir notificaciones de [Entidad]?"
  And botones: "Permitir" / "Ahora no"

Scenario: Aceptación de notificaciones
  Given el socio acepta
  Then se registra token de dispositivo
  And puede recibir push según sus preferencias

Scenario: Rechazo de notificaciones
  Given el socio rechaza
  Then no se vuelve a preguntar automáticamente
  And puede habilitarlo manualmente en Configuración
```

---

### Resumen: Portal del Socio

| US | RF | Título | Prioridad |
|----|-----|--------|-----------|
| **9.1 Portal Acceso (N10)** ||||
| US-173 | N10RF01 | Portal del socio (PWA) | Must |
| US-174 | N10RF13 | Acceso con email y contraseña | Must |
| US-175 | N10RF14 | Acceso con enlace mágico | Should |
| **9.2 Consultas Socio (N10)** ||||
| US-176 | N10RF02 | Consulta de datos personales | Must |
| US-177 | N10RF03 | Consulta de estado de cuotas | Must |
| US-178 | N10RF04 | Descarga de recibos y justificantes | Must |
| US-179 | N10RF05 | Acceso al carnet digital | Must |
| US-180 | N10RF06 | Consulta de calendario de eventos | Should |
| US-181 | N10RF07 | Inscripción a eventos desde Should |
| US-182 | N10RF08 | Consulta de avisos y comunicaciones | Should |
| US-183 | N10RF09 | Acceso a documentos públicos | Should |
| **9.3 Configuración Socio (N10)** ||||
| US-184 | N10RF10 | Actualización de preferencias comunicación | Should |
| US-185 | N10RF11 | Gestión de consentimientos RGPD | Must |
| US-186 | N10RF12 | PWA instalable | Should |
| US-187 | N10RF15 | Consentimiento para notificaciones push | Should |

---

## 10. Transversal: Cumplimiento Normativo

### 10.1 RGPD

#### US-188: Registro de Actividades de Tratamiento (RAT)
**RF Origen:** N11RF01  
**Prioridad:** Must

> Como **administrador**,  
> quiero mantener el RAT obligatorio,  
> para cumplir con RGPD como responsable de tratamiento.

**Criterios de Aceptación:**
```gherkin
Scenario: RAT precargado
  Given una entidad nueva
  Then tiene RAT precargado con tratamientos típicos:
    | actividad               | finalidad                  | datos        |
    | Gestión de socios       | Relación asociativa        | Identificat. |
    | Cobro de cuotas         | Gestión económica          | Bancarios    |
    | Comunicaciones          | Informar actividades       | Contacto     |
    | Eventos                 | Gestión inscripciones      | Identificat. |

Scenario: Personalización del RAT
  Given el RAT precargado
  When el administrador revisa y ajusta
  Then puede añadir/modificar/eliminar tratamientos
  And cada cambio queda versionado

Scenario: Exportación del RAT
  Given el RAT completo
  When se exporta
  Then genera documento PDF auditable
  And cumple formato AEPD
```

---

#### US-189: Gestión de consentimientos
**RF Origen:** N11RF02  
**Prioridad:** Must

> Como **sistema**,  
> quiero registrar consentimientos granulares,  
> para demostrar base jurídica ante inspección.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de consentimiento
  Given un socio que acepta uso de imagen
  Then se registra:
    | dato            | valor                              |
    | memberId         | 00142                              |
    | tipo            | USO_IMAGEN_RRSS                    |
    | texto           | "Autorizo el uso de mi imagen..."  |
    | fechaOtorgamiento| 04/02/2025 10:30:45               |
    | canal           | Portal socio                       |
    | IP              | 192.168.1.xxx                      |

Scenario: Consulta de consentimientos por socio
  Given la ficha de un socio
  When el secretario consulta "Consentimientos"
  Then ve histórico completo con fechas

Scenario: Exportación de evidencia
  Given una solicitud de auditoría
  Then se puede exportar evidencia del consentimiento
  And incluye: texto, fecha, medio de obtención
```

---

#### US-190: Ejercicio del derecho de acceso
**RF Origen:** N11RF03  
**Prioridad:** Must

> Como **socio**,  
> quiero ejercer mi derecho de acceso,  
> para obtener todos mis datos tratados por la entidad.

**Criterios de Aceptación:**
```gherkin
Scenario: Solicitud de acceso
  Given el socio en "Privacidad" > "Mis derechos"
  When solicita "Derecho de acceso"
  Then se registra la solicitud con timestamp
  And el administrador recibe notificación

Scenario: Generación del informe
  Given una solicitud de acceso
  When el administrador procesa
  Then el sistema genera paquete con:
    | contenido              | formato |
    | Datos personales       | JSON    |
    | Historial de pagos     | CSV     |
    | Comunicaciones recibidas| CSV    |
    | Consentimientos        | JSON    |
    | Eventos de auditoría   | CSV     |

Scenario: Entrega al interesado
  Given el paquete generado
  Then se notifica al socio
  And puede descargarlo desde el portal
  And queda registro de la entrega (cumplimiento plazo 1 mes)
```

---

#### US-191: Ejercicio del derecho de rectificación
**RF Origen:** N11RF04  
**Prioridad:** Should

> Como **socio**,  
> quiero solicitar rectificación de datos incorrectos,  
> para que mi información sea exacta.

**Criterios de Aceptación:**
```gherkin
Scenario: Solicitud de rectificación
  Given el socio detecta error en sus datos
  When solicita rectificación indicando:
    | campo incorrecto | valor actual    | valor correcto |
    | Apellido         | Garcia          | García         |
  Then se crea solicitud con workflow de aprobación

Scenario: Procesamiento de rectificación
  Given la solicitud recibida
  When el secretario la aprueba
  Then el dato se corrige
  And se notifica al socio
  And queda registro de la rectificación (antes/después)
```

---

#### US-192: Ejercicio del derecho de supresión
**RF Origen:** N11RF05  
**Prioridad:** Should

> Como **socio**,  
> quiero solicitar la supresión de mis datos,  
> para ejercer mi "derecho al olvido".

**Criterios de Aceptación:**
```gherkin
Scenario: Solicitud de supresión
  Given un socio dado de baja
  When solicita supresión de datos
  Then se analiza qué datos pueden suprimirse:
    | dato              | suprimible | motivo retención          |
    | Nombre, apellidos | No         | Obligación fiscal 4 años  |
    | Email             | Sí         | -                         |
    | Teléfono          | Sí         | -                         |
    | Historial pagos   | No         | Obligación contable       |
    | Foto              | Sí         | -                         |

Scenario: Ejecución parcial
  Given datos suprimibles identificados
  When se ejecuta la supresión
  Then los datos suprimibles se eliminan/anonimizan
  And los retenidos se mantienen con justificación
  And se notifica al interesado el resultado
```

---

#### US-193: Ejercicio del derecho de portabilidad
**RF Origen:** N11RF06  
**Prioridad:** Should

> Como **socio**,  
> quiero obtener mis datos en formato portátil,  
> para llevarlos a otra entidad si lo deseo.

**Criterios de Aceptación:**
```gherkin
Scenario: Exportación portátil
  Given solicitud de portabilidad
  When se procesa
  Then genera archivo con:
    | contenido                  | formato |
    | Datos proporcionados       | JSON    |
    | Datos generados (actividad)| JSON    |
  And NO incluye: inferencias, datos derivados

Scenario: Formato estándar
  Given el archivo generado
  Then cumple requisitos RGPD:
    - Formato estructurado
    - Lectura mecánica
    - Uso común (JSON, CSV)
```

---

#### US-194: Base jurídica para datos religiosos
**RF Origen:** N11RF07  
**Prioridad:** Should

> Como **sistema**,  
> quiero configurar base jurídica específica para cofradías,  
> para tratar datos de convicciones religiosas legalmente.

**Criterios de Aceptación:**
```gherkin
Scenario: Configuración de cofradía
  Given una entidad de tipo "Cofradía"
  When el administrador activa "Tratamiento datos religiosos"
  Then el sistema:
    - Registra base jurídica art. 9.2.d RGPD
    - Limita tratamiento a miembros actuales/antiguos
    - Bloquea comunicación externa sin consentimiento
    - Aplica medidas de seguridad reforzadas

Scenario: Limitación de acceso
  Given datos religiosos almacenados
  Then solo son accesibles por roles autorizados
  And quedan cifrados en base de datos
```

---

### 10.2 Ley Orgánica 1/2002

#### US-195: Libro de socios digital
**RF Origen:** N11RF08  
**Prioridad:** Must

> Como **secretario**,  
> quiero generar el Libro de Socios obligatorio,  
> para cumplir con la LO 1/2002.

**Criterios de Aceptación:**
```gherkin
Scenario: Generación del libro
  Given el listado actualizado de socios
  When el secretario genera "Libro de socios"
  Then crea documento con:
    | nº   | nombre           | DNI        | fecha alta | fecha baja |
    | 0001 | Juan García      | 12345***A  | 15/03/2010 | -          |
    | 0002 | María López      | 87654***B  | 20/05/2012 | 10/01/2024 |
    | ...  | ...              | ...        | ...        | ...        |

Scenario: Actualización continua
  Given altas y bajas registradas
  Then el libro se mantiene actualizado automáticamente
  And puede generarse en cualquier momento con datos actuales
```

---

#### US-196: Inventario de bienes
**RF Origen:** N11RF10  
**Prioridad:** Should

> Como **administrador**,  
> quiero mantener inventario de bienes,  
> para cumplir con la obligación legal de libro de inventario.

**Criterios de Aceptación:**
```gherkin
Scenario: Registro de bien
  Given el administrador en "Inventario"
  When registra un bien:
    | campo           | valor                    |
    | descripción     | Proyector Epson EB-X51   |
    | categoría       | Equipamiento             |
    | fecha adquisición| 15/06/2023              |
    | valor           | 450,00 €                 |
    | ubicación       | Local social             |
    | estado          | Bueno                    |
    | foto            | [imagen]                 |
  Then el bien queda registrado en inventario

Scenario: Generación de libro de inventario
  Given bienes registrados
  When se genera "Libro de inventario"
  Then crea documento oficial con todos los bienes
  And calcula valor total del patrimonio
```

---

#### US-197: Validación de Asamblea General anual
**RF Origen:** N11RF11  
**Prioridad:** Should

> Como **sistema**,  
> quiero alertar si no se ha celebrado Asamblea anual,  
> para recordar la obligación legal.

**Criterios de Aceptación:**
```gherkin
Scenario: Alerta de Asamblea pendiente
  Given configuración de ejercicio: enero-diciembre
  And no hay acta de Asamblea Ordinaria en el ejercicio
  When llega el 1 de octubre
  Then muestra alerta: "Recuerde convocar Asamblea General Ordinaria antes de fin de año"

Scenario: Asamblea registrada
  Given acta de Asamblea Ordinaria 2025 registrada
  Then la alerta desaparece
  And se registra cumplimiento
```

---

#### US-198: Validación de Junta Directiva
**RF Origen:** N11RF12  
**Prioridad:** Should

> Como **sistema**,  
> quiero validar que la Junta Directiva cumple requisitos,  
> para alertar de posibles incumplimientos.

**Criterios de Aceptación:**
```gherkin
Scenario: Validación de miembros
  Given la composición de Junta Directiva
  Then valida:
    | requisito                        | estado |
    | Todos son socios                 | ✓      |
    | Todos son mayores de edad        | ✓      |
    | Mínimo 3 miembros (o según est.) | ✓      |

Scenario: Alerta de incumplimiento
  Given un miembro de Junta que causa baja como socio
  Then el sistema alerta:
    "Pedro Martínez ya no es socio. Debe cesar como vocal."
```

---

### 10.3 Alertas de Cumplimiento

#### US-199: Alerta de comunicación al Registro
**RF Origen:** N11RF13  
**Prioridad:** Should

> Como **presidente**,  
> quiero recibir alertas de comunicaciones obligatorias al Registro,  
> para no incumplir el plazo de 1 mes.

**Criterios de Aceptación:**
```gherkin
Scenario: Cambio de Junta Directiva
  Given una renovación de Junta aprobada en Asamblea
  Then el sistema genera alerta:
    | evento              | plazo      | recordatorio |
    | Comunicar al Registro| 1 mes     | Día +15, +25 |
  And proporciona plantilla de comunicación

Scenario: Modificación de estatutos
  Given estatutos modificados aprobados
  Then alerta similar con documentación requerida

Scenario: Cambio de domicilio
  Given nuevo domicilio social registrado
  Then alerta de comunicación al Registro
```

---

#### US-200: Alerta de renovación de Junta
**RF Origen:** N11RF15  
**Prioridad:** Should

> Como **presidente**,  
> quiero recibir alerta de vencimiento del mandato,  
> para preparar la renovación según estatutos.

**Criterios de Aceptación:**
```gherkin
Scenario: Mandato próximo a vencer
  Given mandato de Junta de 4 años
  And fecha de toma de posesión: 15/03/2021
  When llega 15/12/2024 (3 meses antes de vencer)
  Then muestra alerta:
    "El mandato de la Junta Directiva vence el 15/03/2025.
     Convoque Asamblea para renovación."
```

---

#### US-201: Alerta de plazos fiscales
**RF Origen:** N11RF16  
**Prioridad:** Should

> Como **tesorero**,  
> quiero recibir alertas de plazos fiscales,  
> para no incurrir en sanciones por presentación tardía.

**Criterios de Aceptación:**
```gherkin
Scenario: Calendario de alertas fiscales
  Given la configuración fiscal de la entidad
  Then programa alertas:
    | modelo | obligación              | plazo       | alerta     |
    | 182    | Declaración donativos   | 1-31 enero  | 15 dic     |
    | 200    | Impuesto Sociedades     | 25 julio    | 1 julio    |
    | 347    | Operaciones terceros    | febrero     | 15 enero   |

Scenario: Alerta con datos preparados
  Given alerta del Modelo 182
  Then incluye enlace: "Exportar datos para Modelo 182"
  And indica: "12 donantes con 4.500 € en donativos"
```

---

#### US-202: Alerta de caducidad de documentos
**RF Origen:** N11RF17  
**Prioridad:** Should

> Como **administrador**,  
> quiero alertas de caducidad de seguros y certificados,  
> para renovarlos a tiempo.

**Criterios de Aceptación:**
```gherkin
Scenario: Documentos con fecha de vencimiento
  Given documentos con fecha caducidad registrada:
    | documento              | vencimiento | alerta    |
    | Seguro RC              | 15/04/2025  | 15/03/2025|
    | Certificado corriente TGSS| 30/06/2025| 30/05/2025|
    | Licencia federativa    | 31/12/2025  | 01/12/2025|

Scenario: Notificación de caducidad próxima
  Given documento a 30 días de caducar
  Then envía notificación al administrador
  And muestra en dashboard como alerta pendiente
```

---

### Resumen: Cumplimiento Normativo

| US | RF | Título | Prioridad |
|----|-----|--------|-----------|
| **10.1 RGPD (N11)** ||||
| US-188 | N11RF01 | Registro de Actividades de Tratamiento | Must |
| US-189 | N11RF02 | Gestión de consentimientos | Must |
| US-190 | N11RF03 | Ejercicio del derecho de acceso | Must |
| US-191 | N11RF04 | Ejercicio del derecho de rectificación | Should |
| US-192 | N11RF05 | Ejercicio del derecho de supresión | Should |
| US-193 | N11RF06 | Ejercicio del derecho de portabilidad | Should |
| US-194 | N11RF07 | Base jurídica para datos religiosos | Should |
| **10.2 LO 1/2002 (N11)** ||||
| US-195 | N11RF08 | Libro de socios digital | Must |
| US-196 | N11RF10 | Inventario de bienes | Should |
| US-197 | N11RF11 | Validación de Asamblea General anual | Should |
| US-198 | N11RF12 | Validación de Junta Directiva | Should |
| **10.3 Alertas (N11)** ||||
| US-199 | N11RF13 | Alerta de comunicación al Registro | Should |
| US-200 | N11RF15 | Alerta de renovación de Junta | Should |
| US-201 | N11RF16 | Alerta de plazos fiscales | Should |
| US-202 | N11RF17 | Alerta de caducidad de documentos | Should |

**Nota:** N11RF09 (Libro de Actas Digital) es referencia cruzada a N6RF17-N6RF23, ya cubierto en US-129 a US-135.
**Nota:** N11RF14 (Alerta de Asamblea General) está cubierto funcionalmente en US-197.

---
