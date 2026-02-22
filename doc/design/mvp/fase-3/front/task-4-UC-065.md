# Task 4 — UC-065: Gráficos de evolución (Frontend)

## Información general

- **Fase:** 3
- **Tipo:** Frontend
- **UC:** UC-065
- **Bounded Context:** Transversal (lectura de BC-Membership, BC-Treasury)
- **Prioridad:** Should

## Alcance

### Incluido

- Página de análisis y gráficos (`/dashboard/analytics`) accesible desde dashboard principal
- Gráfico de evolución de socios: líneas con series de altas, bajas y total activos por mes (Recharts)
- Gráfico de recaudación mensual: barras comparativas ejercicio actual vs anterior
- Gráfico de distribución de pagos: circular (pie/donut) por método de pago (efectivo, transferencia, SEPA, Bizum, TPV)
- Comparativa multi-ejercicio: superponer hasta 3 ejercicios en los gráficos de líneas/barras
- Selector de período: DateRangePicker o selección de ejercicios fiscales
- Tooltips interactivos en todos los gráficos (valor, porcentaje, variación)
- Exportación individual de gráficos a PNG (canvas-to-blob)
- Skeleton loaders durante carga de cada gráfico independiente
- Responsive: gráficos se adaptan al ancho del contenedor
- TanStack Query hooks con caché coordinado con backend (TTL 5 min)
- Tests unitarios (componentes + hooks)

### Excluido

- Gráficos de asistencia a eventos (BC-Events fuera del MVP)
- Exportación de todo el dashboard a PDF (se delega a herramientas del navegador)
- WebSocket para actualización reactiva (en MVP se usa polling)
- Gráficos de tendencias de comunicación (BC-Communication fuera del MVP)
- Pre-agregación diaria en tabla `analytics_snapshots` (optimización post-MVP)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F3-Back Task 2 — UC-065** | Endpoints REST: members-evolution, collection-monthly, payment-distribution |
| **F3-Front Task 3 — UC-064** | Layout de dashboard, `DashboardPeriodSelector`, utilidades de formateo |
| **F3-Front Task 2 — UC-010** | `FiscalYearSelector` y hook `useFiscalYears()` para comparativa multi-ejercicio |
| **F1-Front Task 1 — UC-002** | AuthProvider, usePermissions() (analytics:read) |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] Endpoint `GET /dashboard/analytics/members-evolution` retorna series temporales mensuales con meses completos (sin huecos)
- [ ] Endpoint `GET /dashboard/analytics/collection-monthly` soporta query param `fiscalYearIds` para comparativa
- [ ] Endpoint `GET /dashboard/analytics/payment-distribution` retorna distribución con importes en centavos y porcentajes
- [ ] Recharts instalado como dependencia del proyecto (`recharts@^2.10`)
- [ ] Datos de al menos 6 meses disponibles para series temporales significativas

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/dashboard/analytics` | Navegación del dashboard |
| Componente `MemberEvolutionChart` | Reutilizable en informes de membresía |
| Componente `CollectionChart` | Reutilizable en informes de tesorería |
| Componente `PaymentDistributionChart` | Reutilizable en informes de tesorería |
| Componente `ChartExportButton` | Reutilizable en cualquier gráfico |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-065.md` | Flujo: 3 gráficos principales, comparativa multi-ejercicio, filtrado por período, exportación |
| `us/us-165.md` | Criterios: evolución de socios y recaudación con series temporales |
| `us/us-166.md` | Criterios: gráficos interactivos y exportación |
| `rnft/rnft-018.md` | Gráficos interactivos responsivos |
| `rnft/rnft-015.md` | Performance: p95 <500ms (cache hit <50ms) |

## Puntos críticos

1. **Series temporales sin huecos.** El backend rellena meses vacíos con 0, pero el frontend debe verificar que la serie es completa antes de renderizar. El eje X debe mostrar todos los meses del período con formato "Ene 2025", "Feb 2025"... Si la serie incluye años distintos, incluir el año en cada label. Recharts necesita un array continuo para renderizar correctamente.

2. **Comparativa multi-ejercicio.** Al activar la comparativa, el gráfico superpone hasta 3 series (una por ejercicio) con colores distintos. El eje X se normaliza por mes relativo al ejercicio (Mes 1, Mes 2...) no por mes calendario, ya que los ejercicios pueden empezar en meses diferentes (cofrade, temporada deportiva). Tooltips muestran el valor de cada ejercicio al hover.

