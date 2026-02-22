# Task 1 — UC-064: Dashboard principal y KPIs (Backend)

## Información general

- **Fase:** 3
- **Tipo:** Backend
- **UC:** UC-064
- **Bounded Context:** Transversal (lectura de BC-Membership, BC-Treasury)
- **Application Service:** `DashboardService`
- **Aggregates:** Lectura transversal de `Member`, `MemberAccount`, `Charge`, `Payment`, `FiscalYear`
- **Prioridad:** Must

## Alcance

### Incluido

- Application Service `DashboardService` como BFF (Backend For Frontend) de solo lectura
- Endpoints REST de KPIs organizados por módulo:
  - KPIs de membresía: total socios activos, altas/bajas del mes, distribución por tipo de socio, distribución por estado
  - KPIs de tesorería: recaudación del mes, recaudación del ejercicio, saldo pendiente total, tasa de morosidad, cargos pendientes
  - KPIs generales: alertas y acciones pendientes
- Consultas optimizadas con agregaciones en BD (COUNT, SUM, GROUP BY)
- Caché de KPIs con TTL configurable (por defecto 5 minutos)
- Adaptación por rol: el endpoint filtra widgets según permisos del usuario
- Manejo de errores aislados: si un BC falla, los demás KPIs se devuelven igualmente
- Ports para consulta cross-BC: `MembershipStatsPort`, `TreasuryStatsPort`
- Tests unitarios + tests de integración

### Excluido

