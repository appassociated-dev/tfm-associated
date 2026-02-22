# Task 2 — UC-065: Gráficos de evolución (Backend)

## Información general

- **Fase:** 3
- **Tipo:** Backend
- **UC:** UC-065
- **Bounded Context:** Transversal (lectura de BC-Membership, BC-Treasury)
- **Application Service:** `DashboardAnalyticsService`
- **Aggregates:** Lectura transversal de `Member`, `MemberAccount`, `Charge`, `Payment`, `FiscalYear`
- **Prioridad:** Should

## Alcance

### Incluido

- Application Service `DashboardAnalyticsService` para datos de series temporales
- Endpoint REST de evolución de socios: serie temporal mensual de altas, bajas y total activos (últimos 5 ejercicios)
- Endpoint REST de recaudación mensual: serie temporal de ingresos por mes, comparativa ejercicio actual vs anterior
- Endpoint REST de distribución de pagos: desglose por método de pago (efectivo, transferencia, SEPA, Bizum, TPV)
- Consultas con agregaciones temporales (GROUP BY mes/año) optimizadas con índices
- Filtrado por período personalizado (DateRange) y por ejercicio fiscal
- Comparativa multi-ejercicio: superponer hasta 3 ejercicios en los datos
- Caché en memoria con TTL de 5 minutos (reutiliza infraestructura de UC-064)
- Reutilización de ports `MembershipStatsPort` y `TreasuryStatsPort` de UC-064 con métodos ampliados
- Tests unitarios + tests de integración

### Excluido