3. **Importes en centavos a euros.** Los datos de recaudación llegan en centavos. El frontend convierte a euros para los ejes y tooltips: `34500` → `345,00 €`. Usar `formatMoney()` de las utilidades compartidas. Escala del eje Y en miles si supera 10.000€ (ej: "10k €", "25k €").

4. **Carga lazy de Recharts.** Recharts es una librería pesada (~200KB). Cargar con `React.lazy()` y `Suspense` para no penalizar el bundle inicial. Mostrar Skeleton loader mientras se carga el chunk del gráfico.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Recharts pesado penaliza TTI | Media | Medio | Lazy loading con React.lazy() + Suspense + skeleton. Code splitting por ruta |
| Series con muchos puntos (60 meses = 5 ejercicios) renderizan lento | Baja | Bajo | Limitar a 5 ejercicios máximo. Recharts optimizado con `isAnimationActive={false}` si >36 puntos |
| Formateo de ejes inconsistente entre gráficos | Media | Bajo | Funciones de formateo centralizadas en utils. Configuración de Recharts reutilizable |

## Plan de implementación

### Paso 1: Schemas y tipos

Crear en `web/src/features/dashboard/schemas/`:

- **`analytics.schemas.ts`**:
  - `monthlyDataPointSchema`: year, month, value, label?
  - `timeSeriesSchema`: series[] con { name, data: monthlyDataPointSchema[] }, period: { from, to }
  - `memberEvolutionSchema`: series con 3 entries (Altas, Bajas, Total activos), period
  - `collectionMonthlySchema`: series con N entries (una por ejercicio comparado), period
  - `paymentDistributionSchema`: data[] con { method, amount (centavos), count, percentage }
  - Tipos inferidos: `MonthlyDataPoint`, `TimeSeries`, `MemberEvolutionData`, `CollectionMonthlyData`, `PaymentDistributionData`

### Paso 2: API hooks

Crear en `web/src/features/dashboard/api/`:

- `useMemberEvolution(period?, fiscalYearIds?)`: query para evolución de socios
- `useCollectionMonthly(period?, fiscalYearIds?)`: query para recaudación mensual comparativa
- `usePaymentDistribution(period?)`: query para distribución por método de pago
- Todos con `refetchInterval: 300000` (5 min), `staleTime: 240000` (4 min)

### Paso 3: Componentes de gráficos

Crear en `web/src/features/dashboard/components/`:

- **`MemberEvolutionChart.tsx`**: Gráfico de líneas (Recharts `LineChart`)
  - 3 líneas: Altas (verde), Bajas (rojo), Total activos (azul)
  - Eje X: meses formateados ("Ene 25", "Feb 25"...)
  - Eje Y: número de socios
  - Tooltip personalizado: muestra los 3 valores al hover sobre un mes
  - Legend con checkboxes para show/hide series individuales
  - Responsive con `ResponsiveContainer`
- **`CollectionChart.tsx`**: Gráfico de barras (Recharts `BarChart`)
  - Barras agrupadas por mes, una barra por ejercicio comparado
  - Colores distintos por ejercicio (azul, naranja, verde)
  - Eje X: meses (normalizados por mes relativo al ejercicio si es comparativa)
  - Eje Y: importes en euros, formato abreviado si >10k€
  - Tooltip: importe exacto formateado + variación respecto al ejercicio anterior
- **`PaymentDistributionChart.tsx`**: Gráfico circular (Recharts `PieChart`)
  - Segmentos por método de pago con colores asignados
  - Colores fijos: Efectivo (verde), Transferencia (azul), SEPA (morado), Bizum (naranja), TPV (gris)
  - Labels: porcentaje + importe formateado
  - Centro: importe total de recaudación
  - Tooltip: método, importe exacto, número de operaciones, porcentaje
- **`FiscalYearCompareSelector.tsx`**: Selector de ejercicios para comparativa
  - MultiSelect de ejercicios disponibles (máximo 3)
  - Chips con color asignado que coincide con el color de la serie en el gráfico
  - Checkbox "Comparar con ejercicios anteriores" para activar/desactivar modo comparativa
