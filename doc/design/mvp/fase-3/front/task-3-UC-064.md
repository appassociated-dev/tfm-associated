# Task 3 — UC-064: Dashboard principal y KPIs (Frontend)

## Información general

- **Fase:** 3
- **Tipo:** Frontend
- **UC:** UC-064
- **Bounded Context:** Transversal (lectura de BC-Membership, BC-Treasury)
- **Prioridad:** Must

## Alcance

### Incluido

- Página de dashboard principal (`/dashboard`) como landing page tras login
- Widgets de KPIs de membresía: total socios activos (número grande), altas/bajas del mes, distribución por tipo (donut chart), distribución por estado
- Widgets de KPIs de tesorería: recaudación del mes y del ejercicio (formateo €), saldo pendiente total, tasa de morosidad (%), cargos pendientes
- Widget de alertas: acciones pendientes con severidad (warning/error) y enlaces directos
- Adaptación por rol: widgets visibles según permisos del usuario (Tesorero → económicos, Secretario → socios, Presidente → todo)
- Indicador "Actualizado hace X minutos" basado en `cachedAt` del backend
- Botón de refresco manual que invalida caché
- Selector de período: mes actual (default), trimestre, ejercicio completo, personalizado
- Manejo de errores aislados: si un módulo falla, los demás se muestran con error parcial en el widget afectado
- Skeleton loaders durante carga de cada widget independiente
- Responsive: layout de grid adaptable (4 cols desktop, 2 tablet, 1 móvil)
- TanStack Query hooks con polling configurable (default 5 minutos)
- Tests unitarios (componentes + hooks)

### Excluido

