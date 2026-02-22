# Requisitos Funcionales (RF)

**Proyecto:** Associated - ERP Ligero para Colectividades Españolas  
**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Inputs:** KB-002 (Análisis de Necesidades)
**Estado:** Validado  
**Total RFs:** 221

---

## Índice de Secciones

1. [N2: Arquitectura y Acceso al Sistema](#n2-necesidades-de-arquitectura-y-acceso-al-sistema) (8 RFs)
2. [N3: Gestión de Socios/Miembros](#n3-necesidades-de-gestión-de-sociosmiembros) (34 RFs)
3. [N4: Tesorería y Finanzas](#n4-necesidades-de-tesorería-y-finanzas) (38 RFs)
4. [N5: Gestión de Eventos](#n5-necesidades-de-gestión-de-eventos) (30 RFs)
5. [N6: Comunicación](#n6-necesidades-de-comunicación) (23 RFs)
6. [N7: Gestión Documental](#n7-necesidades-de-gestión-documental) (12 RFs)
7. [N8: Importación y Exportación](#n8-necesidades-de-importación-y-exportación) (13 RFs)
8. [N9: Visibilidad y Reporting](#n9-necesidades-de-visibilidad-y-reporting) (12 RFs)
9. [N10: Autoservicio del Socio](#n10-necesidades-de-autoservicio-del-socio) (15 RFs)
10. [N11: Cumplimiento Normativo](#n11-necesidades-de-cumplimiento-normativo) (17 RFs)
11. [N12: Necesidades Específicas por Tipo de Colectividad](#n12-necesidades-específicas-por-tipo-de-colectividad) (15 RFs)
12. [N13: Contexto Aragonés](#n13-contexto-aragonés---especificidades) (4 RFs)

---

## N2: Necesidades de Arquitectura y Acceso al Sistema

### N2RF01: Aislamiento Multi-Tenant

**Qué es:** Sistema de arquitectura multi-tenant que permite crear espacios completamente aislados para cada colectividad (tenant), donde cada entidad tiene su propia base de datos lógica, configuraciones y usuarios.

**Problema que resuelve:** Las personas pertenecen simultáneamente a varias colectividades (cofradía + peña + asociación cultural). Actualmente cada entidad gestiona sus datos de forma aislada con herramientas distintas, generando duplicidad de información y dificultando la visión consolidada para el socio.

---

### N2RF02: Acceso Unificado Multi-Entidad

**Qué es:** Mecanismo que permite a un usuario (persona física) acceder a todas las colectividades a las que pertenece desde un único punto de entrada (single sign-on), manteniendo roles y permisos diferenciados en cada una.

**Problema que resuelve:** Los usuarios tienen que recordar múltiples credenciales y acceder a diferentes sistemas para gestionar su participación en distintas colectividades.

---

### N2RF03: Configuración Independiente por Entidad

**Qué es:** Capacidad de cada tenant para personalizar su configuración de forma independiente: tipos de socio, cuotas, campos personalizados, flujos de trabajo, branding visual, sin afectar a otras entidades.

**Problema que resuelve:** Las soluciones actuales de mercado son rígidas y no permiten adaptar la configuración a las particularidades de cada tipo de colectividad (cofradía vs peña vs club deportivo).

---

### N2RF04: Sistema de Roles Predefinidos

**Qué es:** Conjunto de roles predefinidos que reflejan la estructura real de las colectividades españolas, con permisos preconfigurados.

**Problema que resuelve:** Los traspasos de junta directiva son caóticos: contraseñas compartidas, emails personales con información de la entidad, y falta de trazabilidad sobre quién hizo qué.

**Campos específicos:**
- Presidente/Hermano Mayor: Acceso total, aprobación de operaciones críticas
- Secretario: Gestión de socios, actas, documentación oficial
- Tesorero: Gestión económica, cuotas, cobros, informes fiscales
- Vocales: Acceso limitado según área asignada (eventos, comunicación, etc.)
- Socio: Solo lectura de su propia información vía portal

---

### N2RF05: Roles Personalizados

**Qué es:** Funcionalidad para crear roles personalizados por entidad, definiendo permisos granulares sobre cada módulo y operación del sistema.

**Problema que resuelve:** Cada entidad tiene una estructura organizativa diferente que no siempre encaja en roles estándar (ej: mayordomo en cofradías, encargado de bar en peñas).

---

### N2RF06: Auditoría de Acciones Críticas

**Qué es:** Registro automático e inmutable de todas las acciones críticas realizadas en el sistema: quién, cuándo, qué operación, datos antes/después.

**Problema que resuelve:** No existe trazabilidad sobre modificaciones realizadas, lo que impide la rendición de cuentas en Asamblea y dificulta la investigación de errores o fraudes.

**Campos específicos:**
- Usuario que realizó la acción
- Fecha y hora exacta
- Tipo de operación
- Entidad afectada (socio, pago, documento)
- Valores anteriores y posteriores
- Dirección IP de origen

---

### N2RF07: Proceso de Traspaso de Cargos

**Qué es:** Workflow guiado para el traspaso de cargos directivos que preserve el histórico, revoque accesos anteriores de forma controlada y asigne nuevos permisos.

**Problema que resuelve:** Cuando cambia la junta directiva, el traspaso de accesos es caótico y se pierde información crítica. Los antiguos cargos mantienen accesos indebidamente.

---

### N2RF08: Validación de Elegibilidad para Cargos

**Qué es:** Sistema de validación automática que verifique que solo asociados mayores de edad puedan ocupar cargos en Junta Directiva, conforme a la LO 1/2002.

**Problema que resuelve:** La Ley Orgánica 1/2002 establece que la Junta Directiva debe estar compuesta solo por asociados mayores de edad. El incumplimiento puede invalidar acuerdos.

---

## N3: Necesidades de Gestión de Socios/Miembros

### N3RF01: Ficha Centralizada de Socio - Datos Básicos

**Qué es:** Registro único y centralizado para cada socio con todos sus datos básicos, accesible desde cualquier módulo del sistema.

**Problema que resuelve:** La secretaría mantiene listas de socios en múltiples formatos: Excel, libretas, fichas en papel, grupos de WhatsApp. Cuando alguien pregunta si una persona es socio, hay que consultar varias fuentes.

**Campos específicos:**
- Nombre completo
- DNI/NIE (identificador único)
- Fecha de nacimiento
- Dirección postal completa
- Email principal y secundario
- Teléfono fijo y móvil
- IBAN para domiciliación de cuotas
- Fotografía para carnet
- Fecha de alta
- Estado actual
- Tipo de socio

---

### N3RF02: Campos Específicos para Cofradías

**Qué es:** Extensión de la ficha de socio con campos específicos para hermandades y cofradías religiosas.

**Problema que resuelve:** Las cofradías manejan información religiosa específica (bautismo, jura de reglas, padrinos) que no tiene cabida en sistemas genéricos.

**Campos específicos:**
- Fecha de bautismo
- Parroquia de bautismo
- Padrinos/avalistas (referencia a otros hermanos)
- Fecha de jura de reglas
- Fecha de imposición de medalla
- Tipo de túnica asignada
- Posición histórica en procesiones

---

### N3RF03: Campos Específicos para Clubes Deportivos

**Qué es:** Extensión de la ficha de socio con campos específicos para deportistas y técnicos de clubes deportivos.

**Problema que resuelve:** Los clubes necesitan gestionar licencias federativas, certificados médicos y certificados de delitos sexuales con fechas de caducidad.

**Campos específicos:**
- Categoría deportiva actual
- Número de licencia federativa
- Fecha de expedición de licencia
- Certificado médico: fecha de expedición
- Certificado médico: fecha de caducidad
- Certificado delitos sexuales (para técnicos): fecha
- Posiciones/demarcaciones habituales
- Historial de lesiones relevantes

---

### N3RF04: Campos Específicos para Peñas Festeras

**Qué es:** Extensión de la ficha de socio con campos específicos para peñas y colectivos festeros.

**Problema que resuelve:** Las peñas organizan comidas, reparten uniformes y gestionan turnos de voluntariado, necesitando información que otros sistemas no contemplan.

**Campos específicos:**
- Talla de camiseta
- Talla de pantalón (si aplica uniforme completo)
- Preferencias alimentarias (vegetariano, vegano, etc.)
- Alergias e intolerancias alimentarias
- Disponibilidad para turnos de voluntariado
- Vehículo disponible para transporte

---

### N3RF05: Campos Específicos para Asociaciones Culturales

**Qué es:** Extensión de la ficha de socio con campos específicos para asociaciones culturales.

**Problema que resuelve:** Las asociaciones culturales necesitan conocer las habilidades e intereses de sus socios para organizar actividades y asignar responsabilidades.

**Campos específicos:**
- Áreas de interés cultural
- Habilidades que puede aportar
- Disponibilidad horaria habitual
- Formación/profesión relevante
- Idiomas

---

### N3RF06: Gestión de Estados del Socio

**Qué es:** Sistema de estados que refleje la situación real de cada socio en relación con la entidad, con transiciones controladas.

**Problema que resuelve:** No existe un criterio unificado para saber si un socio está activo, de baja temporal, moroso o expulsado. Cada persona de la junta tiene su propia interpretación.

**Estados:**
- Activo (al corriente de pago)
- Pendiente de pago (morosidad leve)
- Suspendido (morosidad grave, sin derechos)
- Baja voluntaria
- Baja por impago (tras procedimiento estatutario)
- Baja disciplinaria (tras expediente)
- Aspirante / Lista de espera
- Fallecido (mantener para histórico)

---

### N3RF07: Tipos de Socio para Cofradías

**Qué es:** Configuración de categorías de hermanos específicas para cofradías con sus reglas de derechos y cuotas asociadas.

**Problema que resuelve:** Las cofradías tienen categorías muy específicas (numerarios, honorarios, neófitos) con reglas de antigüedad para voto y elegibilidad que deben calcularse automáticamente.

**Campos específicos:**
- Hermanos numerarios: pleno derecho, voz y voto, cuota completa
- Hermanos honorarios: reconocimiento sin cuota, sin derecho a voto
- Aspirantes/neófitos: periodo de formación (1 año mínimo), cuota reducida
- Menores de edad: inscritos por tutores, derechos limitados hasta los 18
- Regla de antigüedad: 2+ años para votar, 5+ años para ser Hermano Mayor

---

### N3RF08: Tipos de Socio para Peñas

**Qué es:** Configuración de categorías de socios específicas para peñas festeras con cuotas diferenciadas.

**Problema que resuelve:** Las peñas manejan cuotas muy diferentes por edad (adultos 95-175€, juveniles con descuento 30-40%, infantiles 80-100€) y casos especiales como cuota 0€.

**Campos específicos:**
- Adultos: cuota completa (95-175€/año típico)
- Juveniles/menores de 35 años: descuento 30-40%
- Infantiles menores de 14 años: cuota reducida (80-100€)
- Socios de honor: sin cuota, reconocimiento especial
- Soporte para cuota simbólica 0€ (caso peña El Agüelo)

---

### N3RF09: Tipos de Socio para Clubes Deportivos

**Qué es:** Configuración de categorías de miembros específicas para clubes deportivos, diferenciando socios de deportistas.

**Problema que resuelve:** Los clubes necesitan distinguir entre quienes solo son socios (pagan cuota, votan) y quienes además practican deporte (requieren licencia, seguro).

**Campos específicos:**
- Socio del club: paga cuota, participa en Asamblea, no practica deporte
- Deportista federado: requiere licencia, seguro, vinculación a modalidad
- Socio-deportista: ambas condiciones
- Familiar: cuota reducida para familiares directos

---

### N3RF10: Tipos de Socio para Asociaciones Culturales

**Qué es:** Configuración de categorías de socios estándar para asociaciones culturales.

**Problema que resuelve:** Las asociaciones culturales manejan categorías tradicionales (ordinarios, fundadores, honorarios, protectores) con diferentes niveles de aportación.

**Campos específicos:**
- Ordinarios: cuota estándar (30-60€/año típico)
- Fundadores: reconocimiento especial, posibles beneficios
- Honorarios: sin cuota, por méritos
- Protectores: aportación económica superior voluntaria

---

### N3RF11: Reglas Configurables por Tipo de Socio

**Qué es:** Motor de reglas que permita configurar por cada tipo de socio: edad mínima/máxima, cuota asociada, derechos, periodos de carencia y transiciones automáticas.

**Problema que resuelve:** El cálculo manual de quién tiene derecho a qué según su categoría y antigüedad genera errores frecuentes y conflictos.

**Campos específicos:**
- Edad mínima y máxima para pertenecer a la categoría
- Cuota asociada (fija o fórmula de cálculo)
- Derecho a voto en asamblea (sí/no/condicional)
- Elegibilidad para cargos directivos
- Periodo de carencia antes de adquirir derechos
- Transiciones automáticas al cumplir condiciones (ej: juvenil→adulto)

---

### N3RF12: Timeline Histórico del Socio

**Qué es:** Registro cronológico automático de todos los eventos relevantes en la vida del socio dentro de la entidad.

**Problema que resuelve:** Cuando cambia la junta directiva, se pierde el contexto histórico. Preguntas como '¿cuántos años lleva de socio?' requieren bucear en archivos dispersos.

**Campos específicos:**
- Fecha de alta inicial y sucesivas altas/bajas
- Cambios de categoría de socio con fecha y motivo
- Historial completo de pagos (cuotas, eventos, otros)
- Participación en eventos y actividades
- Cargos ocupados en junta directiva con fechas
- Sanciones o expedientes (si los hubiera)
- Comunicaciones relevantes recibidas

---

### N3RF13: Cálculo Automático de Antigüedad

**Qué es:** Algoritmo que calcule automáticamente la antigüedad del socio considerando periodos de baja según configuración de la entidad.

**Problema que resuelve:** En cofradías, la antigüedad determina derechos de voto (2+ años) y elegibilidad para cargos (5+ años). El cálculo manual es propenso a errores.

**Campos específicos:**
- Fecha de inicio del cómputo
- Configuración de acumulación o reinicio en bajas
- Cálculo en años, meses y días
- Alertas al alcanzar umbrales significativos

---

### N3RF14: Estadísticas de Socios

**Qué es:** Generación automática de indicadores sobre la masa social: tasa de retención, altas/bajas por periodo, distribución por categorías.

**Problema que resuelve:** Los tesoreros no tienen visibilidad sobre la evolución de la masa social ni pueden detectar tendencias negativas a tiempo.

**Campos específicos:**
- Tasa de retención por ejercicio
- Altas y bajas por mes/trimestre/año
- Distribución por tipo de socio
- Pirámide de edades
- Socios activos vs históricos totales

---

### N3RF15: Gestión de Ejercicios/Temporadas

**Qué es:** Concepto de ejercicio como entidad temporal que agrupa el estado de socios, cuotas, eventos y documentación de un periodo.

**Problema que resuelve:** La gestión por ejercicios se traduce actualmente en 'duplicar el Excel de socios cada año', perdiendo la conexión entre ejercicios.

**Campos específicos:**
- Fecha de inicio y fin del ejercicio
- Estado de cada socio en ese ejercicio
- Cuotas y pagos asociados al ejercicio
- Eventos y actividades del ejercicio
- Documentación generada (actas, memorias)

---

### N3RF16: Apertura de Nuevo Ejercicio

**Qué es:** Proceso automatizado de apertura de ejercicio con arrastre de socios activos al nuevo periodo.

**Problema que resuelve:** Cada inicio de año/temporada requiere trabajo manual para 'pasar' los socios al nuevo periodo.

**Nota importante:** Este proceso NO genera cargos automáticamente. Los cargos se generan mensualmente mediante el proceso automatizado N4RF02 (Generación Masiva de Cargos por Suscripciones), basándose en las suscripciones activas de cada socio.

---

### N3RF17: Cierre de Ejercicio

**Qué es:** Proceso de cierre de ejercicio con generación automática de memoria/informe y consolidación de datos.

**Problema que resuelve:** El cierre de ejercicio es caótico: hay que recopilar datos dispersos para preparar el informe de Asamblea.

---

### N3RF18: Comparativas Entre Ejercicios

**Qué es:** Generación de informes comparativos entre ejercicios: evolución de socios, recaudación, participación en eventos.

**Problema que resuelve:** No existe forma sencilla de comparar la situación actual con años anteriores para detectar tendencias.

---

### N3RF19: Flexibilidad de Fechas de Ejercicio

**Qué es:** Configuración del periodo del ejercicio según las necesidades de cada entidad: año natural, temporada deportiva, ejercicio cofrade.

**Problema que resuelve:** Diferentes tipos de colectividades usan diferentes periodos: asociaciones (enero-diciembre), clubes (septiembre-agosto), cofradías (variable).

**Campos específicos:**
- Año natural: enero-diciembre
- Temporada deportiva: septiembre-agosto
- Ejercicio cofrade: según tradición local
- Ejercicio personalizado: fechas libres

---

### N3RF20: Proceso de Alta Simple

**Qué es:** Workflow de alta de socio simplificado para peñas y asociaciones: solicitud → selección modalidad de pago → generación de cargo(s) → alta efectiva.

**Problema que resuelve:** Las altas llegan por múltiples canales (WhatsApp, email, presencial) y se gestionan de forma desorganizada.

**Nota:** Si existe cuota de inscripción, se genera como FeeSubscription tipo ONE_TIME. Para la cuota periódica, el socio selecciona un FeePlan disponible para su tipo de socio (ver N4RF06).

---

### N3RF21: Proceso de Alta Complejo para Cofradías

**Qué es:** Workflow de alta completo para cofradías con múltiples pasos: solicitud, avales, documentación, pago, formación, jura, imposición.

**Problema que resuelve:** El proceso de alta en cofradías es complejo y prolongado (puede durar más de un año). Sin seguimiento sistemático se pierden solicitudes.

**Campos específicos:**
- 1. Solicitud escrita al Hermano Mayor
- 2. Aval de dos hermanos con 2+ años de antigüedad
- 3. Entrega de documentación (partida de bautismo, etc.)
- 4. Pago de cuota de inscripción
- 5. Periodo de formación con asistencia a sesión informativa
- 6. Jura de reglas ante Junta de Oficiales
- 7. Imposición de medalla y cordón con cruz

---

### N3RF22: Gestión de Flujo de Estados en Alta

**Qué es:** Motor de workflow configurable para gestionar transiciones de estados durante el proceso de alta.

**Problema que resuelve:** No hay visibilidad sobre en qué punto del proceso está cada solicitud de alta ni alertas cuando se estancan.

**Estados:**
- Solicitud recibida
- Pendiente de documentación
- Documentación completa
- Pendiente de pago
- Pago confirmado
- En periodo de formación
- Pendiente de jura/aprobación
- Alta efectiva

---

### N3RF23: Gestión de Documentos Pendientes

**Qué es:** Control de documentos pendientes de entregar por aspirantes/socios con alertas y fechas límite.

**Problema que resuelve:** Los aspirantes entregan documentación a medias y luego nadie recuerda qué falta por aportar.

---

### N3RF24: Proceso de Baja Voluntaria

**Qué es:** Workflow para gestionar bajas voluntarias conforme a estatutos: solicitud por escrito, efectiva a fin de ejercicio.

**Problema que resuelve:** Las bajas se comunican informalmente y no queda constancia. Luego hay disputas sobre cuotas pendientes.

---

### N3RF25: Proceso de Baja por Impago

**Qué es:** Workflow automatizado de baja por impago conforme a estatutos: detección, notificaciones, plazo de regularización, baja definitiva.

**Problema que resuelve:** La jurisprudencia exige proporcionalidad y notificación previa. Sin un proceso formal, las expulsiones pueden anularse judicialmente.

**Campos específicos:**
- Detección automática tras X años sin pagar (configurable, típico 2 años)
- Primera notificación de impago
- Segunda notificación con plazo para regularizar
- Generación de certificado de descubierto
- Resolución de baja con registro de fecha y motivo

---

### N3RF26: Proceso de Baja Disciplinaria

**Qué es:** Workflow para gestionar expedientes disciplinarios: apertura, audiencia al interesado, resolución de Junta, recurso a Asamblea.

**Problema que resuelve:** Las expulsiones disciplinarias sin procedimiento formal son impugnables. Se necesita trazabilidad del expediente.

---

### N3RF27: Rehabilitación de Socios

**Qué es:** Proceso para readmitir socios dados de baja, con posibilidad de exigir pago de deudas y penalizaciones según estatutos.

**Problema que resuelve:** No existe un procedimiento claro para socios que quieren volver tras una baja, generando inconsistencias.

---

### N3RF28: Gestión de Lista de Espera

**Qué es:** Sistema para registrar y gestionar solicitudes de alta cuando la entidad tiene límite de socios.

**Problema que resuelve:** Algunas entidades populares tienen más demanda que capacidad (ej: peña La Botera con límite de 440 socios). Sin lista formal se pierde el orden.

**Campos específicos:**
- Fecha de solicitud
- Datos del aspirante
- Prioridad (hijos de socios, recomendados, cronológico)
- Estado (en espera, notificado, plazo vencido)
- Fecha de notificación de vacante
- Plazo para aceptar la plaza

---

### N3RF29: Notificación Automática de Vacantes

**Qué es:** Sistema de notificación automática al siguiente en lista de espera cuando se produce una vacante.

**Problema que resuelve:** Las vacantes no se comunican de forma sistemática, generando quejas de aspirantes que llevan años esperando.

---

### N3RF30: Carnet Digital con QR

**Qué es:** Generación de carnet digital para cada socio con código QR único por ejercicio, accesible desde el portal del socio (PWA).

**Problema que resuelve:** Los carnets físicos se pierden, se olvidan en casa, y no permiten validación instantánea. El modelo de referencia es la App InterPeñas de Teruel.

**Campos específicos:**
- Código QR único por socio y ejercicio
- Nombre y foto del socio
- Número de socio
- Ejercicio vigente
- Estado (al corriente de pago)
- Logo de la entidad

---

### N3RF31: Validación de Carnet por Escaneo

**Qué es:** Funcionalidad para validar carnets escaneando el QR, mostrando datos del socio y su estado actual.

**Problema que resuelve:** En eventos y procesiones se necesita verificar rápidamente si alguien es socio al corriente de pago.

---

### N3RF32: Carnet Físico Imprimible

**Qué es:** Generación de PDF imprimible con diseño de carnet personalizable por entidad (logo, colores corporativos).

**Problema que resuelve:** Algunas entidades prefieren entregar carnets físicos además del digital.

---

### N3RF33: Papeleta de Sitio para Cofradías

**Qué es:** Generación de papeletas de sitio para procesiones, vinculadas a cuota y antigüedad del hermano.

**Problema que resuelve:** Las papeletas de sitio acreditan la posición en el cortejo procesional. Actualmente se generan y reparten manualmente.

**Campos específicos:**
- Nombre del hermano
- Número de antigüedad
- Posición en el cortejo
- Paso/sección asignada
- Ejercicio/año
- QR de validación

---

### N3RF34: Generación Masiva de Papeletas

**Qué es:** Proceso de generación masiva de papeletas de sitio por antigüedad estricta antes de Semana Santa.

**Problema que resuelve:** El reparto de papeletas según antigüedad es un proceso manual tedioso que genera errores y conflictos.

---

## N4: Necesidades de Tesorería y Finanzas

### N4RF01: Configuración de Planes de Cuota

**Qué es:** Configuración de planes de cuota que definen modalidades de pago con importes, tipo (única/periódica) y meses de cobro específicos.

**Problema que resuelve:** Cada entidad tiene múltiples modalidades de pago (mensual, trimestral, anual) con importes no necesariamente proporcionales. Un mismo tipo de socio puede elegir entre varias modalidades. El tesorero calcula manualmente quién debe qué.

**Campos específicos:**
- Código y nombre identificativo del plan
- Tipo de plan: UNICA (inscripción, derrama) o PERIODICA (cuota recurrente)
- Importe base del plan
- Periodicidad orientativa: mensual, trimestral, semestral, anual, personalizada
- Meses de cobro: array configurable (ej: [1,4,7,10] para trimestral, [9,12,3,6] para ejercicio no natural)
- Estado activo/inactivo

**Ejemplos de configuración:**
- Plan "Cuota mensual adulto": PERIODICA, 12€, meses [1-12]
- Plan "Cuota trimestral adulto": PERIODICA, 35€, meses [1,4,7,10]
- Plan "Cuota anual adulto": PERIODICA, 120€, meses [2]
- Plan "Inscripción": UNICA, 50€
- Plan "Derrama obras 2025": UNICA, 100€

---

### N4RF02: Generación Masiva de Cargos por Suscripciones

**Qué es:** Proceso automatizado (ejecutable mensualmente) que genera cargos para todas las suscripciones activas cuyo plan de cuota incluya el mes actual en su configuración de meses de cobro.

**Problema que resuelve:** Generar manualmente las cuotas de cientos de socios es tedioso y propenso a errores y omisiones. La generación basada en suscripciones permite que cada socio tenga su propia modalidad de pago.

**Lógica de generación:**
1. Obtener suscripciones activas (fechaBaja IS NULL, tipo PERIODICA)
2. Filtrar donde mesActual IN planCuota.mesesCobro
3. Para cada suscripción: crear Cargo con importeFinal = suscripcion.importeEfectivo

**Campos específicos:**
- Mes/periodo a generar
- Ejercicio fiscal
- Filtros opcionales: por tipo de socio, por plan de cuota
- Vista previa antes de confirmar generación
- Resumen post-generación: cargos creados, importe total

---

### N4RF03: Prorrateo Automático de Cuotas

**Qué es:** Cálculo automático de cuota proporcional para altas realizadas a mitad de ejercicio.

**Problema que resuelve:** Las altas a mitad de año generan conflictos sobre cuánto debe pagar el nuevo socio.

---

### N4RF04: Aplicación de Descuentos en Suscripciones

**Qué es:** Sistema para aplicar descuentos a nivel de suscripción individual, calculando el importe efectivo que pagará el socio.

**Problema que resuelve:** Los descuentos se calculan manualmente, generando errores e inconsistencias. Al aplicarlos en la suscripción (no en el plan), se permite flexibilidad individual.

**Campos específicos:**
- Descuento como porcentaje (ej: 0.30 = 30%)
- Importe efectivo calculado: planCuota.importe × (1 - descuento)
- Motivo del descuento (opcional): juvenil, familiar, situación especial
- Fecha de aplicación del descuento
- Descuentos sugeridos por tipo de socio (configurables, no obligatorios)

**Ejemplos:**
- Socio juvenil con plan anual 120€ y descuento 30% → importeEfectivo = 84€
- Socio adulto con plan mensual 12€ sin descuento → importeEfectivo = 12€
- Socio con situación especial, descuento 50% puntual → importeEfectivo = 60€

---

### N4RF05: Gestión de Exenciones

**Qué es:** Funcionalidad para configurar exenciones de pago para determinados socios (honor, situaciones especiales).

**Problema que resuelve:** Los socios exentos se gestionan 'de memoria', sin registro formal ni criterios claros.

---

### N4RF06: Selección de Modalidad de Pago al Alta

**Qué es:** Al dar de alta un socio, el sistema presenta las modalidades de pago (planes de cuota) disponibles para su tipo de socio, permitiendo seleccionar una.

**Problema que resuelve:** Actualmente se asume una única cuota por tipo de socio. En realidad, un mismo tipo puede pagar mensual, trimestral, semestral o anualmente con importes no necesariamente proporcionales.

**Campos específicos:**
- Lista de planes de cuota compatibles con el tipo de socio seleccionado
- Plan por defecto preseleccionado (configurable por tipo)
- Importe efectivo mostrado (con descuentos aplicados si procede)
- Frecuencia de cobro (meses en que se generarán cargos)

### N4RF07: Cambio de Modalidad de Pago

**Qué es:** Permite modificar la modalidad de pago de un socio (ej: pasar de mensual a anual) manteniendo histórico de suscripciones.

**Problema que resuelve:** Los socios pueden querer cambiar su forma de pago según su situación económica. Sin este proceso, se gestionaba informalmente sin trazabilidad.

**Campos específicos:**
- Fecha efectiva del cambio
- Motivo del cambio (opcional)
- Gestión de cargos pendientes de la modalidad anterior
- Prorrateo o ajuste si el cambio es a mitad de periodo
- Histórico de modalidades anteriores consultable

---

### N4RF08: Generación de Cargos Manuales

**Qué es:** Funcionalidad para crear cargos puntuales directamente a uno o varios socios sin necesidad de configurar un plan de cuota ni una suscripción.

**Problema que resuelve:** Existen cargos puntuales (derramas urgentes, penalizaciones, ajustes) que no encajan en la estructura de planes de cuota. Crear un FeePlan para cada caso puntual genera sobrecarga de configuración.

**Campos específicos:**
- Socio(s) destinatario(s): selección individual o masiva
- Concepto descriptivo del cargo
- Importe
- Fecha de emisión y vencimiento
- Ejercicio fiscal
- Sin vinculación a suscripción (suscripcionId = NULL)
- Marcado como esManual = true

**Ejemplos de uso:**
- Derrama extraordinaria aprobada en Asamblea
- Penalización por devolución de recibo SEPA
- Ajuste de importe por error anterior
- Cargo por pérdida de material/equipamiento

---

### N4RF09: Registro de Cobros Multi-método

**Qué es:** Sistema para registrar cobros recibidos por cualquier método de pago utilizado por la entidad.

**Problema que resuelve:** Los socios pagan por múltiples vías (efectivo, transferencia, Bizum, domiciliación) y el tesorero apunta donde puede, con frecuentes errores.

**Campos específicos:**
- Efectivo (requiere recibo como justificante)
- Transferencia bancaria (con referencia identificativa)
- Domiciliación SEPA (automatizado)
- Bizum / pago móvil
- Tarjeta (si hay pasarela online)

---

### N4RF10: Estados del Pago

**Qué es:** Gestión de los diferentes estados por los que puede pasar un cargo/pago.

**Problema que resuelve:** No hay claridad sobre qué significa cada situación de un pago, generando confusiones.

**Estados:**
- Pendiente: cargo generado, no cobrado
- Pagado: cobro confirmado
- Parcial: pago incompleto
- Devuelto: recibo domiciliado rechazado por banco
- Anulado: cargo cancelado (error, exención posterior)

---

### N4RF11: Información Completa del Cobro

**Qué es:** Registro detallado de cada cobro con toda la información necesaria para trazabilidad.

**Problema que resuelve:** Los cobros se registran de forma incompleta, dificultando la auditoría y resolución de disputas.

**Campos específicos:**
- Fecha de pago
- Método utilizado
- Referencia/identificador único
- Usuario que registró el cobro
- Justificante adjunto (si aplica)
- Concepto detallado

---

### N4RF12: Adjuntar Justificantes a Pagos

**Qué es:** Funcionalidad para adjuntar comprobantes digitales a cada movimiento económico.

**Problema que resuelve:** Los justificantes están dispersos en emails, capturas de WhatsApp, o simplemente no existen. Dificulta auditorías y disputas.

**Campos específicos:**
- Formatos soportados: PDF, JPG, PNG
- Previsualización sin necesidad de descarga
- Vinculación automática con el movimiento

---

### N4RF13: Generación Automática de Recibos

**Qué es:** Generación automática de recibo PDF para pagos en efectivo como justificante.

**Problema que resuelve:** Los pagos en efectivo no dejan rastro documental, generando disputas ('yo ya pagué').

---

### N4RF14: Workflow de Morosidad Configurable

**Qué es:** Sistema automatizado de gestión de morosidad con pasos configurables según estatutos de cada entidad.

**Problema que resuelve:** La morosidad es alta por falta de seguimiento sistemático. Muchos tesoreros 'dejan pasar' impagos por no tener un proceso claro.

**Campos específicos:**
- 1. Detección automática del impago (cuota no cobrada en fecha)
- 2. Primera comunicación amistosa (email automático)
- 3. Recordatorio tras X días (segundo aviso)
- 4. Reclamación formal tras Y días (carta/burofax)
- 5. Suspensión de derechos según estatutos
- 6. Expediente sancionador con audiencia
- 7. Baja por impago tras certificación de descubierto

---

### N4RF15: Plazos de Morosidad Configurables

**Qué es:** Configuración de los plazos para cada paso del workflow de morosidad según estatutos.

**Problema que resuelve:** Los plazos típicos según estatutos (baja tras 2 años sin pagar) no se cumplen por falta de seguimiento.

---

### N4RF16: Documentación de Morosidad

**Qué es:** Generación automática de documentos requeridos en el proceso de morosidad.

**Problema que resuelve:** La documentación de morosidad (certificados, notificaciones) se genera manualmente o no se genera.

**Campos específicos:**
- Certificado de descubierto (firmado por tesorero, VºBº de presidente)
- Notificaciones enviadas con acuse de recibo
- Resolución de baja con fecha y motivo

---

### N4RF17: Generación de Ficheros SEPA

**Qué es:** Generación de ficheros XML en formato ISO 20022 (pain.008.001.08) para remesas bancarias de adeudos directos.

**Problema que resuelve:** La funcionalidad más demandada por tesoreros. Actualmente generar una remesa requiere conocimientos técnicos o pagar a una gestoría.

---

### N4RF18: Gestión de Identificador de Acreedor

**Qué es:** Almacenamiento y validación del Identificador de Acreedor emitido por el Banco de España, obligatorio para adeudos SEPA.

**Problema que resuelve:** Sin el identificador de acreedor no se pueden emitir remesas SEPA.

---

### N4RF19: Gestión de Mandatos SEPA

**Qué es:** Registro y control de mandatos SEPA firmados por cada socio, con gestión de caducidad (36 meses sin adeudos).

**Problema que resuelve:** Los mandatos tienen una vida útil limitada y muchas entidades desconocen que caducan si no se usan.

**Campos específicos:**
- Referencia única del mandato
- Fecha de firma
- IBAN del deudor
- Fecha del último adeudo
- Estado (activo, caducado, revocado)
- Documento del mandato firmado (adjunto)

---

### N4RF20: Tipos de Secuencia SEPA

**Qué es:** Gestión automática del tipo de secuencia correcto para cada adeudo según el histórico del mandato.

**Problema que resuelve:** Usar el tipo de secuencia incorrecto (FRST cuando debería ser RCUR) puede provocar rechazos bancarios.

**Campos específicos:**
- FRST: primer cobro a un socio (o primero tras >36 meses)
- RCUR: cobros recurrentes
- OOFF: cobro único
- FNAL: último cobro de una serie

---

### N4RF21: Control de Plazos de Presentación

**Qué es:** Alertas y validaciones para cumplir el plazo mínimo de presentación SEPA CORE (3 días hábiles de antelación).

**Problema que resuelve:** Presentar remesas fuera de plazo provoca rechazos y retrasos en los cobros.

---

### N4RF22: Gestión de Devoluciones SEPA

**Qué es:** Sistema para gestionar devoluciones de adeudos SEPA: registro, motivo, reintento, impacto en estado del socio.

**Problema que resuelve:** Las devoluciones generan gastos bancarios (3-5€ típicos) y no se gestionan de forma sistemática.

**Campos específicos:**
- Plazo de devolución autorizada: 8 semanas
- Plazo de devolución no autorizada: 13 meses
- Motivo de devolución según código SEPA
- Gastos bancarios asociados
- Fecha de reintento programado

---

### N4RF23: Exportación de Remesa para Banca Online

**Qué es:** Exportación del fichero SEPA generado en formato compatible para subir a la banca online de la entidad.

**Problema que resuelve:** Muchos tesoreros no saben cómo subir el fichero al banco o el formato no es compatible.

---

### N4RF24: Generación de Enlaces de Pago

**Qué es:** Creación de enlaces de pago únicos por concepto para cobros puntuales con tarjeta.

**Problema que resuelve:** Para cuotas extraordinarias o inscripciones a eventos, no hay forma de ofrecer pago online puntual.

---

### N4RF25: Pago por QR

**Qué es:** Generación de códigos QR que dirijan a la pasarela de pago para facilitar cobros desde móvil.

**Problema que resuelve:** El pago desde móvil se complica si hay que teclear URLs largas.

---

### N4RF26: Conciliación Automática de Pagos Online

**Qué es:** Vinculación automática de pagos recibidos vía pasarela con los cargos pendientes correspondientes.

**Problema que resuelve:** Los pagos online requieren conciliación manual con los cargos del sistema.

---

### N4RF27: Gestión de Comisiones de Pasarela

**Qué es:** Configuración de si las comisiones de pasarela las asume la entidad o se repercuten al socio.

**Problema que resuelve:** Las comisiones de pasarela (1-3% típico) reducen la recaudación si no se gestionan.

---

### N4RF28: Libro de Ingresos y Gastos

**Qué es:** Registro contable básico de ingresos y gastos categorizado para asociaciones pequeñas.

**Problema que resuelve:** Las asociaciones pequeñas necesitan contabilidad ordenada aunque no estén obligadas al plan contable completo.

**Campos específicos:**
- Fecha del movimiento
- Tipo (ingreso/gasto)
- Categoría (cuotas, subvenciones, gastos operativos, eventos)
- Concepto descriptivo
- Importe
- Justificante adjunto

---

### N4RF29: Plan de Cuentas ENL

**Qué es:** Plan de cuentas específico para Entidades No Lucrativas según RD 1491/2011 para asociaciones de utilidad pública.

**Problema que resuelve:** Las asociaciones de utilidad pública están obligadas al Plan de Contabilidad ENL pero desconocen su aplicación.

**Campos específicos:**
- Fondo social (en lugar de capital social)
- Cuenta 720: Cuotas de asociados
- Cuenta 740: Donaciones
- Tratamiento diferenciado de subvenciones (capital vs corrientes)

---

### N4RF30: Informes Contables para ENL

**Qué es:** Generación de informes contables requeridos para entidades no lucrativas.

**Problema que resuelve:** Los tesoreros no saben generar los informes contables obligatorios para presentar en Asamblea o ante la Administración.

**Campos específicos:**
- Balance de situación
- Cuenta de resultados (Excedente del ejercicio)
- Memoria económica para Asamblea
- Apartado 12 de memoria (obligatorio para utilidad pública)

---

### N4RF31: Alertas de Obligaciones Fiscales

**Qué es:** Sistema de alertas para recordar plazos de presentación de modelos fiscales aplicables.

**Problema que resuelve:** Muchos tesoreros desconocen las obligaciones fiscales y Hacienda ha intensificado los requerimientos.

**Campos específicos:**
- Modelo 182: Declaración de donativos (1-31 enero)
- Modelo 190: Resumen retenciones IRPF (1-31 enero)
- Modelo 111: Retenciones trimestrales (20 abril/julio/octubre/enero)
- Modelo 200: Impuesto Sociedades (25 julio)
- Modelo 347: Operaciones con terceros (febrero)

---

### N4RF32: Control de Umbrales de Exención Fiscal

**Qué es:** Monitorización de los umbrales que determinan la exención de declarar Impuesto de Sociedades.

**Problema que resuelve:** Las entidades no saben si cumplen los requisitos de exención hasta que es demasiado tarde.

**Campos específicos:**
- Ingresos totales ≤ 75.000€
- Rentas no exentas sometidas a retención ≤ 2.000€
- Todas las rentas no exentas con retención aplicada
- Alerta al aproximarse a umbrales

---

### N4RF33: Generación de Datos para Modelo 182

**Qué es:** Exportación de listado de donantes con NIF y cantidades para cumplimentar el Modelo 182.

**Problema que resuelve:** Recopilar manualmente los datos de donantes para el modelo fiscal es tedioso y propenso a errores.

---

### N4RF34: Apertura de Caja por Turnos

**Qué es:** Funcionalidad para abrir caja con fondo inicial asignado a un responsable de turno (específico peñas).

**Problema que resuelve:** Durante las fiestas, las peñas operan un bar con turnos de voluntarios. El control del efectivo es crítico para evitar descuadres.

---

### N4RF35: Registro de Ventas por Turno

**Qué es:** Sistema para registrar ventas durante un turno de caja, manual o con TPV básico.

**Problema que resuelve:** Las ventas se apuntan en papel o no se apuntan, dificultando el control.

---

### N4RF36: Cierre de Turno con Arqueo

**Qué es:** Proceso de cierre de turno con arqueo: efectivo contado vs registrado, identificación de descuadres.

**Problema que resuelve:** Los descuadres de caja generan suspicacias entre voluntarios si no hay un proceso formal.

**Campos específicos:**
- Efectivo contado por el responsable
- Efectivo según registro de ventas
- Diferencia (descuadre)
- Firma del responsable del turno
- Observaciones

---

### N4RF37: Cierre de Evento con Balance

**Qué es:** Consolidación de todos los turnos de un evento en un balance total.

**Problema que resuelve:** No hay visibilidad del resultado económico de un evento hasta que alguien recopila todos los papeles.

---

### N4RF38: Informe de Descuadres

**Qué es:** Generación de informe de descuadres por turno y responsable para investigación.

**Problema que resuelve:** Los descuadres recurrentes pueden indicar errores sistemáticos o irregularidades.

---

## N5: Necesidades de Gestión de Eventos

### N5RF01: Registro de Eventos

**Qué es:** Sistema para crear y gestionar eventos con toda la información relevante.

**Problema que resuelve:** Las actividades se gestionan en calendarios personales, grupos de WhatsApp, o la memoria del organizador.

**Campos específicos:**
- Nombre y descripción
- Tipo de evento (según colectividad)
- Fecha/hora inicio y fin
- Ubicación (con posibilidad de mapa)
- Aforo máximo (si aplica)
- Precio/cuota de inscripción (si aplica)
- Documentación asociada (programa, normas)
- Responsable/organizador

---

### N5RF02: Tipos de Eventos por Colectividad

**Qué es:** Configuración de tipos de eventos específicos para cada tipo de colectividad.

**Problema que resuelve:** Cada tipo de colectividad tiene eventos muy diferentes que requieren información específica.

**Campos específicos:**
- Cofradías: cultos, procesiones, juntas, ensayos de costaleros
- Peñas: fiestas patronales, comidas populares, excursiones, asambleas
- Clubes: entrenamientos, partidos, torneos, asambleas, eventos sociales
- Asociaciones: talleres, conferencias, excursiones, asambleas

---

### N5RF03: Calendario de Actividades

**Qué es:** Vista de calendario con todos los eventos de la entidad, filtrable por tipo.

**Problema que resuelve:** No existe un calendario centralizado de actividades accesible para socios y directivos.

---

### N5RF04: Exportación a Calendarios Externos

**Qué es:** Exportación de eventos en formato iCal para sincronizar con calendarios personales.

**Problema que resuelve:** Los socios quieren tener los eventos en su calendario del móvil sin duplicar información.

---

### N5RF05: Inscripción Online a Eventos

**Qué es:** Sistema para que los socios se inscriban a eventos desde el portal del socio.

**Problema que resuelve:** Las inscripciones llegan por múltiples canales (WhatsApp, email, presencial) y se apuntan donde se puede.

---

### N5RF06: Control de Aforo en Tiempo Real

**Qué es:** Gestión de plazas disponibles con actualización en tiempo real según inscripciones.

**Problema que resuelve:** No hay control real de plazas, lo que genera sobreinscripciones o infrautilización.

---

### N5RF07: Lista de Espera Automática

**Qué es:** Sistema de lista de espera que se activa automáticamente cuando se completa el aforo.

**Problema que resuelve:** Cuando un evento se llena, no hay forma de gestionar las solicitudes adicionales.

---

### N5RF08: Notificación a Lista de Espera

**Qué es:** Notificación automática a la lista de espera cuando se producen bajas.

**Problema que resuelve:** Las cancelaciones no se comunican a quienes esperan plaza.

---

### N5RF09: Cierre Automático de Inscripciones

**Qué es:** Cierre automático de inscripciones en fecha límite configurada.

**Problema que resuelve:** Las inscripciones siguen llegando después de la fecha límite porque no hay control automático.

---

### N5RF10: Inscripción con Pago Vinculado

**Qué es:** Sistema de inscripción que genera automáticamente el cargo correspondiente si el evento tiene coste.

**Problema que resuelve:** La inscripción y el pago se gestionan por separado, generando inconsistencias.

---

### N5RF11: Datos de Inscripción Configurables

**Qué es:** Formulario de inscripción con campos configurables según el tipo de evento.

**Problema que resuelve:** Cada evento requiere información diferente (menú elegido, transporte, alergias) que no se puede recoger de forma estructurada.

**Campos específicos:**
- Socio inscrito (o datos si es externo)
- Fecha de inscripción
- Estado (confirmado, pendiente de pago, cancelado)
- Opciones elegidas (menú, transporte, etc.)
- Información adicional (alergias, necesidades especiales)

---

### N5RF12: Check-in por QR

**Qué es:** Sistema de check-in mediante escaneo del QR del carnet del socio.

**Problema que resuelve:** Saber quién asistió realmente a un evento requiere pasar lista manualmente.

---

### N5RF13: Check-in Manual por Lista

**Qué es:** Interfaz para marcar asistencia manualmente desde una lista de inscritos.

**Problema que resuelve:** No siempre es posible el escaneo de QR y se necesita alternativa.

---

### N5RF14: Registro de Hora de Entrada

**Qué es:** Almacenamiento automático de la hora de check-in de cada asistente.

**Problema que resuelve:** Para ciertos eventos (formaciones subvencionadas) se requiere hora de entrada.

---

### N5RF15: Informe de Asistencia

**Qué es:** Generación de informe comparando asistencia real vs inscritos.

**Problema que resuelve:** No hay visibilidad sobre la tasa de asistencia a eventos.

---

### N5RF16: Exportación para Justificación de Subvenciones

**Qué es:** Exportación de listados de asistencia en formato requerido para justificar subvenciones.

**Problema que resuelve:** La justificación de actividades subvencionadas requiere listados firmados que se preparan manualmente.

---

### N5RF17: Gestión de Comidas Populares

**Qué es:** Módulo específico para gestionar comidas populares durante fiestas (específico peñas).

**Problema que resuelve:** Las comidas populares requieren gestión específica: menús con opciones, alergias, pago anticipado.

**Campos específicos:**
- Gestión de menús con opciones (vegetariano, infantil)
- Registro obligatorio de alergias/intolerancias
- Cobro anticipado (típico 35-50€)
- Lista de comensales para el catering
- Asignación de mesas (opcional)

---

### N5RF18: Control de Alergias en Eventos

**Qué es:** Sistema para registrar y alertar sobre alergias e intolerancias alimentarias de los asistentes.

**Problema que resuelve:** Las alergias no se recogen de forma sistemática, generando riesgos para la salud.

---

### N5RF19: Lista de Comensales para Catering

**Qué es:** Generación de listado consolidado de comensales con menús elegidos para el proveedor de catering.

**Problema que resuelve:** El conteo de menús para el catering se hace manualmente con errores frecuentes.

---

### N5RF20: Generación de Papeletas de Sitio

**Qué es:** Sistema para generar papeletas de sitio para procesiones según antigüedad estricta (específico cofradías).

**Problema que resuelve:** El reparto de posiciones en la procesión es el proceso más complejo de una cofradía, con asignaciones por antigüedad.

---

### N5RF21: Reserva de Insignias y Varas

**Qué es:** Sistema para gestionar la reserva de insignias, varas y elementos del cortejo procesional.

**Problema que resuelve:** Las insignias se reservan informalmente y hay conflictos sobre quién tiene derecho a qué.

---

### N5RF22: Publicación de Listas de Procesión

**Qué es:** Funcionalidad para publicar las listas de asignación de puestos en fecha configurada (típicamente Viernes de Dolores).

**Problema que resuelve:** La publicación de listas genera expectación y debe hacerse en fecha tradicional.

---

### N5RF23: Gestión de Cuadrillas de Costaleros

**Qué es:** Módulo para gestionar cuadrillas de costaleros/portadores con igualás, posiciones y ensayos.

**Problema que resuelve:** La organización de cuadrillas es compleja: igualás digitales, posiciones históricas, control de ensayos.

**Campos específicos:**
- Igualás digitales (medición de altura)
- Registro de costaleros con posiciones históricas
- Asignación a trabajaderas/palos
- Control de asistencia a ensayos
- Gestión de relevos durante procesión

---

### N5RF24: Notificaciones de Ensayos

**Qué es:** Sistema de notificaciones para convocar a costaleros a ensayos.

**Problema que resuelve:** Las convocatorias de ensayo se hacen por WhatsApp sin confirmación formal.

---

### N5RF25: Calendario de Cultos

**Qué es:** Calendario específico para eventos religiosos: novenas, triduos, quinarios, besamanos (específico cofradías).

**Problema que resuelve:** Los cultos tienen una periodicidad y estructura específica que los calendarios genéricos no contemplan.

---

### N5RF26: Control de Aforo en Cultos

**Qué es:** Gestión de aforo para eventos masivos como besamanos con inscripción previa.

**Problema que resuelve:** Los besamanos multitudinarios requieren control de aforo por seguridad.

---

### N5RF27: Calendario de Competición

**Qué es:** Calendario específico para competiciones deportivas: liga, copa, amistosos (específico clubes).

**Problema que resuelve:** Los clubes necesitan gestionar calendarios de competición con partidos, convocatorias y resultados.

---

### N5RF28: Convocatoria de Jugadores

**Qué es:** Sistema para generar convocatorias de jugadores para partidos con límites por categoría.

**Problema que resuelve:** Las convocatorias se hacen por WhatsApp sin control de límites ni confirmaciones.

---

### N5RF29: Control de Sanciones Acumuladas

**Qué es:** Registro y control de sanciones (tarjetas, expulsiones) con alerta de jugadores no convocables.

**Problema que resuelve:** El control de sanciones acumuladas es crítico para evitar alineaciones indebidas que pueden costar partidos.

**Campos específicos:**
- Tarjetas amarillas acumuladas
- Tarjetas rojas
- Partidos de sanción pendientes
- Alerta de jugador sancionado
- Historial de sanciones

---

### N5RF30: Registro de Resultados y Estadísticas

**Qué es:** Sistema para registrar resultados de partidos y estadísticas individuales.

**Problema que resuelve:** Los resultados y estadísticas se pierden o se registran de forma incompleta.

**Campos específicos:**
- Resultado del partido
- Goleadores/anotadores
- Asistencias
- Minutos jugados por jugador
- Incidencias (lesiones, cambios)

---

## N6: Necesidades de Comunicación

### N6RF01: Envío de Comunicaciones por Email

**Qué es:** Sistema de envío masivo de emails a socios, con plantillas y personalización.

**Problema que resuelve:** El email es el canal principal para comunicaciones formales pero se gestiona desde cuentas personales sin control.

---

### N6RF02: Envío de SMS para Urgencias

**Qué es:** Sistema de envío de SMS para comunicaciones urgentes (con coste adicional).

**Problema que resuelve:** Para urgencias el email no es suficiente y WhatsApp tiene limitaciones de privacidad/RGPD.

---

### N6RF03: Notificaciones Push vía PWA

**Qué es:** Sistema de notificaciones push a través de la PWA del portal del socio.

**Problema que resuelve:** No existe un canal propio para notificaciones instantáneas sin depender de WhatsApp.

---

### N6RF04: Tablón de Anuncios Interno

**Qué es:** Espacio de anuncios visible en el portal del socio para comunicaciones internas.

**Problema que resuelve:** Los anuncios importantes se pierden en el ruido de los grupos de WhatsApp.

---

### N6RF05: Segmentación de Destinatarios

**Qué es:** Sistema para segmentar destinatarios de comunicaciones según múltiples criterios.

**Problema que resuelve:** Las comunicaciones se envían a todos o se segmentan manualmente, generando spam o exclusiones involuntarias.

**Campos específicos:**
- Por tipo de socio
- Por estado de pago (al corriente, morosos)
- Por antigüedad
- Por participación en eventos
- Por etiquetas personalizadas
- Combinaciones (ej: 'socios activos mayores de 2 años')

---

### N6RF06: Plantillas de Comunicación

**Qué es:** Biblioteca de plantillas predefinidas y personalizables para comunicaciones frecuentes.

**Problema que resuelve:** Las comunicaciones se redactan desde cero cada vez, con inconsistencias de formato y contenido.

---

### N6RF07: Personalización con Datos del Socio

**Qué es:** Sistema de mail merge para personalizar comunicaciones con datos del socio (nombre, estado, etc.).

**Problema que resuelve:** Las comunicaciones genéricas sin personalización tienen menos impacto y engagement.

---

### N6RF08: Histórico de Comunicaciones

**Qué es:** Registro de todas las comunicaciones enviadas con visualización de qué recibió cada socio.

**Problema que resuelve:** No hay trazabilidad sobre qué comunicaciones se enviaron ni a quién.

---

### N6RF09: Estadísticas de Apertura de Emails

**Qué es:** Tracking de apertura de emails para conocer la efectividad de las comunicaciones.

**Problema que resuelve:** No se sabe si los socios leen las comunicaciones por email.

---

### N6RF10: Notificación Automática de Confirmación de Alta

**Qué es:** Envío automático de email de bienvenida al completar el alta de un socio.

**Problema que resuelve:** Los nuevos socios no reciben confirmación formal de su alta.

---

### N6RF11: Notificación Automática de Recordatorio de Pago

**Qué es:** Envío automático de recordatorio de pago próximo antes del vencimiento.

**Problema que resuelve:** Los socios no son avisados antes del vencimiento de cuotas.

---

### N6RF12: Notificación Automática de Recibo Domiciliado

**Qué es:** Aviso automático al socio cuando se va a pasar un recibo por domiciliación.

**Problema que resuelve:** Los socios se sorprenden con cargos bancarios porque no son avisados previamente.

---

### N6RF13: Notificación Automática de Impago

**Qué es:** Envío automático de aviso cuando se detecta un impago.

**Problema que resuelve:** Los impagos no se comunican de forma sistemática al socio.

---

### N6RF14: Notificación Automática de Convocatoria de Asamblea

**Qué es:** Envío automático de convocatoria de Asamblea con orden del día según plazos estatutarios.

**Problema que resuelve:** Las convocatorias de Asamblea requieren plazos específicos que a veces no se cumplen.

---

### N6RF15: Notificación Automática de Inscripción a Evento

**Qué es:** Confirmación automática de inscripción a evento con detalles relevantes.

**Problema que resuelve:** Los socios no reciben confirmación de que su inscripción se ha registrado correctamente.

---

### N6RF16: Notificación Automática de Recordatorio de Evento

**Qué es:** Recordatorio automático de evento próximo a los inscritos.

**Problema que resuelve:** Los socios olvidan eventos a los que se inscribieron hace tiempo.

---

### N6RF17: Gestión de Libro de Actas Digital

**Qué es:** Sistema para gestionar el libro de actas obligatorio con numeración correlativa automática.

**Problema que resuelve:** El libro de actas es obligatorio (LO 1/2002) pero se hace en Word con numeración manual, generando errores.

---

### N6RF18: Plantillas de Actas por Tipo de Reunión

**Qué es:** Plantillas predefinidas para actas según el tipo de reunión.

**Problema que resuelve:** Cada acta se redacta desde cero sin estructura homogénea.

**Campos específicos:**
- Asamblea General Ordinaria
- Asamblea General Extraordinaria
- Junta Directiva

---

### N6RF19: Campos Obligatorios en Actas

**Qué es:** Validación de campos obligatorios en las actas según normativa.

**Problema que resuelve:** Las actas incompletas pueden ser impugnadas.

**Campos específicos:**
- Fecha y lugar de la reunión
- Asistentes
- Orden del día
- Acuerdos adoptados con resultados de votaciones
- Firma del secretario con VºBº del presidente

---

### N6RF20: Registro de Asistentes con Firma

**Qué es:** Sistema para registrar asistentes a reuniones con firma física o digital.

**Problema que resuelve:** El registro de asistentes se hace en papel y se pierde o no se digitaliza.

---

### N6RF21: Control de Quórum

**Qué es:** Cálculo automático de quórum según estatutos para validar la constitución de la reunión.

**Problema que resuelve:** El cálculo de quórum se hace manualmente y a veces incorrectamente.

---

### N6RF22: Archivo Histórico de Actas

**Qué es:** Repositorio consultable de todas las actas históricas de la entidad.

**Problema que resuelve:** Las actas antiguas están dispersas o inaccesibles para consulta.

---

### N6RF23: Exportación de Actas a PDF

**Qué es:** Generación de PDF del acta para archivo físico o envío.

**Problema que resuelve:** Las actas deben poder imprimirse para su archivo en el libro físico si se requiere.

---

## N7: Necesidades de Gestión Documental

### N7RF01: Repositorio Centralizado de Documentos

**Qué es:** Sistema de almacenamiento centralizado para todos los documentos de la entidad.

**Problema que resuelve:** La documentación está dispersa: estatutos en el email del expresidente, facturas en una carpeta del ordenador del tesorero, actas en papel en un cajón.

---

### N7RF02: Estructura de Carpetas Predefinida

**Qué es:** Organización de documentos en carpetas/categorías predefinidas según las necesidades típicas de colectividades.

**Problema que resuelve:** Sin estructura, los documentos se guardan de forma desordenada y luego no se encuentran.

**Campos específicos:**
- Estatutos y reglamentos
- Actas de reuniones
- Documentación fiscal (modelos, certificados)
- Facturas y justificantes
- Subvenciones (solicitudes, justificaciones)
- Contratos y convenios
- Seguros y pólizas
- Patrimonio (inventarios, valoraciones)
- Comunicaciones oficiales

---

### N7RF03: Metadatos de Documentos

**Qué es:** Sistema de metadatos para describir y clasificar cada documento.

**Problema que resuelve:** Los documentos no tienen descripción ni clasificación, dificultando su búsqueda.

**Campos específicos:**
- Nombre descriptivo
- Categoría/carpeta
- Fecha del documento
- Fecha de subida
- Usuario que subió
- Etiquetas personalizadas
- Descripción/notas

---

### N7RF04: Subida de Documentos Multi-formato

**Qué es:** Soporte para subida de documentos en formatos habituales: PDF, Word, Excel, imágenes.

**Problema que resuelve:** Los documentos llegan en múltiples formatos que deben poder almacenarse.

---

### N7RF05: Previsualización de Documentos

**Qué es:** Visualización de documentos en el navegador sin necesidad de descarga.

**Problema que resuelve:** Descargar cada documento para verlo es tedioso y genera copias locales descontroladas.

---

### N7RF06: Búsqueda de Documentos

**Qué es:** Sistema de búsqueda por nombre, categoría, fecha, etiquetas.

**Problema que resuelve:** Encontrar un documento específico entre cientos requiere abrir carpetas una a una.

---

### N7RF07: Permisos por Carpeta

**Qué es:** Control de acceso a nivel de carpeta (quién puede ver/editar qué documentos).

**Problema que resuelve:** Algunos documentos son confidenciales (expedientes, nóminas) y no deben ser accesibles para todos.

---

### N7RF08: Límite de Almacenamiento por Plan

**Qué es:** Control de espacio de almacenamiento según el plan contratado por la entidad.

**Problema que resuelve:** El almacenamiento tiene coste y debe limitarse para sostenibilidad del modelo SaaS.

---

### N7RF09: Control de Versiones de Documentos

**Qué es:** Historial de versiones de cada documento con posibilidad de restaurar versiones anteriores.

**Problema que resuelve:** Las modificaciones sobrescriben el documento original sin mantener histórico.

---

### N7RF10: OCR para Facturas

**Qué es:** Extracción automática de datos de facturas mediante reconocimiento óptico de caracteres.

**Problema que resuelve:** Los datos de facturas (proveedor, importe, fecha) se teclean manualmente.

---

### N7RF11: Búsqueda en Contenido de Documentos

**Qué es:** Búsqueda full-text dentro del contenido de los documentos, no solo en metadatos.

**Problema que resuelve:** A veces se recuerda una palabra del documento pero no su nombre ni ubicación.

---

### N7RF12: Vinculación de Documentos con Otros Módulos

**Qué es:** Capacidad de vincular documentos con entidades de otros módulos (factura→pago, acta→asamblea).

**Problema que resuelve:** Los documentos están aislados sin conexión con los procesos que los generan.

---

## N8: Necesidades de Importación y Exportación

### N8RF01: Importación de Socios desde Excel/CSV

**Qué es:** Sistema para importar listados de socios desde archivos Excel o CSV.

**Problema que resuelve:** El mayor freno a la adopción es la migración de datos. Si hay que teclear 400 socios, no se usará el sistema.

---

### N8RF02: Mapeo Flexible de Columnas

**Qué es:** Interfaz para mapear las columnas del archivo de importación con los campos del sistema.

**Problema que resuelve:** El Excel de cada entidad es diferente: distintos nombres de columnas, orden, estructura.

---

### N8RF03: Validación Previa con Informe de Errores

**Qué es:** Validación de datos antes de importar con informe detallado de errores.

**Problema que resuelve:** Importar datos erróneos contamina la base de datos y genera más trabajo después.

**Campos específicos:**
- DNI/NIE inválidos
- Emails mal formados
- Fechas en formato incorrecto
- Campos obligatorios vacíos
- Tipos de socio no reconocidos

---

### N8RF04: Gestión de Duplicados en Importación

**Qué es:** Detección y gestión de registros duplicados durante la importación.

**Problema que resuelve:** Los Excel suelen tener duplicados que, si se importan, generan problemas.

**Campos específicos:**
- Detectar duplicados por DNI/NIE
- Opciones: ignorar, sobrescribir, crear como nuevo

---

### N8RF05: Importación de Histórico de Pagos

**Qué es:** Sistema para importar histórico de pagos si la entidad dispone de él.

**Problema que resuelve:** Sin histórico de pagos, se pierde la trazabilidad de morosidad y antigüedad de pago.

---

### N8RF06: Exportación de Listado de Socios

**Qué es:** Exportación de listado de socios completo o filtrado en formatos estándar.

**Problema que resuelve:** Se necesitan listados de socios para múltiples propósitos: Asamblea, banco, subvenciones.

---

### N8RF07: Exportación de Informe de Cuotas y Pagos

**Qué es:** Exportación de informe de cuotas y pagos por ejercicio.

**Problema que resuelve:** El tesorero necesita preparar informes económicos para Asamblea.

---

### N8RF08: Exportación de Libro de Ingresos y Gastos

**Qué es:** Exportación del libro de ingresos y gastos en formato estándar.

**Problema que resuelve:** La contabilidad debe poder exportarse para revisión externa o archivo.

---

### N8RF09: Exportación de Datos para Modelo 182

**Qué es:** Exportación de listado de donantes con NIF y cantidades para cumplimentar Modelo 182.

**Problema que resuelve:** La preparación del Modelo 182 requiere datos en formato específico.

---

### N8RF10: Exportación de Listado de Asistentes a Evento

**Qué es:** Exportación de listado de asistentes/inscritos a un evento.

**Problema que resuelve:** Se necesitan listados de asistentes para el catering, control de acceso, justificación de subvenciones.

---

### N8RF11: Exportación de Histórico de Comunicaciones

**Qué es:** Exportación del registro de comunicaciones enviadas.

**Problema que resuelve:** Para auditorías o disputas puede necesitarse el histórico de comunicaciones.

---

### N8RF12: Formatos de Exportación

**Qué es:** Soporte para múltiples formatos de exportación según el uso previsto.

**Problema que resuelve:** Diferentes usos requieren diferentes formatos.

**Campos específicos:**
- Excel (.xlsx): para trabajo posterior
- CSV: para integración con otros sistemas
- PDF: para presentación formal

---

### N8RF13: Backup Periódico de Datos

**Qué es:** Funcionalidad para exportar un backup completo de los datos de la entidad.

**Problema que resuelve:** Las entidades quieren tener copia de seguridad de sus datos por si acaso.

---

## N9: Necesidades de Visibilidad y Reporting

### N9RF01: Dashboard Principal

**Qué es:** Panel de control visual con las métricas clave de la entidad.

**Problema que resuelve:** Para saber el estado actual, el tesorero tiene que 'cocinar' datos en Excel. La junta opera 'a ciegas'.

---

### N9RF02: KPIs de Socios

**Qué es:** Indicadores clave sobre la masa social actualizados en tiempo real.

**Problema que resuelve:** No hay visibilidad inmediata sobre la evolución de socios.

**Campos específicos:**
- Socios activos en el ejercicio actual
- Comparativa con ejercicio anterior (+/- %)
- Altas y bajas del periodo
- Distribución por tipo de socio

---

### N9RF03: KPIs Económicos

**Qué es:** Indicadores clave sobre la situación económica de la entidad.

**Problema que resuelve:** El tesorero no tiene visibilidad inmediata sobre el estado de recaudación.

**Campos específicos:**
- Cuotas emitidas vs cobradas (% recaudación)
- Importe pendiente de cobro
- Número de morosos y % sobre total
- Ingresos vs gastos del periodo

---

### N9RF04: KPIs de Eventos

**Qué es:** Indicadores sobre próximos eventos e inscripciones.

**Problema que resuelve:** No hay visibilidad centralizada sobre la actividad de eventos.

**Campos específicos:**
- Próximos eventos programados
- Inscripciones por evento
- % de ocupación de aforo

---

### N9RF05: Gráfico de Evolución de Socios

**Qué es:** Visualización gráfica de la evolución del número de socios en los últimos ejercicios.

**Problema que resuelve:** Las tendencias de evolución de socios no son visibles sin gráficos.

---

### N9RF06: Gráfico de Recaudación Mensual

**Qué es:** Visualización gráfica de la recaudación mes a mes.

**Problema que resuelve:** La estacionalidad de cobros no es visible sin gráficos.

---

### N9RF07: Dashboard Adaptado por Rol

**Qué es:** Diferentes vistas de dashboard según el rol del usuario (tesorero ve finanzas, secretario ve socios).

**Problema que resuelve:** Cada rol tiene intereses diferentes y no necesita ver toda la información.

---

### N9RF08: Informe de Socios para Asamblea

**Qué es:** Informe predefinido con datos de socios para presentar en Asamblea General.

**Problema que resuelve:** La preparación de informes para Asamblea es manual y consume mucho tiempo.

---

### N9RF09: Informe Económico para Asamblea

**Qué es:** Informe predefinido con datos económicos para presentar en Asamblea General.

**Problema que resuelve:** El informe económico se prepara manualmente cada año.

---

### N9RF10: Certificado de Estar al Corriente de Pago

**Qué es:** Generación automática de certificado de que un socio está al corriente de pago.

**Problema que resuelve:** Los socios solicitan certificados para acceder a descuentos o acreditar su condición.

---

### N9RF11: Certificado de Composición de Junta

**Qué es:** Generación de certificado de composición de Junta Directiva para el Registro de Asociaciones.

**Problema que resuelve:** El Registro requiere certificado de Junta con datos específicos.

---

### N9RF12: Memoria de Actividades para Subvenciones

**Qué es:** Generación de memoria de actividades con formato para justificación de subvenciones.

**Problema que resuelve:** Las memorias de actividades se redactan desde cero cada vez.

---

## N10: Necesidades de Autoservicio del Socio

### N10RF01: Portal del Socio (PWA)

**Qué es:** Aplicación web progresiva (PWA) para que los socios accedan a sus datos y servicios.

**Problema que resuelve:** Los socios consultan constantemente a la junta: '¿estoy al corriente?', '¿cuándo es la próxima actividad?'. Esto genera carga de trabajo.

---

### N10RF02: Consulta de Datos Personales

**Qué es:** Visualización de los datos personales del socio con opción de solicitar modificación.

**Problema que resuelve:** Los socios no pueden ver ni actualizar sus datos sin contactar a la junta.

---

### N10RF03: Consulta de Estado de Cuotas

**Qué es:** Visualización del estado de cuotas del socio (pagado/pendiente).

**Problema que resuelve:** Los socios no saben si están al corriente sin preguntar al tesorero.

---

### N10RF04: Descarga de Recibos y Justificantes

**Qué es:** Acceso a recibos y justificantes de pago para descarga.

**Problema que resuelve:** Los socios necesitan justificantes de pago y tienen que solicitarlos al tesorero.

---

### N10RF05: Acceso al Carnet Digital

**Qué es:** Visualización y descarga del carnet digital con QR desde el portal.

**Problema que resuelve:** Los carnets físicos se pierden y no hay alternativa digital accesible.

---

### N10RF06: Consulta de Calendario de Eventos

**Qué es:** Visualización del calendario de eventos de la entidad desde el portal.

**Problema que resuelve:** Los socios no tienen acceso centralizado al calendario de actividades.

---

### N10RF07: Inscripción a Eventos desde Portal

**Qué es:** Funcionalidad para inscribirse a eventos con inscripción abierta desde el portal.

**Problema que resuelve:** Las inscripciones requieren contactar a la junta o usar canales dispersos.

---

### N10RF08: Consulta de Avisos y Comunicaciones

**Qué es:** Bandeja de entrada con avisos y comunicaciones recibidas de la entidad.

**Problema que resuelve:** Las comunicaciones se pierden en el email o WhatsApp sin archivo accesible.

---

### N10RF09: Acceso a Documentos Públicos

**Qué es:** Acceso a documentos públicos de la entidad (estatutos, actas aprobadas).

**Problema que resuelve:** Los socios no pueden consultar estatutos o actas sin solicitarlos.

---

### N10RF10: Actualización de Preferencias de Comunicación

**Qué es:** Configuración de preferencias de comunicación (email, SMS, push).

**Problema que resuelve:** Los socios no pueden elegir cómo quieren ser contactados.

---

### N10RF11: Gestión de Consentimientos RGPD

**Qué es:** Interfaz para consultar y gestionar los consentimientos otorgados.

**Problema que resuelve:** Los socios no tienen visibilidad ni control sobre sus consentimientos RGPD.

---

### N10RF12: PWA Instalable

**Qué es:** Aplicación web instalable en el móvil como si fuera una app nativa.

**Problema que resuelve:** Los socios esperan una experiencia similar a una app móvil sin necesidad de stores.

---

### N10RF13: Acceso con Email y Contraseña

**Qué es:** Sistema de autenticación con email y contraseña para el portal del socio.

**Problema que resuelve:** Se necesita un sistema de acceso seguro y sencillo.

---

### N10RF14: Acceso con Enlace Mágico

**Qué es:** Sistema de acceso mediante enlace único enviado por email (magic link).

**Problema que resuelve:** Muchos socios olvidan contraseñas y necesitan alternativa sin fricción.

---

### N10RF15: Consentimiento para Notificaciones Push

**Qué es:** Solicitud de consentimiento explícito para recibir notificaciones push.

**Problema que resuelve:** Las notificaciones push requieren consentimiento según normativa.

---

## N11: Necesidades de Cumplimiento Normativo

### N11RF01: Registro de Actividades de Tratamiento (RAT)

**Qué es:** Plantilla precargada del RAT obligatorio para cualquier responsable de tratamiento de datos.

**Problema que resuelve:** Las asociaciones son responsables del tratamiento de datos pero desconocen la obligación del RAT.

**Campos específicos:**
- Finalidades del tratamiento
- Categorías de datos tratados
- Destinatarios de los datos
- Plazos de conservación

---

### N11RF02: Gestión de Consentimientos

**Qué es:** Sistema para registrar consentimientos con fecha, texto y posibilidad de revocación.

**Problema que resuelve:** Los consentimientos no se registran formalmente, generando riesgo legal.

**Campos específicos:**
- Comunicaciones de la entidad
- Comunicaciones comerciales de terceros
- Uso de imagen en redes sociales/web
- Cesión a federación (clubes deportivos)
- Fecha de otorgamiento
- Texto exacto del consentimiento
- Fecha de revocación (si aplica)

---

### N11RF03: Ejercicio del Derecho de Acceso

**Qué es:** Funcionalidad para exportar todos los datos de un socio en respuesta al derecho de acceso.

**Problema que resuelve:** Los socios pueden ejercer su derecho de acceso y la entidad debe responder en 1 mes.

---

### N11RF04: Ejercicio del Derecho de Rectificación

**Qué es:** Workflow para gestionar solicitudes de rectificación de datos.

**Problema que resuelve:** Las solicitudes de rectificación se gestionan informalmente sin registro.

---

### N11RF05: Ejercicio del Derecho de Supresión

**Qué es:** Proceso para gestionar el derecho al olvido con las limitaciones legales aplicables.

**Problema que resuelve:** La supresión de datos tiene limitaciones legales (obligaciones fiscales, laborales) que deben respetarse.

---

### N11RF06: Ejercicio del Derecho de Portabilidad

**Qué es:** Exportación de datos en formato estructurado para cumplir el derecho de portabilidad.

**Problema que resuelve:** Los socios pueden solicitar sus datos en formato portátil.

---

### N11RF07: Base Jurídica para Tratamiento de Datos Religiosos

**Qué es:** Configuración específica para cofradías que pueden tratar datos religiosos bajo excepción del art. 9.2.d RGPD.

**Problema que resuelve:** Las cofradías tratan datos de convicciones religiosas que requieren base jurídica específica.

---

### N11RF08: Libro de Socios Digital

**Qué es:** Generación del Libro de Socios obligatorio según LO 1/2002 con relación actualizada de asociados.

**Problema que resuelve:** El libro de socios es obligatorio pero se mantiene de forma desactualizada o inexistente.

---

### N11RF09: Libro de Actas Digital

**Qué es:** Gestión del Libro de Actas obligatorio según LO 1/2002 (ver N6RF17-N6RF23).

**Problema que resuelve:** Ya cubierto en sección de Comunicación, este RF sirve como referencia cruzada.

---

### N11RF10: Inventario de Bienes

**Qué es:** Registro del inventario de bienes de la entidad, obligatorio según LO 1/2002.

**Problema que resuelve:** El inventario de bienes es obligatorio pero rara vez se mantiene actualizado.

**Campos específicos:**
- Descripción del bien
- Fecha de adquisición
- Valor estimado
- Estado de conservación
- Ubicación
- Fotografía
- Seguro asociado (si aplica)

---

### N11RF11: Validación de Asamblea General Anual

**Qué es:** Control de que se celebra al menos una Asamblea General al año según obliga la LO 1/2002.

**Problema que resuelve:** Algunas entidades olvidan celebrar la Asamblea anual obligatoria.

---

### N11RF12: Validación de Junta Directiva

**Qué es:** Control de que los miembros de Junta Directiva son asociados mayores de edad según LO 1/2002.

**Problema que resuelve:** La composición de la Junta tiene requisitos legales que deben validarse.

---

### N11RF13: Alerta de Comunicación al Registro

**Qué es:** Sistema de alertas para comunicar alteraciones sustanciales al Registro en el plazo de 1 mes.

**Problema que resuelve:** Las comunicaciones al Registro tienen plazo y consecuencias si se incumplen.

**Campos específicos:**
- Cambio de junta directiva
- Modificación de estatutos
- Cambio de domicilio

---

### N11RF14: Alerta de Asamblea General

**Qué es:** Recordatorio para celebrar la Asamblea General anual obligatoria.

**Problema que resuelve:** Sin recordatorio, algunas entidades olvidan convocar la Asamblea.

---

### N11RF15: Alerta de Renovación de Junta

**Qué es:** Recordatorio de renovación de cargos según el mandato establecido en estatutos.

**Problema que resuelve:** Las juntas directivas caducan según estatutos y hay que renovarlas.

---

### N11RF16: Alerta de Plazos Fiscales

**Qué es:** Recordatorios de plazos de presentación de modelos fiscales aplicables.

**Problema que resuelve:** Los plazos fiscales se desconocen o se olvidan, generando sanciones.

---

### N11RF17: Alerta de Caducidad de Documentos

**Qué es:** Alertas de caducidad de seguros, certificados y otros documentos con fecha de vencimiento.

**Problema que resuelve:** Los seguros y certificados caducan sin que nadie se entere hasta que es tarde.

---

## N12: Necesidades Específicas por Tipo de Colectividad

### N12RF01: Inventario de Patrimonio para Cofradías

**Qué es:** Registro detallado de pasos, imágenes, orfebrería y textiles con fotografías y valoración.

**Problema que resuelve:** Las cofradías tienen patrimonio valioso que no está inventariado ni valorado adecuadamente.

**Campos específicos:**
- Tipo de bien (paso, imagen, orfebrería, textil)
- Descripción detallada
- Autor/artesano (si conocido)
- Fecha de adquisición/donación
- Valor estimado para seguro
- Estado de conservación
- Fotografías desde múltiples ángulos
- Historial de restauraciones

---

### N12RF02: Gestión de Túnicas y Enseres

**Qué es:** Sistema de préstamo de túnicas y enseres con fianza, plazo de devolución y control de estado.

**Problema que resuelve:** Las túnicas se prestan sin control formal, generando pérdidas y deterioros no atribuibles.

**Campos específicos:**
- Elemento prestado (túnica, vara, etc.)
- Hermano receptor
- Fecha de préstamo y devolución prevista
- Fianza depositada (si aplica)
- Estado a la entrega
- Estado a la devolución
- Incidencias registradas

---

### N12RF03: Gestión de Seguros de Procesión

**Qué es:** Control de seguros específicos de procesión: RC, suspensión por lluvia, accidentes de costaleros.

**Problema que resuelve:** Los seguros de procesión tienen coberturas específicas que deben controlarse.

**Campos específicos:**
- Responsabilidad Civil
- Suspensión por lluvia
- Accidentes de costaleros
- Cobertura de patrimonio durante procesión

---

### N12RF04: Programación de Fiestas

**Qué es:** Calendario de actos de fiestas con coordinación con InterPeñas (específico peñas festeras).

**Problema que resuelve:** La programación de fiestas requiere coordinación con otras peñas y el ayuntamiento.

---

### N12RF05: Gestión de Turnos de Voluntarios

**Qué es:** Sistema para gestionar disponibilidad y asignación de turnos de voluntarios para barra y servicios.

**Problema que resuelve:** Los turnos de voluntarios se gestionan en papel o WhatsApp con frecuentes huecos.

**Campos específicos:**
- Turnos disponibles (fecha, hora, servicio)
- Voluntarios disponibles por turno
- Asignación de responsable por turno
- Confirmación de asistencia
- Cobertura de ausencias

---

### N12RF06: Control de Stock de Bar

**Qué es:** Gestión de inventario de bebidas y productos de bar durante fiestas.

**Problema que resuelve:** El stock de bar se controla a ojo o se queda corto/sobra sin análisis.

**Campos específicos:**
- Producto
- Stock inicial
- Entradas (compras)
- Salidas (ventas)
- Stock final
- Alertas de reposición

---

### N12RF07: Gestión de Carrozas

**Qué es:** Módulo para gestionar la construcción de carrozas: presupuesto, materiales, equipos de montaje.

**Problema que resuelve:** La construcción de carrozas implica gestión de presupuesto, compras y equipos de trabajo.

---

### N12RF08: Gestión de Licencias Federativas

**Qué es:** Tramitación y renovación de licencias federativas con control de documentación requerida.

**Problema que resuelve:** Las licencias federativas tienen requisitos documentales y plazos que se gestionan manualmente.

**Campos específicos:**
- Tipo de licencia
- Federación
- Fecha de expedición
- Fecha de caducidad
- Documentación aportada
- Estado (solicitada, vigente, caducada)

---

### N12RF09: Gestión de Equipos y Categorías

**Qué es:** Organización de deportistas en equipos por categoría con histórico deportivo.

**Problema que resuelve:** La gestión de plantillas por categoría se hace en Excel sin histórico.

**Campos específicos:**
- Equipo/categoría
- Temporada
- Plantilla de jugadores
- Cuerpo técnico
- Resultados de la temporada

---

### N12RF10: Reserva de Instalaciones

**Qué es:** Sistema de reserva de instalaciones deportivas, con posible integración con sistemas municipales.

**Problema que resuelve:** Las reservas de instalaciones se hacen por teléfono o email sin confirmación formal.

---

### N12RF11: Gestión de Desplazamientos

**Qué es:** Coordinación de transporte para partidos fuera: vehículos, dietas, permisos de menores.

**Problema que resuelve:** Los desplazamientos se organizan informalmente sin control de costes ni permisos.

**Campos específicos:**
- Partido/destino
- Transporte (propio, alquilado, particular)
- Convocados para desplazamiento
- Permisos de menores firmados
- Dietas asignadas

---

### N12RF12: Gestión de Equipaciones

**Qué es:** Inventario de equipaciones deportivas con control de tallas y entrega a deportistas.

**Problema que resuelve:** Las equipaciones se reparten sin control de stock ni tallas.

---

### N12RF13: Justificación de Subvenciones

**Qué es:** Módulo para preparar justificaciones de subvenciones: memorias, facturas categorizadas, plazos.

**Problema que resuelve:** La justificación de subvenciones es compleja y se hace a última hora con riesgo de reintegro.

**Campos específicos:**
- Subvención (convocatoria, importe)
- Actividades justificables
- Facturas vinculadas categorizadas
- Memoria de actividades
- Plazo de justificación
- Estado (pendiente, presentada, aprobada)

---

### N12RF14: Gestión de Actividades Formativas

**Qué es:** Gestión de actividades formativas con inscripciones, materiales y evaluación.

**Problema que resuelve:** Las actividades formativas requieren gestión específica de materiales y asistencia.

---

### N12RF15: Control de Asistencia a Formación

**Qué es:** Sistema de control de asistencia para actividades formativas subvencionables.

**Problema que resuelve:** Las subvenciones de formación exigen control de asistencia documentado.

---

## N13: Contexto Aragonés - Especificidades

### N13RF01: Integración con Registro de Asociaciones de Aragón

**Qué es:** Soporte para la documentación y trámites específicos del Registro de Asociaciones de Aragón (Decreto 260/2012).

**Problema que resuelve:** El Registro de Aragón tiene requisitos y formatos específicos.

**Campos específicos:**
- Unidades territoriales (Zaragoza, Huesca, Teruel)
- Soporte para inscripción telemática con DNIe o Cl@ve
- Plantilla de estatutos según modelo oficial aragonés
- Tasa de inscripción (23€)

---

### N13RF02: Soporte para InterPeñas de Teruel

**Qué es:** Funcionalidades específicas para la coordinación con la Federación InterPeñas de las Fiestas del Ángel.

**Problema que resuelve:** Las 21 peñas turolenses coordinan su actividad a través de InterPeñas con rotación anual de presidencia.

---

### N13RF03: Soporte para Cofradías del Bajo Aragón

**Qué es:** Funcionalidades específicas para las cofradías de la Ruta del Tambor y Bombo.

**Problema que resuelve:** Las cofradías del Bajo Aragón tienen tradiciones específicas (rompida de la hora, etc.) que requieren gestión diferenciada.

---

### N13RF04: Catálogo de Subvenciones Aragonesas

**Qué es:** Base de datos actualizada de subvenciones disponibles en Aragón para colectividades.

**Problema que resuelve:** Las entidades desconocen las subvenciones disponibles del Gobierno de Aragón y diputaciones provinciales.

**Campos específicos:**
- Gobierno de Aragón: 140.000€/año para actividades culturales (1.000-12.000€/beneficiario)
- Diputación de Teruel: 170.000€ en acción social, 92.000€ para clubes deportivos (máx 7.000€/beneficiario)
- Plazos de solicitud y justificación
- Requisitos de documentación

---

## Resumen de Requisitos Funcionales

| Sección | Nº RFs | Rango |
|---------|--------|-------|
| N2: Arquitectura y Acceso al Sistema | 8 | N2RF01 - N2RF08 |
| N3: Gestión de Socios/Miembros | 34 | N3RF01 - N3RF34 |
| N4: Tesorería y Finanzas | 38 | N4RF01 - N4RF38 |
| N5: Gestión de Eventos | 30 | N5RF01 - N5RF30 |
| N6: Comunicación | 23 | N6RF01 - N6RF23 |
| N7: Gestión Documental | 12 | N7RF01 - N7RF12 |
| N8: Importación y Exportación | 13 | N8RF01 - N8RF13 |
| N9: Visibilidad y Reporting | 12 | N9RF01 - N9RF12 |
| N10: Autoservicio del Socio | 15 | N10RF01 - N10RF15 |
| N11: Cumplimiento Normativo | 17 | N11RF01 - N11RF17 |
| N12: Específicas por Tipo de Colectividad | 15 | N12RF01 - N12RF15 |
| N13: Contexto Aragonés | 4 | N13RF01 - N13RF04 |
| **TOTAL** | **221** | |