- **`ChartExportButton.tsx`**: Botón de exportación a PNG
  - Usa `html-to-image` o `canvas-to-blob` para capturar el contenedor del gráfico
  - Descarga como PNG con nombre descriptivo: `evolucion-socios-2025.png`
  - Icono de descarga discreto en la esquina del gráfico
- **`ChartSkeleton.tsx`**: Skeleton loader para gráficos
  - Simula la forma del gráfico (rectángulo con líneas para LineChart, barras para BarChart, círculo para PieChart)
  - Se muestra durante lazy load de Recharts y durante fetch de datos

### Paso 4: Página

Crear en `web/src/features/dashboard/pages/`:

- **`AnalyticsPage.tsx`**: `/dashboard/analytics`
  - Header: título "Análisis y Gráficos" + `DashboardPeriodSelector` + `FiscalYearCompareSelector`
  - Grid de 2 columnas en desktop:
    - Col izquierda (span 2): `MemberEvolutionChart` (gráfico ancho, series de líneas)
    - Col izquierda (span 1): `CollectionChart` (barras)
    - Col derecha (span 1): `PaymentDistributionChart` (circular)
  - Cada gráfico envuelto en Card con título, `ChartExportButton` y `Suspense` + `ChartSkeleton`
  - Guard de permisos: `analytics:read` requerido. Sin permiso → redirect a `/dashboard`
  - Tab en navegación del dashboard: "KPIs" | "Análisis"

### Paso 5: Lazy loading

Configurar en `web/src/features/dashboard/`:

- **`lazy-charts.ts`**: Exporta componentes de gráficos con `React.lazy()`
  - `LazyMemberEvolutionChart = React.lazy(() => import('./components/MemberEvolutionChart'))`
  - `LazyCollectionChart = React.lazy(() => import('./components/CollectionChart'))`
  - `LazyPaymentDistributionChart = React.lazy(() => import('./components/PaymentDistributionChart'))`
- Cada gráfico en archivo separado para code-splitting efectivo

### Paso 6: Utilidades de gráficos

Crear en `web/src/features/dashboard/utils/`:

- **`chart-formatters.ts`**:
  - `formatMonthLabel(year: number, month: number): string` → "Ene 25"
  - `formatRelativeMonth(monthIndex: number): string` → "Mes 1", "Mes 2"...
  - `formatYAxisMoney(centavos: number): string` → "10k €", "345 €"
  - `getSeriesColor(index: number): string` → colores de la paleta del tema
  - `getPaymentMethodColor(method: string): string` → color fijo por método
- **`chart-config.ts`**: Configuración reutilizable de Recharts
  - Paleta de colores por defecto
  - Configuración de tooltip, legend, ejes
  - Threshold de animación: si >36 puntos, `isAnimationActive={false}`

### Paso 7: Tests

- MemberEvolutionChart: renderiza 3 líneas con datos mock, tooltip muestra valores correctos
- CollectionChart: renderiza barras agrupadas, eje Y formatea euros correctamente
- PaymentDistributionChart: renderiza segmentos con porcentajes, colores fijos por método
- FiscalYearCompareSelector: limita a 3 selecciones, chips con colores correctos
- ChartExportButton: click inicia descarga (mock de canvas-to-blob)
- AnalyticsPage: no renderiza si sin permisos, muestra skeleton durante carga
- Formatters: formatMonthLabel, formatYAxisMoney con varios valores

## Criterios de aceptación

1. **Evolución de socios visible:** El gráfico de líneas muestra altas, bajas y total activos por mes con datos reales. No hay huecos en la serie temporal.

2. **Recaudación mensual comparativa:** Se puede comparar la recaudación de hasta 3 ejercicios en barras agrupadas con colores distintos.

3. **Distribución por método de pago:** El gráfico circular muestra el desglose con porcentajes y colores fijos por método.

4. **Tooltips interactivos:** Al hover sobre cualquier punto/barra/segmento, se muestra tooltip con valores exactos formateados.

5. **Filtrado por período:** Se puede filtrar por rango de fechas o por ejercicios fiscales. Los gráficos se actualizan al cambiar.

6. **Exportación a PNG:** Cada gráfico se puede exportar individualmente como imagen PNG.

7. **Carga performante:** Los gráficos se cargan con lazy loading. Skeleton loaders se muestran durante la carga. La página no penaliza el bundle inicial.

8. **Responsive:** Los gráficos se adaptan al ancho del contenedor en todos los breakpoints.