- Widgets de BC-Events y BC-Communication (BCs no implementados en MVP)
- WebSocket para actualización en tiempo real (en MVP se usa polling cada 5 minutos)
- Personalización del dashboard (drag & drop de widgets, reordenar)
- Exportación del dashboard a PDF/imagen
- Dashboard de superadmin (métricas de todos los tenants)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F3-Back Task 1 — UC-064** | Endpoints REST: dashboard, dashboard/membership, dashboard/treasury, dashboard/alerts |
| **F1-Front Task 1 — UC-002** | AuthProvider, usePermissions(), HttpClient |
| **F3-Front Task 2 — UC-010** | `FiscalYearSelector` y contexto de ejercicio activo (para filtrar KPIs por período) |
| **Fase 0 — Scaffold** | Proyecto React + Vite + Mantine, TanStack Query, Router |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] Endpoint `GET /api/v1/tenants/:tenantId/dashboard` retorna KPIs completos adaptados al rol
- [ ] Endpoint responde con `cachedAt` para mostrar antigüedad de datos
- [ ] Endpoint retorna `errors[]` cuando un módulo falla (errores aislados)
- [ ] JWT incluye claims `permissions[]` para determinar widgets visibles
- [ ] Endpoint acepta query params `from` y `to` para período personalizado
- [ ] `FiscalYearSelector` disponible para contexto de ejercicio

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/dashboard` | Landing page tras login, navegación principal |
| Componente `KpiCard` | Reutilizable para mostrar métricas numéricas |
| Componente `MemberDistributionChart` | Reutilizable en informes |
| Hook `useDashboardKpis()` | Standalone |
| Layout responsive de widgets | Base para UC-065 (gráficos) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `doc/brand/001-associated-brand-foundation.md` | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |
| `uc/uc-064.md` | Flujo: widgets por rol, KPIs, alertas, manejo de errores aislados, período personalizado |
| `us/us-161.md` a `us/us-164.md` | Criterios por tipo de KPI: membresía, tesorería, alertas |
| `bc/bc-membership.md` | Aggregate Member — estados, tipos (para distribución) |
| `bc/bc-treasury.md` | Aggregates Charge, Payment — para KPIs económicos |
| `rnft/rnft-017.md` | Performance: dashboard carga en <2s |
| `rnft/rnft-019.md` | Caching de métricas agregadas |

## Puntos críticos

1. **Adaptación de widgets por rol.** El backend ya filtra KPIs según permisos, pero el frontend debe manejar la ausencia de módulos gracefully: si `membership` es `undefined` en la respuesta, no renderizar esos widgets (sin error). Usar `usePermissions()` del AuthProvider para saber qué secciones mostrar y evitar flash de contenido.

2. **Errores parciales con UI funcional.** Si el campo `errors[]` contiene un módulo fallido (ej: `{ module: 'treasury', message: 'Timeout' }`), los widgets de tesorería muestran un estado de error con mensaje y botón "Reintentar" individual, mientras los widgets de membresía se muestran normalmente. No se muestra error general de página.

3. **Formateo de importes.** Todos los importes llegan en centavos desde el backend. El frontend debe convertir y formatear: `34500` → `345,00 €`. Usar utilidad `formatMoney()` consistente con toda la app. Separador de miles: punto. Separador decimal: coma. Símbolo: `€` al final.

4. **Polling y caché coordinados.** TanStack Query con `refetchInterval: 300000` (5 min) coordinado con el TTL del backend. Mostrar "Actualizado hace 2 minutos" calculado desde `cachedAt`. El botón de refresco llama a `queryClient.invalidateQueries()` y el backend recalcula (ignora su caché con query param `?fresh=true`).

## Plan de implementación

### Paso 1: Schemas y tipos

Crear en `web/src/features/dashboard/schemas/`:

- **`dashboard.schemas.ts`**:
  - `membershipKpisSchema`: totalActive, newThisMonth, leavesThisMonth, byStatus (Record), byType (Record)
  - `treasuryKpisSchema`: collectionThisMonth, collectionThisYear, pendingBalance, delinquencyRate, pendingCharges, byPaymentMethod (Record)
  - `alertSchema`: type, message, severity (enum: info/warning/error), link
  - `moduleErrorSchema`: module, message
  - `dashboardResponseSchema`: membership?, treasury?, alerts, errors[], cachedAt
  - Tipos inferidos: `MembershipKpis`, `TreasuryKpis`, `DashboardAlert`, `DashboardResponse`

### Paso 2: API hooks

Crear en `web/src/features/dashboard/api/`:

- `useDashboardKpis(period?)`: query con `refetchInterval: 300000`, retorna `DashboardResponse`
- `useMembershipStats(period?)`: query específica para endpoint `/dashboard/membership`
- `useTreasuryStats(period?)`: query específica para endpoint `/dashboard/treasury`
- `useDashboardAlerts()`: query para alertas
- `useRefreshDashboard()`: callback que invalida queries del dashboard con `?fresh=true`

### Paso 3: Componentes

Crear en `web/src/features/dashboard/components/`:

- **`KpiCard.tsx`**: Card genérica para mostrar un KPI
  - Props: title, value (number), format (number/money/percentage), trend?, icon?, color?
  - Muestra: título, valor formateado grande, trend con icono (↑↓→) si se proporciona
  - Skeleton loader mientras carga
  - Estado de error con mensaje y botón reintentar
- **`MembershipKpisSection.tsx`**: Sección de widgets de membresía
  - KpiCard de total socios activos (número, azul, icono personas)
  - KpiCard de altas del mes (número, verde, icono +)
  - KpiCard de bajas del mes (número, rojo, icono -)
  - Mini donut chart de distribución por tipo de socio (Mantine Charts)
  - Lista de distribución por estado con badges coloreados
- **`TreasuryKpisSection.tsx`**: Sección de widgets de tesorería
  - KpiCard de recaudación del mes (money, verde)
  - KpiCard de recaudación del ejercicio (money, azul)
  - KpiCard de saldo pendiente (money, yellow)
  - KpiCard de tasa de morosidad (percentage, rojo si >10%)
  - KpiCard de cargos pendientes (número)
- **`AlertsWidget.tsx`**: Widget de alertas y acciones pendientes
  - Lista de alertas con icono de severidad (info azul, warning amarillo, error rojo)
  - Cada alerta: mensaje + link de acción directa (ej: "3 cargos vencidos > 30 días" → link a listado filtrado)
  - Contador de alertas totales en badge
- **`DashboardPeriodSelector.tsx`**: Selector de período
  - Radio group: "Este mes", "Trimestre", "Ejercicio", "Personalizado"
  - DateRangePicker para personalizado (visible solo cuando se selecciona)
  - Al cambiar, invalida y refetch de queries del dashboard
- **`ModuleErrorCard.tsx`**: Card de error para módulo fallido
  - Icono de advertencia, mensaje de error, botón "Reintentar"
  - Reemplaza los widgets del módulo afectado
- **`CacheIndicator.tsx`**: Indicador de frescura de datos
  - "Actualizado hace X minutos" calculado desde `cachedAt`
  - Se actualiza cada 30 segundos (timer local)
  - Botón de refresco manual al lado

### Paso 4: Páginas

Crear en `web/src/features/dashboard/pages/`:

- **`DashboardPage.tsx`**: `/dashboard`
  - Header: título "Dashboard" + `DashboardPeriodSelector` + `CacheIndicator`
  - Grid responsive con secciones:
    - Fila 1: `MembershipKpisSection` (4 KpiCards en row)
    - Fila 2: `TreasuryKpisSection` (5 KpiCards en row)
    - Fila 3: `AlertsWidget` (full width)
  - Cada sección envuelta en guard de permisos: si no tiene `membership:*`, no renderiza fila 1
  - Si `errors[]` contiene módulo, la sección correspondiente muestra `ModuleErrorCard`

### Paso 5: Utilidades

Crear en `web/src/features/dashboard/utils/`:

- **`format-kpi.ts`**: Funciones de formateo
  - `formatMoney(centavos: number): string` → `345,00 €` (si no existe ya en shared)
  - `formatPercentage(value: number): string` → `12,5%`
  - `formatTrend(current: number, previous: number): { direction, percentage, color }`
  - `formatCacheAge(cachedAt: string): string` → "Hace 2 minutos"

### Paso 6: Tests

- KpiCard: renderiza valor formateado, muestra skeleton en loading, muestra error
- MembershipKpisSection: renderiza 4 KPIs con datos correctos, no renderiza si datos undefined
- TreasuryKpisSection: formatea importes en euros correctamente (centavos → euros)
- AlertsWidget: renderiza alertas con severidad correcta, links funcionales
- DashboardPeriodSelector: cambio de período invalida queries
- ModuleErrorCard: muestra mensaje de error, botón reintentar llama refetch
- CacheIndicator: muestra "Hace X minutos" correctamente, refresco funciona
- DashboardPage: no renderiza sección de membresía si usuario sin permisos

## Criterios de aceptación

1. **KPIs de membresía visibles:** El dashboard muestra total de socios activos, altas y bajas del mes, y distribución por tipo y estado.

2. **KPIs de tesorería con formateo correcto:** Importes mostrados en euros con formato español (345,00 €). Tasa de morosidad en porcentaje.

3. **Adaptación por rol:** Un Tesorero ve solo widgets económicos. Un Secretario ve solo widgets de socios. Un Presidente ve todo. Sin flash de contenido no autorizado.

4. **Errores parciales funcionales:** Si tesorería falla, los widgets de membresía se muestran normalmente. El módulo fallido muestra error con opción de reintentar.

5. **Período personalizable:** Se puede cambiar entre mes actual, trimestre, ejercicio completo o rango personalizado. Los KPIs se recalculan.

6. **Indicador de frescura:** Se muestra "Actualizado hace X minutos" y un botón de refresco manual que fuerza recálculo.

7. **Responsive:** El layout se adapta correctamente a desktop (4 cols), tablet (2 cols) y móvil (1 col).
