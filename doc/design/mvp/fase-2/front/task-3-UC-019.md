# Task 3 — UC-019: Vista de cargos periódicos (Frontend)

## Información general

- **Fase:** 2
- **Tipo:** Frontend
- **UC:** UC-019
- **Bounded Context:** BC-Treasury
- **Prioridad:** Must

## Alcance

### Incluido

- Página de cargos periódicos (`/treasury/charges/periodic`) con tabla paginada y filtros
- Vista de resultado de última generación mensual: cargos generados, duplicados evitados, errores
- Panel de ejecución manual retroactiva (FA-1): seleccionar mes, ejecutar y ver resultado
- Filtros avanzados: por mes/año, estado del cargo, socio, plan de cuota
- Detalle de cargo individual con historial de pagos asociados
- Indicadores visuales: badges de estado (PENDING, PAID, RETURNED, PARTIAL), colores
- TanStack Query hooks para consulta de cargos periódicos y ejecución manual
- Validación Zod de parámetros de búsqueda y ejecución
- Tests unitarios (componentes + hooks)

### Excluido

- Configuración del cron job de generación automática (configurado en backend, no editable desde UI)
- Configuración de fechas de vencimiento por entidad (FA-2, backend only)
- Cargos anticipados (FA-3, diferido post-MVP)
- Exportación a Excel/CSV del listado de cargos

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F1-Back Task 11 — UC-019** | Endpoints REST: `GET /charges?type=periodic` (listado), `GET /charges/:id` (detalle), `POST /charges/generate` (ejecución manual), `GET /charges/generation-log` (resultado) |
| **F1-Front Task 1 — UC-002** | AuthProvider, usePermissions(), HttpClient |
| **F2-Front Task 1 — UC-006** | Componente `MemberSearchCombobox` para filtrar por socio |

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Página `/treasury/charges/periodic` | Navegación de tesorería |
| Hooks `useCharges()`, `useCharge()` | UC-021 (cobros), UC-023 (remesas) |
| Componente `ChargeStatusBadge` reutilizable | UC-020 (cargos manuales), UC-021 (cobros), UC-024 (devoluciones) |
| Componente `ChargeDetailDrawer` reutilizable | Cualquier vista que necesite detalle de cargo |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-019.md` | Flujo de generación automática, prorrateo, ejecución manual, prevención de duplicados |
| `us/us-047.md` | Criterios: proceso mensual, evaluación de suscripciones |
| `us/us-048.md` | Criterios: prorrateo en altas a mitad de ejercicio |
| `bc/bc-treasury.md` | Entity Charge, ChargeStatus, estados y transiciones |

## Puntos críticos

1. **Importes en centavos → display en euros.** Los importes vienen del backend en centavos (enteros). El frontend debe dividir por 100 para mostrar y formatear con `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`. Nunca operar con decimales en frontend.

2. **Ejecución manual retroactiva.** El tesorero puede lanzar la generación de cargos para un mes específico. El frontend envía el mes/año y muestra el resultado (cargos generados, duplicados evitados). Incluir confirmación antes de ejecutar y progress indicator.

## Plan de implementación

### Paso 1: Schemas y tipos

- `chargeResponseSchema`, `chargeListSchema`, `chargeFilterSchema`
- `generationResultSchema`: totalGenerados, sinCargo, duplicadosEvitados, importeTotal
- Utility `formatMoney(centavos: number): string`

### Paso 2: API hooks

- `useCharges(filters)`: listado paginado con filtros
- `useCharge(chargeId)`: detalle individual
- `useGenerateCharges()`: mutation para ejecución manual
- `useGenerationLog()`: resultado de última generación

### Paso 3: Componentes

- **`ChargesTable.tsx`**: Tabla con columnas: socio, concepto, importe, fecha emisión, vencimiento, estado
- **`ChargeStatusBadge.tsx`**: Badge con color por estado (verde=PAID, amarillo=PENDING, rojo=RETURNED, naranja=PARTIAL)
- **`ChargeDetailDrawer.tsx`**: Drawer lateral con detalle del cargo + pagos asociados
- **`ManualGenerationPanel.tsx`**: Panel con selector de mes/año, botón ejecutar, resultado
- **`GenerationResultCard.tsx`**: Card con resumen de última generación

### Paso 4: Página principal

- **`PeriodicChargesPage.tsx`**: Filtros + tabla + panel de generación manual
  - Tab "Cargos": tabla paginada con filtros
  - Tab "Generación": panel de ejecución manual + historial de generaciones

### Paso 5: Tests

- Tabla renderiza cargos con formato correcto de importes
- Badge muestra color correcto por estado
- Ejecución manual: confirmación, llamada API, muestra resultado
- Filtros funcionan correctamente

## Criterios de aceptación

1. **Listado de cargos paginado:** Se muestran los cargos periódicos con importes formateados en euros, estados con badges de color y paginación funcional.

2. **Filtros funcionales:** Se puede filtrar por mes/año, estado, socio y plan de cuota.

3. **Ejecución manual:** El tesorero puede ejecutar la generación para un mes específico y ver el resultado (cargos generados, duplicados evitados).

4. **Detalle de cargo:** Al hacer clic en un cargo, se muestra drawer con detalle completo y pagos asociados.
