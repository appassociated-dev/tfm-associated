# Sesión Agente: 20260328-001-acester-CLAUDECODE

- **Agente de IA:** Claude Opus 4.6 (1M context) via Claude Code
- **Fecha creación:** 28 de marzo de 2026
- **Hora de inicio:** 11:00
- **Hora de últimos trabajos:** 18:32

---

## 📋 Resumen de la Sesión

Definición colaborativa de la nueva estrategia de eventos del proyecto Associated (Domain Events vs Integration Events) y reformulación completa de las especificaciones para alinearlas con la estrategia acordada. Flujo SDD completo: explore → propose → tasks → apply → verify → archive.

---

## 🎯 Objetivos

- [x] Definir estrategia de publicación y consumo de Integration Events (cross-BC)
- [x] Definir estrategia de Domain Events (intra-BC)
- [x] Definir schemas de ambas tablas outbox_event (main DB y tenant DB)
- [x] Definir patrón de publisher y OutboxProcessor
- [x] Reformular todas las spec/ para alinearlas con la nueva estrategia
- [x] Verificar consistencia total de la reformulación

---

## 💼 Trabajo Realizado

### 18:30 - Revisión de contexto previo y análisis de gaps

**Descripción:**
Se recuperó de engram el análisis previo (observation #811) que identificaba 5 gaps críticos entre la spec (ADR-008 Outbox Pattern) y la implementación actual. Se lanzó un SDD explore para validar los gaps contra el código actual.

**Resultados:**

- ✅ Gaps confirmados y ampliados: se encontraron 2 gaps adicionales (OutboxProcessor no registrado en módulo NestJS, Identity BC sin publishers)
- ✅ Se identificó BC-Treasury como el más completo (10+ eventos publicados correctamente)

---

### 18:30 - Decisión arquitectónica: nueva estrategia de eventos

**Descripción:**
El usuario rechazó el approach de multi-tenant loop (iterar todas las DBs de tenant por tick) y propuso que los Integration Events vivan en main DB. Se definió colaborativamente la estrategia completa a través de varias rondas de discusión.

**Decisiones técnicas:**

1. **Domain Events (intra-BC) = audit-only, write-only**
   - Viven en tabla `outbox_event` de tenant DB
   - Se escriben en la misma transacción que la operación de dominio
   - Sin despacho (no EventBus.publish()), sin consumers
   - Toda lógica intra-BC va directamente en command handlers
   - Alternativa descartada: despacho síncrono vía EventBus (añade indirección innecesaria)

2. **Integration Events (cross-BC) = Outbox Pattern en main DB**
   - Viven en tabla `outbox_event` de main DB con `tenant_id`
   - Un único IntegrationEventPublisher compartido en shared/
   - OutboxProcessor único lee de main DB: polling 5s, batch 50, mutex, stale recovery
   - Consumers: @EventsHandler en BCs destino
   - Alternativa descartada: multi-tenant loop iterando N tenant DBs

3. **Dual-write MVP (Opción A)**
   - Domain op commitea en tenant DB, luego best-effort write a main DB
   - Riesgo mínimo (mismo server PostgreSQL)
   - Migración futura a CDC si escala

4. **Idempotencia**
   - Default: natural por lógica de negocio (upserts, checks de existencia)
   - Fallback: check de event_id en dominio del consumer (no tabla genérica)

5. **Verificación contra spec (doc-spec-manager)**
   - Se encontraron 5 casos donde BCs se auto-consumen eventos (Treasury: SepaMandateRegistered, SubscriptionCreated, etc.)
   - TODOS mitigables moviendo lógica al command handler directamente
   - La spec describe el QUÉ, no el CÓMO

**Schemas definidos:**

- **Tenant DB (audit):** id, bounded_context, event_type, aggregate_id, aggregate_type, payload (JSONB), actor_id, occurred_at
- **Main DB (integration):** id, tenant_id, bounded_context, event_type, aggregate_id, aggregate_type, payload (JSONB), actor_id, status, retry_count, max_retries, created_at, processed_at

---

### 18:30 - SDD: Reformulación de especificaciones (event-strategy-spec-reformulation)

**Descripción:**
Flujo SDD completo para reformular todas las spec/ y alinearlas con la nueva estrategia de eventos. 15 tareas atómicas en 5 fases.

**Archivos modificados:**

- `spec/006_adrs.md` - ADR-004 y ADR-008 reescritos completamente + fix anchor índice
- `spec/004_rnf-base.md` - RNF-067 "Entrega Garantizada de Integration Events" creado
- `spec/005_modelo-dominio.md` - §9.5 reescrita, columna "Tipo" en 6 tablas BC, §8.5 reclasificada, changelog actualizado
- `spec/012_modelo-de-datos.md` - ENT-006 (main DB integration) y ENT-017 (tenant DB audit) reescritos, trazabilidad RNF-015→RNF-067 corregida
- `spec/010_casos-uso.md` - UC-047 re-arquitectado (OutboxProcessor reemplaza @OnEvent), UC-048 corregido (llamada directa), refs dispersas
- `spec/glosario-traducciones.md` - Definiciones y terminología actualizadas
- `spec/analisis-documentacion.md` - Renames cosméticos + trazabilidad
- `spec/mapa-documentacion.md` - Renames cosméticos
- `spec/README.md` - Renames cosméticos

**Fases ejecutadas:**

- Fase A: ADRs + RNF (fundamento)
- Fase B: Modelo de dominio (paralelo con C)
- Fase C: Modelo de datos (paralelo con B)
- Fase D: Casos de uso
- Fase E: Archivos de soporte

**Verificación:**

- 10 checks ejecutados: todos PASS
- 3 warnings encontrados y corregidos (anchor roto, changelog v1.5, UC-048 @OnEvent)
- Re-verificación: PASS limpio
- Zero terminología legacy residual en todo spec/

**Resultados:**

- ✅ Renombrado global: "Business Events" → "Integration Events", "Internal Events" → "Domain Events"
- ✅ RNF-067 creado para entrega garantizada
- ✅ Trazabilidad rota RNF-015 corregida
- ✅ Todas las tablas de eventos reclasificadas con columna Tipo
- ✅ SDD archivado en engram

---

## 🔄 Próximos Pasos

- [ ] Iniciar SDD `domain-events-infrastructure` para implementación en código (OutboxProcessor, IntegrationEventPublisher, migraciones Prisma)

---

## 📝 Notas y Aprendizajes

### Lecciones Técnicas

- El multi-tenant loop (iterar N tenant DBs por tick) es arquitectónicamente inaceptable para procesamiento de outbox — centralizar en main DB con tenant_id
- Domain Events intra-BC como audit-only simplifica MUCHO la arquitectura — los consumers síncronos intra-BC no aportan nada vs llamada directa
- La spec describe el QUÉ (la acción debe ocurrir) no el CÓMO (via event vs llamada directa) — validado contra doc-spec-manager

### Decisiones Arquitectónicas

- Domain Events = audit-only, write-only en tenant DB. Sin despacho, sin consumers.
- Integration Events = Outbox Pattern en main DB. Processor único, publisher compartido.
- Dual-write MVP: best-effort. CDC futuro.
- Idempotencia natural (upserts) como default, event_id check como fallback.
- Nuevo RNF-067 para entrega garantizada (at-least-once).
- Self-consuming events (Treasury) → lógica movida a command handlers.

### Problemas Encontrados

**Referencia RNF-015 rota:**

- **Descripción:** ENT-006 y ENT-017 referenciaban "RNF-015 (entrega garantizada de eventos)" pero RNF-015 es "Tiempo de Respuesta de Páginas"
- **Solución:** Crear RNF-067 como el RNF correcto y redirigir trazabilidad
- **Prevención:** Verificar cross-references al crear entidades en spec/

**Symlink spec/ y lint-staged:**

- **Descripción:** spec/ es symlink a ../seedspec/spec. lint-staged hace git stash que falla con archivos tras symlink
- **Solución:** git rm --cached -r spec/ para dejar de trackear los archivos en este repo
- **Prevención:** Excluir spec/ de lint-staged y no staged archivos de symlinks

---

## 📊 Métricas de la Sesión

- **Duración total:** ~7 horas 30 minutos
- **Archivos modificados:** 9 (todos en spec/)
- **Archivos creados:** 0 (RNF-067 añadido a archivo existente)
- **Commits realizados:** 0 (pendiente por usuario)
- **Tests creados/modificados:** 0
- **Líneas añadidas:** ~440
- **Líneas eliminadas:** ~341

---

## 🔗 Referencias

- Engram observations: #811 (análisis previo), #836 (explore infra), #837 (event strategy), #839 (explore spec), #841 (proposal), #843 (tasks), #845 (verify)
- SDD archivado: `sdd/event-strategy-spec-reformulation`
- Branch: `mvp/frontend-fase1`

---

**Estado final:** Completada
**Próxima sesión:** Regenerar references/ via doc-spec-generator y evaluar inicio de SDD domain-events-infrastructure para implementación en código