- Gráficos de asistencia a eventos (BC-Events fuera del MVP)
- Exportación de datos a PNG/PDF (se delega al frontend con canvas-to-blob)
- WebSocket para actualización reactiva (en MVP se usa polling)
- Pre-agregación diaria en tabla `analytics_snapshots` (optimización post-MVP)
- Caché en Redis (en MVP se usa caché en memoria)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **Fase 3 — UC-064 (Dashboard)** | Ports `MembershipStatsPort`, `TreasuryStatsPort`, infraestructura de caché, `DashboardController` base |
| **Fase 1 — Todos los backends** | Datos históricos de socios, cargos, pagos en BD |
| **Fase 1 — UC-010 (Ejercicios)** | Aggregate `FiscalYear` con fechas de ejercicio para agrupar datos |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] Ports `MembershipStatsPort` y `TreasuryStatsPort` implementados (de UC-064)
- [ ] `InMemoryDashboardCache` disponible (de UC-064)
- [ ] Datos históricos con al menos 6 meses de socios, cargos y pagos para series temporales
- [ ] Al menos 2 ejercicios fiscales (1 cerrado + 1 abierto) para comparativas
- [ ] Índices en `members.registration_date`, `payments.payment_date`, `charges.issue_date`

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Endpoint `GET /dashboard/analytics/members-evolution` | Frontend UC-065 (gráfico de líneas) |
| Endpoint `GET /dashboard/analytics/collection-monthly` | Frontend UC-065 (gráfico de barras) |
| Endpoint `GET /dashboard/analytics/payment-distribution` | Frontend UC-065 (gráfico circular) |
| Métodos ampliados en ports | Reutilizables para futuros informes |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-065.md` | Flujo: 3 gráficos principales, comparativa multi-ejercicio, filtrado por período |
| `us/us-165.md` | Criterios: evolución de socios y recaudación |
| `us/us-166.md` | Criterios: gráficos interactivos y exportación |
| `rnft/rnft-018.md` | Gráficos interactivos responsivos |
| `rnft/rnft-015.md` | Performance: p95 <500ms (cache hit <50ms) |

## Puntos críticos

1. **Series temporales mensuales.** Los datos se agrupan por mes/año: `GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)`. Para meses sin datos, el backend debe rellenar con ceros para que el frontend no tenga huecos en el gráfico. Retornar array ordenado cronológicamente.

2. **Comparativa multi-ejercicio.** Al solicitar comparativa, se retornan series paralelas para cada ejercicio. Ejemplo: recaudación de enero a diciembre para 2023, 2024 y 2025. Los datos se normalizan por mes (mes 1 = primer mes del ejercicio, no necesariamente enero).

3. **Rendimiento con datos históricos extensos.** Con 5 ejercicios × 12 meses × 500 socios, las queries pueden ser pesadas. Uso de índices compuestos, caché TTL 5min, y límite de 5 ejercicios máximo en comparativa.

4. **Importes en centavos.** Todas las series de recaudación se retornan en centavos (enteros). El frontend convierte a euros para mostrar en los gráficos.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Queries de agregación temporal lentas con muchos datos | Media | Medio | Índices compuestos en (tenant_id, date). Caché TTL 5min. Limitar a 5 ejercicios |
| Meses vacíos causan huecos en gráficos | Alta | Bajo | Backend rellena meses sin datos con 0. Genera serie completa desde inicio hasta fin del período |
| Datos inconsistentes entre ejercicios (cambio de estructura) | Baja | Bajo | Normalizar por mes relativo al ejercicio, no por mes calendario |

## Plan de implementación

### Paso 1: Ampliación de ports con métodos temporales

Ampliar en `api/src/dashboard/domain/ports/`:

- **`MembershipStatsPort`** — añadir:
  - `getMemberEvolution(tenantId: string, fromDate: Date, toDate: Date): Promise<MonthlyDataPoint[]>` — serie de {month, year, newMembers, leaves, totalActive}
  - `getMemberEvolutionByFiscalYear(tenantId: string, fiscalYearIds: string[]): Promise<Record<string, MonthlyDataPoint[]>>`

- **`TreasuryStatsPort`** — añadir:
  - `getMonthlyCollection(tenantId: string, fromDate: Date, toDate: Date): Promise<MonthlyDataPoint[]>` — serie de {month, year, total, count}
  - `getMonthlyCollectionByFiscalYear(tenantId: string, fiscalYearIds: string[]): Promise<Record<string, MonthlyDataPoint[]>>`
  - `getPaymentDistribution(tenantId: string, fromDate: Date, toDate: Date): Promise<Record<string, number>>` — por método de pago

### Paso 2: Value Objects de respuesta

Crear en `api/src/dashboard/domain/value-objects/`:

- **`MonthlyDataPoint`**: `{ year: number, month: number, value: number, label?: string }`
- **`TimeSeriesResponse`**: `{ series: { name: string, data: MonthlyDataPoint[] }[], period: { from: Date, to: Date } }`
- **`MemberEvolutionResponse`**: `{ series: [{ name: 'Altas', data }, { name: 'Bajas', data }, { name: 'Total activos', data }], period }`
- **`CollectionMonthlyResponse`**: `{ series: [{ name: 'Ejercicio 2025', data }, { name: 'Ejercicio 2024', data }], period }`
- **`PaymentDistributionResponse`**: `{ data: { method: string, amount: number, count: number, percentage: number }[] }`

### Paso 3: Application Service

Crear en `api/src/dashboard/application/services/dashboard-analytics.service.ts`:

- **`DashboardAnalyticsService`**:
  - `getMemberEvolution(tenantId: string, period?: DateRange, fiscalYearIds?: string[]): Promise<MemberEvolutionResponse>`
    1. Verificar caché
    2. Si `fiscalYearIds`: consultar por ejercicios con `getMemberEvolutionByFiscalYear()`
    3. Si `period`: consultar con `getMemberEvolution(from, to)`
    4. Rellenar meses vacíos con 0 (generar serie completa)
    5. Cachear y retornar

  - `getCollectionMonthly(tenantId: string, period?: DateRange, fiscalYearIds?: string[]): Promise<CollectionMonthlyResponse>`
    1. Verificar caché
    2. Consultar recaudación mensual por ejercicio
    3. Normalizar meses (mes 1 del ejercicio = primer punto de la serie)
    4. Rellenar meses sin datos con 0
    5. Cachear y retornar

  - `getPaymentDistribution(tenantId: string, period?: DateRange): Promise<PaymentDistributionResponse>`
    1. Verificar caché
    2. Consultar distribución por método de pago
    3. Calcular porcentajes
    4. Cachear y retornar

### Paso 4: Infraestructura — Adapters temporales

Ampliar adapters existentes (de UC-064):

- **`PrismaMembershipStatsAdapter`** — añadir:
  - `getMemberEvolution()` →
    ```sql
    SELECT EXTRACT(YEAR FROM registration_date) AS year,
           EXTRACT(MONTH FROM registration_date) AS month,
           COUNT(*) AS new_members
    FROM members
    WHERE registration_date BETWEEN $from AND $to
    GROUP BY year, month
    ORDER BY year, month
    ```
  - Query similar para bajas (leave_date)
  - Cálculo de total acumulativo en la capa de aplicación

- **`PrismaTreasuryStatsAdapter`** — añadir:
  - `getMonthlyCollection()` →
    ```sql
    SELECT EXTRACT(YEAR FROM payment_date) AS year,
           EXTRACT(MONTH FROM payment_date) AS month,
           SUM(amount) AS total, COUNT(*) AS count
    FROM payments
    WHERE payment_date BETWEEN $from AND $to AND status = 'CONFIRMED'
    GROUP BY year, month
    ORDER BY year, month
    ```
  - `getPaymentDistribution()` →
    ```sql
    SELECT payment_method, SUM(amount) AS total, COUNT(*) AS count
    FROM payments
    WHERE payment_date BETWEEN $from AND $to AND status = 'CONFIRMED'
    GROUP BY payment_method
    ```

### Paso 5: Utilidad de relleno de meses

Crear en `api/src/dashboard/domain/services/`:

- **`TimeSeriesFiller`**: Servicio utilitario que rellena meses vacíos
  - `fillMissingMonths(data: MonthlyDataPoint[], from: Date, to: Date, defaultValue: number = 0): MonthlyDataPoint[]`
  - Genera array con todos los meses del período, usando 0 donde no hay datos
  - Garantiza que el frontend recibe una serie completa sin huecos

### Paso 6: Controller

Ampliar `DashboardController` (de UC-064):

- `GET /api/v1/tenants/:tenantId/dashboard/analytics/members-evolution` → Serie temporal de socios
  - Query params: `from`, `to`, `fiscalYearIds` (comma-separated)
- `GET /api/v1/tenants/:tenantId/dashboard/analytics/collection-monthly` → Recaudación mensual
  - Query params: `from`, `to`, `fiscalYearIds`
- `GET /api/v1/tenants/:tenantId/dashboard/analytics/payment-distribution` → Distribución por método
  - Query params: `from`, `to`
- Protegidos con `@RequirePermissions('analytics:read')`

### Paso 7: Tests

**Tests unitarios:**
- `TimeSeriesFiller.fillMissingMonths()` con datos parciales → serie completa con ceros
- `DashboardAnalyticsService.getMemberEvolution()` → series correctas de altas/bajas/total
- `DashboardAnalyticsService.getCollectionMonthly()` con 2 ejercicios → series paralelas
- `DashboardAnalyticsService.getPaymentDistribution()` → porcentajes suman 100%
- Caché: segundo request retorna caché

**Tests de integración:**
- Evolución de socios con 12 meses de datos: verificar serie completa
- Comparativa 2 ejercicios: verificar datos separados por ejercicio
- Distribución de pagos: verificar agrupación por método
- Meses vacíos: verificar relleno con 0
- Rendimiento: respuesta en <500ms con caché warm

## Criterios de aceptación

1. **Evolución de socios correcta:** La serie temporal muestra altas, bajas y total activos por mes con datos reales. Meses sin datos muestran 0.

2. **Recaudación mensual comparativa:** Se puede comparar la recaudación de hasta 3 ejercicios en la misma respuesta con series paralelas.

3. **Distribución por método de pago:** Se muestra el desglose de pagos por método (efectivo, transferencia, SEPA, Bizum, TPV) con importes y porcentajes.

4. **Período personalizable:** Se puede filtrar por rango de fechas o por ejercicios fiscales específicos.

5. **Rendimiento con caché:** La respuesta con caché warm es <50ms. Sin caché, <500ms con datos de 1000 socios.

6. **Meses completos sin huecos:** La serie temporal incluye todos los meses del período, rellenando con 0 donde no hay datos.