- KPIs de BC-Events y BC-Communication (fuera del MVP, estos BCs no están implementados)
- WebSocket para actualización en tiempo real (en MVP se usa polling desde frontend)
- Tabla materializada / pre-agregación (optimización post-MVP; en MVP se calculan en tiempo real)
- Caché en Redis (en MVP se usa caché en memoria con TTL; Redis se añade post-MVP)
- Exportación de KPIs a PDF/Excel (solo API JSON)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 1 — Todos los backends** | Datos de socios, cargos, pagos, ejercicios disponibles en BD |
| **Fase 2 — UC-020, UC-023, UC-024** | Datos de cargos manuales, remesas, devoluciones para KPIs completos |
| **Fase 1 — UC-002** | Autenticación y claims JWT con permisos para filtrar widgets por rol |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] Tablas `members`, `member_accounts`, `charges`, `payments`, `fiscal_years` contienen datos de prueba
- [ ] JWT incluye claims `permissions: string[]` y `role: string` para filtrar KPIs por rol
- [ ] Índices básicos existen en tablas principales (status, created_at, fiscal_year_id)
- [ ] Al menos un ejercicio fiscal abierto con socios y cargos para producir KPIs significativos

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Endpoint `GET /dashboard/kpis` | Frontend UC-064 (dashboard) |
| Endpoint `GET /dashboard/membership-stats` | Frontend UC-064 (widgets de membresía) |
| Endpoint `GET /dashboard/treasury-stats` | Frontend UC-064 (widgets de tesorería) |
| Endpoint `GET /dashboard/alerts` | Frontend UC-064 (widget de alertas) |
| Ports `MembershipStatsPort`, `TreasuryStatsPort` | UC-065 (gráficos, reutiliza ports de consulta) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-064.md` | Flujo: widgets por rol, KPIs, alertas, manejo de errores aislados |
| `us/us-161.md` a `us/us-164.md` | Criterios por tipo de KPI |
| `bc/bc-membership.md` | Aggregate Member — estados, tipos, conteos |
| `bc/bc-treasury.md` | Aggregates MemberAccount, Charge, Payment — saldos, recaudación, morosidad |
| `rnft/rnft-017.md` | Performance: dashboard carga en <2s |
| `rnft/rnft-019.md` | Caching de métricas agregadas |

## Puntos críticos

1. **Consultas cross-BC sin violar aislamiento.** El `DashboardService` consulta datos de BC-Membership y BC-Treasury a través de ports de solo lectura. No accede directamente a los aggregates ni modifica datos. Las queries son de agregación (COUNT, SUM, GROUP BY) ejecutadas directamente en BD del tenant para performance.

2. **Adaptación por rol.** El Tesorero ve KPIs económicos (recaudación, morosidad, saldo). El Secretario ve KPIs de socios (altas, bajas, distribución). El Presidente ve todo. Un Vocal sin permisos específicos ve solo alertas. El filtrado se hace en backend basándose en los claims JWT.

3. **Errores aislados por módulo.** Si la consulta de tesorería falla (timeout, error BD), los KPIs de membresía se devuelven normalmente. El endpoint retorna un campo `errors: { module: string, message: string }[]` para que el frontend muestre widgets parciales con mensaje de error en los módulos afectados.

4. **Rendimiento <2s.** Las queries de agregación deben ejecutarse en paralelo con `Promise.all`. Caché en memoria con TTL de 5 minutos para evitar recálculos en cada request. Índices en columnas de filtro: `members.status`, `charges.status`, `payments.payment_date`.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Queries lentas con muchos socios (>10k) | Media | Alto | Índices en columnas de agregación. Caché TTL 5min. Limitar período a ejercicio actual por defecto |
| Datos inconsistentes entre BCs | Baja | Medio | Queries de solo lectura contra misma BD de tenant. Eventual consistency aceptable para dashboard |
| Caché en memoria consume mucha RAM | Baja | Bajo | TTL corto (5min). Máximo 1 entrada por tenant. Evict automático |

## Plan de implementación

### Paso 1: Capa de dominio — Ports de consulta estadística

Crear en `api/src/dashboard/domain/ports/`:

- **`MembershipStatsPort`** (interfaz):
  - `countByStatus(tenantId: string): Promise<Record<string, number>>` — {ACTIVE: 340, LEAVE_VOLUNTARY: 12, ...}
  - `countByType(tenantId: string): Promise<Record<string, number>>` — {Numerario: 280, Honorario: 40, ...}
  - `countNewMembers(tenantId: string, fromDate: Date, toDate: Date): Promise<number>`
  - `countLeaves(tenantId: string, fromDate: Date, toDate: Date): Promise<number>`
  - `getTotalActive(tenantId: string): Promise<number>`

- **`TreasuryStatsPort`** (interfaz):
  - `getCollectionForPeriod(tenantId: string, fromDate: Date, toDate: Date): Promise<{ total: number, count: number }>` — en centavos
  - `getPendingBalance(tenantId: string): Promise<number>` — saldo total pendiente en centavos
  - `getDelinquencyRate(tenantId: string): Promise<number>` — porcentaje de socios con cargos vencidos
  - `getPendingChargesCount(tenantId: string): Promise<number>`
  - `getCollectionByMethod(tenantId: string, fromDate: Date, toDate: Date): Promise<Record<string, number>>` — distribución por método de pago

### Paso 2: Capa de dominio — Value Objects de respuesta

Crear en `api/src/dashboard/domain/value-objects/`:

- **`MembershipKpis`**: `{ totalActive, newThisMonth, leavesThisMonth, byStatus: Record, byType: Record }`
- **`TreasuryKpis`**: `{ collectionThisMonth, collectionThisYear, pendingBalance, delinquencyRate, pendingCharges, byPaymentMethod: Record }`
- **`DashboardAlerts`**: `{ pendingActions: Alert[] }` donde `Alert = { type, message, severity, link }`
- **`DashboardResponse`**: `{ membership?: MembershipKpis, treasury?: TreasuryKpis, alerts: DashboardAlerts, errors: ModuleError[], cachedAt: Date }`

### Paso 3: Capa de aplicación — DashboardService

Crear en `api/src/dashboard/application/services/dashboard.service.ts`:

- **`DashboardService`**:
  - `getKpis(tenantId: string, userPermissions: string[], period?: { from: Date, to: Date }): Promise<DashboardResponse>`
    1. Determinar módulos visibles según permisos: `membership:*` → KPIs membresía, `treasury:*` → KPIs tesorería
    2. Verificar caché en memoria (key: `dashboard:${tenantId}:${permissionsHash}`)
    3. Si caché válido (TTL < 5min): retornar caché
    4. Ejecutar queries en paralelo con `Promise.allSettled`:
       - Si tiene permisos membresía: `membershipStatsPort.countByStatus()`, `.countByType()`, `.countNewMembers()`, `.countLeaves()`
       - Si tiene permisos tesorería: `treasuryStatsPort.getCollectionForPeriod()`, `.getPendingBalance()`, `.getDelinquencyRate()`
    5. Para cada query `rejected`: añadir a `errors[]` con módulo y mensaje
    6. Construir `DashboardResponse` con resultados `fulfilled`
    7. Generar alertas: cargos vencidos >30 días, remesas en borrador, socios sin mandato SEPA
    8. Cachear resultado y retornar

### Paso 4: Capa de infraestructura — Adapters de stats

Crear en `api/src/dashboard/infrastructure/adapters/`:

- **`PrismaMembershipStatsAdapter`**: Implementa `MembershipStatsPort`
  - Usa `PrismaTenantService` para queries directas contra BD del tenant
  - `countByStatus()` → `SELECT status, COUNT(*) FROM members GROUP BY status`
  - `countByType()` → `SELECT mt.name, COUNT(*) FROM members m JOIN member_types mt ON m.type_id = mt.id GROUP BY mt.name`
  - `countNewMembers()` → `SELECT COUNT(*) FROM members WHERE registration_date BETWEEN $from AND $to`
  - `countLeaves()` → `SELECT COUNT(*) FROM members WHERE leave_date BETWEEN $from AND $to`

- **`PrismaTreasuryStatsAdapter`**: Implementa `TreasuryStatsPort`
  - `getCollectionForPeriod()` → `SELECT SUM(amount), COUNT(*) FROM payments WHERE payment_date BETWEEN $from AND $to AND status = 'CONFIRMED'`
  - `getPendingBalance()` → `SELECT SUM(final_amount - paid_amount) FROM charges WHERE status IN ('PENDING', 'PARTIALLY_PAID')`
  - `getDelinquencyRate()` → `SELECT (delinquent_count::float / total_count) FROM ...`

### Paso 5: Capa de infraestructura — Caché en memoria

Crear en `api/src/dashboard/infrastructure/cache/`:

- **`InMemoryDashboardCache`**: Caché simple con Map + TTL
  - `get(key: string): DashboardResponse | null`
  - `set(key: string, value: DashboardResponse, ttlMs: number): void`
  - `invalidate(tenantId: string): void`
  - TTL por defecto: 5 minutos (300.000ms)
  - Limpieza automática de entradas expiradas cada 10 minutos

### Paso 6: Capa de infraestructura — Controller

Crear en `api/src/dashboard/infrastructure/controllers/`:

- **`DashboardController`**:
  - `GET /api/v1/tenants/:tenantId/dashboard` → KPIs completos adaptados al rol
  - `GET /api/v1/tenants/:tenantId/dashboard/membership` → Solo KPIs de membresía
  - `GET /api/v1/tenants/:tenantId/dashboard/treasury` → Solo KPIs de tesorería
  - `GET /api/v1/tenants/:tenantId/dashboard/alerts` → Alertas y acciones pendientes
  - Query params opcionales: `from`, `to` (período personalizado)
  - Protegidos con `@RequirePermissions('dashboard:read')`
  - Response incluye `cachedAt` para que el frontend muestre "Actualizado hace X minutos"

### Paso 7: Tests

**Tests unitarios (dominio/aplicación):**
- `DashboardService.getKpis()` con permisos completos → retorna membership + treasury
- `DashboardService.getKpis()` con solo permisos treasury → retorna solo treasury, membership nulo
- `DashboardService.getKpis()` con fallo en treasury → retorna membership OK + error en treasury
- Caché: segundo request retorna caché, tercer request tras TTL recalcula

**Tests de integración:**
- Dashboard con datos reales: verificar conteos correctos de socios, importes de recaudación
- Dashboard con tenant vacío: verificar valores en 0, no errores
- Dashboard con período personalizado: verificar filtrado correcto
- Rendimiento: dashboard completo en <2s con 1000 socios

## Criterios de aceptación

1. **KPIs de membresía correctos:** El dashboard muestra el total de socios activos, altas y bajas del mes, y distribución por tipo y estado con datos reales.

2. **KPIs de tesorería correctos:** Se muestra recaudación del mes y ejercicio, saldo pendiente total y tasa de morosidad con importes en céntimos/euros correctos.

3. **Adaptación por rol:** Un Tesorero ve KPIs económicos. Un Secretario ve KPIs de socios. Un Presidente ve todo. Un Vocal ve solo alertas.

4. **Errores aislados:** Si la consulta de tesorería falla, los KPIs de membresía se devuelven normalmente con un campo de error indicando el módulo fallido.

5. **Caché funcional:** Requests repetidos dentro de 5 minutos retornan caché sin recalcular. El response indica `cachedAt`.

6. **Rendimiento:** El endpoint responde en <2 segundos con datos de 1000 socios.
