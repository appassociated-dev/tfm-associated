# Task 5 — UC-013: Baja de socio (Frontend)

## Información general

- **Fase:** 1
- **Tipo:** Frontend
- **UC:** UC-013
- **Bounded Context:** BC-Membership
- **Prioridad:** Must

## Alcance

### Incluido

- Pantalla de baja voluntaria accesible desde la ficha del socio (`/members/:id/leave`)
- Formulario de baja voluntaria con configuración de estatutos (fecha efectiva)
- Resumen de suscripciones activas que se cerrarán y cargos pendientes
- Confirmación de baja con feedback visual
- Pantalla de baja por impago con resumen del workflow de morosidad
- Vista del certificado de descubierto (preview antes de generar)
- Pantalla de rehabilitación de ex-socio con cálculo de importe total
- Integración con máquina de estados del socio (transiciones disponibles)
- Feedback visual: estados del socio con colores, notificaciones, diálogos de confirmación
- Integración con AppShell (navegación, permisos)
- Integración con ErrorReporter (errores 5xx, ZodError)
- Tests unitarios (componentes + hooks) y tests E2E con Playwright

### Excluido

- Expediente disciplinario completo (US-034, solo se muestra la opción si el rol es Presidente)
- Workflow automatizado de morosidad (UC-022, backend)
- Generación de certificado de descubierto en PDF (backend)
- Envío de notificaciones al socio (BC-Communication, backend)
- Cancelación de inscripciones en eventos (BC-Events, post-MVP)
- Proceso completo de lista de espera en rehabilitación (post-MVP)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F1-Back Task 8 — UC-013** | Endpoints REST operativos: `POST /api/v1/members/:id/voluntary-leave`, `POST /api/v1/members/:id/nonpayment-leave`, `POST /api/v1/members/:id/reinstate`, `GET /api/v1/members/:id/leave-summary`. Contratos de DTOs definidos |
| **F1-Back Task 5 — UC-007** | Endpoints de estados: `GET /api/v1/members/:id/available-transitions`, `GET /api/v1/members/:id/status-history`. Máquina de estados validando transiciones a VOLUNTARY_LEAVE, NONPAYMENT_LEAVE |
| **F1-Front Task 4 — UC-011** | Listado de socios existente con navegación a ficha del socio. Schemas de socio reutilizables |
| **F1-Front Task 1 — UC-002** | `AuthProvider`, `useAuth()`, `usePermissions()`, `ProtectedRoute`, `AppShell` con sidebar, HttpClient con interceptors de auth, `ErrorReporter` configurado |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `web/src/shared/api/http-client.ts` existe con interceptors de auth configurados
- [ ] `web/src/shared/components/layout/app-shell.tsx` existe con sidebar funcional
- [ ] `web/src/features/auth/context/use-permissions.ts` existe y exporta `usePermissions()`
- [ ] `web/src/shared/observability/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] `zod` y `@mantine/form` están instalados
- [ ] Endpoint `POST /api/v1/members/:id/voluntary-leave` responde correctamente
- [ ] Endpoint `GET /api/v1/members/:id/leave-summary` retorna resumen de suscripciones y cargos
- [ ] Endpoint `GET /api/v1/members/:id/available-transitions` retorna transiciones permitidas
- [ ] Endpoint `GET /api/v1/members/:id/status-history` retorna historial de estados
- [ ] Endpoint `POST /api/v1/members/:id/reinstate` funciona para rehabilitación
- [ ] Los permisos `membership:members:deactivate`, `membership:members:reinstate`, `membership:members:read` existen en los roles seedeados
- [ ] Docker Compose con API y BD arrancados y accesibles desde `localhost:3000`

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Schemas Zod de baja de socio (`schemas/member-leave.schemas.ts`) | Módulos que consulten estado de baja del socio |
| Hook `useMemberLeave()` y `useReinstateMember()` | Ficha del socio (botones de acción según estado) |
| Componente `StatusBadge` para mostrar estado del socio | Reutilizable en listados, fichas, dashboards |
| Componente `StatusTimeline` para historial de estados | Ficha del socio (sección de historial) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-013.md` | Flujo completo de baja voluntaria, por impago, disciplinaria, rehabilitación, fórmulas de fecha efectiva |
| `us/us-032.md` | Criterios de aceptación: baja voluntaria con fecha efectiva según estatutos, registro en historial |
| `us/us-033.md` | Criterios de aceptación: workflow de baja por impago, certificado de descubierto, oportunidad de regularización |
| `us/us-034.md` | Criterios de aceptación: fases del expediente disciplinario, trazabilidad |
| `us/us-035.md` | Criterios de aceptación: rehabilitación con pago de deuda, mantenimiento de antigüedad |
| `bc/bc-membership.md` | Aggregate Member (deactivate, changeStatus), MemberStatus (VOLUNTARY_LEAVE, NONPAYMENT_LEAVE, DISCIPLINARY_LEAVE), DisciplinaryCase |
| `uc/uc-007.md` | Máquina de estados, transiciones permitidas, estados terminales |
| `doc/brand/001-associated-brand-foundation.md` | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |

## Puntos críticos

1. **Fecha efectiva según configuración de estatutos.** La baja voluntaria puede tener diferentes fechas efectivas según los estatutos del tenant: inmediata, fin de ejercicio, fin de mes siguiente, o tras preaviso de N días. La UI debe mostrar las opciones disponibles (configuradas por el tenant) y calcular/previsualizar la fecha efectiva correspondiente. El cálculo se realiza en backend pero la UI debe mostrar la previsualización antes de confirmar.

2. **Resumen de impacto financiero.** Antes de confirmar la baja, la UI debe mostrar claramente: (a) suscripciones activas que se cerrarán, (b) cargos pendientes de pago que se mantienen como deuda, (c) que no se generarán nuevos cargos futuros. Esta información proviene del endpoint `leave-summary` y es critica para que el secretario tome una decisión informada.

3. **Protección de estados terminales.** El frontend debe consultar las transiciones disponibles (`available-transitions`) antes de mostrar las opciones de baja. Si el socio ya está en un estado terminal (VOLUNTARY_LEAVE, NONPAYMENT_LEAVE, DISCIPLINARY_LEAVE, DECEASED), las opciones de baja deben estar deshabilitadas. Solo se muestra la opción de rehabilitación si el estado es terminal rehabilitable (VOLUNTARY_LEAVE o NONPAYMENT_LEAVE).

4. **Rehabilitación con desglose de costes.** La pantalla de rehabilitación debe mostrar el desglose completo del importe a pagar: deuda pendiente, penalización (si aplica), nueva inscripción (si aplica). El pago debe ser completo; no se permite pago parcial (FE-3). La opción de mantener antigüedad depende de la configuración del tenant.

5. **Confirmación con doble paso.** Las acciones de baja son irreversibles (o requieren proceso formal de rehabilitación). La UI debe implementar un diálogo de confirmación de doble paso: primero mostrar resumen, luego requerir confirmación explícita con texto descriptivo de las consecuencias.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Baja accidental sin confirmación suficiente | Media | Alto | Implementar confirmación de doble paso con resumen de impacto; requerir re-escritura de texto "CONFIRMAR BAJA" |
| Endpoint `leave-summary` no disponible y se confirma baja sin ver impacto | Baja | Alto | Bloquear botón "Confirmar" si leave-summary no cargó; mostrar alerta si no se pudo obtener resumen |
| Cargos pendientes no visibles al secretario antes de confirmar baja | Baja | Medio | Sección destacada (alerta amarilla, `color="yellow"`) con listado de cargos pendientes y su importe total |
| BC-Treasury no responde al consultar estado de cuotas (FE-2) | Baja | Medio | Mostrar "Estado de cuotas temporalmente no disponible" con opción de reintentar; permitir baja con advertencia |

## Plan de implementación

### Paso 1: Schemas Zod y tipos derivados

Crear en `web/src/features/membership/leave/schemas/`:

- **`member-leave.schemas.ts`**: Definir schemas Zod para procesos de baja:
  ```typescript
  import { z } from 'zod';

  // Enum de tipos de baja
  const leaveTypeSchema = z.enum([
    'VOLUNTARY_LEAVE', 'NONPAYMENT_LEAVE', 'DISCIPLINARY_LEAVE'
  ]);

  // Enum de configuraciones de fecha efectiva
  const effectiveDateConfigSchema = z.enum([
    'IMMEDIATE', 'END_OF_FISCAL_YEAR', 'END_OF_NEXT_MONTH', 'NOTICE_PERIOD'
  ]);

  // Schema de resumen de baja
  const leaveSummarySchema = z.object({
    memberId: z.string().uuid(),
    memberName: z.string(),
    memberNumber: z.string(),
    currentStatus: z.string(),
    availableLeaveTypes: z.array(leaveTypeSchema),
    effectiveDateOptions: z.array(z.object({
      type: effectiveDateConfigSchema,
      effectiveDate: z.string().datetime(),
      label: z.string(),
      description: z.string(),
    })),
    activeSubscriptions: z.array(z.object({
      id: z.string().uuid(),
      planName: z.string(),
      effectiveAmount: z.number(),
      periodicity: z.string(),
    })),
    pendingCharges: z.array(z.object({
      id: z.string().uuid(),
      description: z.string(),
      amount: z.number(),
      dueDate: z.string().datetime(),
    })),
    totalPendingDebt: z.number(),
  });

  // Schema de petición de baja voluntaria
  const voluntaryLeaveRequestSchema = z.object({
    effectiveDateType: effectiveDateConfigSchema,
    reason: z.string().min(3, 'Motivo es obligatorio (mínimo 3 caracteres)').max(500),
  });

  // Schema de respuesta de baja
  const leaveResponseSchema = z.object({
    memberId: z.string().uuid(),
    previousStatus: z.string(),
    newStatus: z.string(),
    effectiveDate: z.string().datetime(),
    subscriptionsClosed: z.number(),
    pendingChargesAmount: z.number(),
  });

  // Schema de rehabilitación
  const reinstatementSummarySchema = z.object({
    memberId: z.string().uuid(),
    memberName: z.string(),
    memberNumber: z.string(),
    leaveDate: z.string().datetime(),
    leaveType: leaveTypeSchema,
    pendingDebt: z.number(),
    penalty: z.number(),
    newRegistrationFee: z.number(),
    totalToPay: z.number(),
    keepSeniority: z.boolean(),
    previousSeniorityMonths: z.number(),
  });

  const reinstatementRequestSchema = z.object({
    paymentConfirmed: z.boolean().refine(val => val === true, 'Debe confirmar el pago'),
  });

  const reinstatementResponseSchema = z.object({
    memberId: z.string().uuid(),
    newStatus: z.string(),
    debtPaid: z.number(),
    seniorityRecovered: z.boolean(),
    registrationDate: z.string().datetime(),
  });

  // Schema de historial de estados
  const statusHistoryEntrySchema = z.object({
    id: z.string().uuid(),
    previousStatus: z.string(),
    newStatus: z.string(),
    reason: z.string(),
    changedBy: z.string(),
    changedAt: z.string().datetime(),
  });

  const statusHistorySchema = z.object({
    memberId: z.string().uuid(),
    currentStatus: z.string(),
    entries: z.array(statusHistoryEntrySchema),
  });

  // Schema de transiciones disponibles
  const availableTransitionsSchema = z.object({
    memberId: z.string().uuid(),
    currentStatus: z.string(),
    availableTransitions: z.array(z.object({
      status: z.string(),
      description: z.string(),
    })),
  });

  // Tipos inferidos
  type LeaveType = z.infer<typeof leaveTypeSchema>;
  type LeaveSummary = z.infer<typeof leaveSummarySchema>;
  type VoluntaryLeaveRequest = z.infer<typeof voluntaryLeaveRequestSchema>;
  type LeaveResponse = z.infer<typeof leaveResponseSchema>;
  type ReinstatementSummary = z.infer<typeof reinstatementSummarySchema>;
  type ReinstatementResponse = z.infer<typeof reinstatementResponseSchema>;
  type StatusHistoryEntry = z.infer<typeof statusHistoryEntrySchema>;
  type StatusHistory = z.infer<typeof statusHistorySchema>;
  type AvailableTransitions = z.infer<typeof availableTransitionsSchema>;
  ```

### Paso 2: Servicio API de baja de socio

Crear en `web/src/features/membership/leave/api/`:

- **`member-leave.api.ts`**: Funciones API:
  - `getLeaveSummary(memberId: string): Promise<LeaveSummary>` — parsea con `leaveSummarySchema`
  - `processVoluntaryLeave(memberId: string, data: VoluntaryLeaveRequest): Promise<LeaveResponse>` — parsea con `leaveResponseSchema`
  - `processNonpaymentLeave(memberId: string): Promise<LeaveResponse>` — parsea con `leaveResponseSchema`
  - `getReinstatementSummary(memberId: string): Promise<ReinstatementSummary>` — parsea con `reinstatementSummarySchema`
  - `reinstateMember(memberId: string, data: ReinstatementRequest): Promise<ReinstatementResponse>` — parsea con `reinstatementResponseSchema`
  - `getStatusHistory(memberId: string): Promise<StatusHistory>` — parsea con `statusHistorySchema`
  - `getAvailableTransitions(memberId: string): Promise<AvailableTransitions>` — parsea con `availableTransitionsSchema`
  - Si `ZodError` se produce, se reporta via `ErrorReporter.captureException()`

### Paso 3: Custom hooks con TanStack Query

Crear en `web/src/features/membership/leave/hooks/`:

- **`use-leave-summary.ts`**: Hook para obtener resumen de baja:
  ```typescript
  const useLeaveSummary = (memberId: string) => {
    return useQuery({
      queryKey: ['leave-summary', memberId],
      queryFn: () => getLeaveSummary(memberId),
      enabled: !!memberId,
    });
  };
  ```

- **`use-voluntary-leave.ts`**: Hook de mutación para baja voluntaria:
  ```typescript
  const useVoluntaryLeave = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ memberId, data }: { memberId: string; data: VoluntaryLeaveRequest }) =>
        processVoluntaryLeave(memberId, data),
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['members'] });
        queryClient.invalidateQueries({ queryKey: ['leave-summary'] });
        notifications.show({
          title: 'Baja voluntaria procesada',
          message: `Baja efectiva el ${formatDate(data.effectiveDate)}. Suscripciones cerradas: ${data.subscriptionsClosed}`,
          color: 'green',
        });
      },
      onError: (error) => {
        if (error.response?.status === 422) {
          notifications.show({
            title: 'Transición no permitida',
            message: error.response?.data?.message || 'No se puede procesar la baja desde el estado actual.',
            color: 'red',
          });
        }
      },
    });
  };
  ```

- **`use-reinstatement-summary.ts`**: Hook para resumen de rehabilitación.

- **`use-reinstate-member.ts`**: Hook de mutación para rehabilitación. Invalida queries de members y status-history en `onSuccess`.

- **`use-status-history.ts`**: Hook para historial de estados:
  ```typescript
  const useStatusHistory = (memberId: string) => {
    return useQuery({
      queryKey: ['status-history', memberId],
      queryFn: () => getStatusHistory(memberId),
      enabled: !!memberId,
    });
  };
  ```

- **`use-available-transitions.ts`**: Hook para transiciones disponibles desde el estado actual.

### Paso 4: Componentes reutilizables de estado

Crear en `web/src/features/membership/leave/components/`:

- **`status-badge.tsx`**: Componente para mostrar estado del socio como badge con color:
  ```typescript
  const STATUS_CONFIG = {
    ACTIVE: { color: 'green', label: 'Activo', variant: 'light' },
    APPLICANT: { color: 'blue', label: 'Aspirante', variant: 'light' },
    PENDING_PAYMENT: { color: 'yellow', label: 'Pendiente de Pago', variant: 'light' },
    SUSPENDED: { color: 'red', label: 'Suspendido', variant: 'light' },
    VOLUNTARY_LEAVE: { color: 'gray', label: 'Baja Voluntaria', variant: 'light' },
    NONPAYMENT_LEAVE: { color: 'red', label: 'Baja por Impago', variant: 'filled' },
    DISCIPLINARY_LEAVE: { color: 'dark', label: 'Baja Disciplinaria', variant: 'light' },
    DECEASED: { color: 'dark', label: 'Fallecido', variant: 'filled' },
  };
  ```

  Mapeo de estados a colores según sistema de marca:

  | Estado | Color | Token Mantine |
  |--------|-------|---------------|
  | ACTIVE | green | `color="green"` |
  | APPLICANT | blue | `color="blue"` |
  | PENDING_PAYMENT | yellow | `color="yellow"` |
  | SUSPENDED | red | `color="red"` |
  | VOLUNTARY_LEAVE | gray | `color="gray"` |
  | NONPAYMENT_LEAVE | red | `color="red"` variant="filled" (para diferenciar de SUSPENDED que usa variant="light") |
  | DISCIPLINARY_LEAVE | dark | `color="dark"` |
  | DECEASED | dark | `color="dark"` variant="filled" |

  Los estados DISCIPLINARY_LEAVE y DECEASED usan `color="dark"` como extensión del mapeo de marca. NONPAYMENT_LEAVE usa `variant="filled"` para diferenciarse visualmente de SUSPENDED, ambos en rojo.

  Renderiza un Mantine Badge con el color, variant y texto correspondiente al estado. Todos los badges usan `radius="sm"` como default de marca.

- **`status-timeline.tsx`**: Componente de timeline de historial de estados:
  - Usa Mantine Timeline component
  - Cada entrada muestra:
    - Icono de color según el nuevo estado
    - Fecha formateada (formato largo: "8 de marzo de 2026", dd/MM/yyyy en contextos compactos. NUNCA formato anglosajón)
    - Transición: "Estado anterior -> Estado nuevo"
    - Motivo del cambio
    - Quién ejecutó el cambio (nombre o "Sistema")
  - Entradas ordenadas cronológicamente (más reciente arriba)
  - Badge diferenciado para cambios automáticos (Sistema) vs manuales. Badges con `variant="light"` y `radius="sm"` como defaults de marca.

### Paso 5: Página de baja voluntaria

Crear en `web/src/features/membership/leave/pages/`:

- **`voluntary-leave.page.tsx`**: Página de baja voluntaria:
  - Breadcrumb: "Socios > [Nombre del socio] > Baja Voluntaria"
  - Carga resumen via `useLeaveSummary(memberId)`
  - **Sección: Datos del socio**
    - Nombre, número de socio, DNI
    - Estado actual (StatusBadge)
    - Si estado no permite baja → alerta roja "Este socio no puede darse de baja desde el estado actual" + mostrar transiciones disponibles
  - **Sección: Configuración de fecha efectiva**
    - Radio Group (Mantine Radio.Group) con opciones disponibles según estatutos:
      - "Baja inmediata ([fecha])" — efectiva hoy
      - "Baja a fin de ejercicio ([fecha])" — efectiva 31/12/YYYY
      - "Baja tras preaviso de 30 días ([fecha])" — efectiva hoy + 30 días
    - Cada opción muestra la fecha efectiva calculada
    - Formato de fechas: largo "8 de marzo de 2026", compacto "08/03/2026" (dd/MM/yyyy). NUNCA usar formato anglosajón.
  - **Sección: Impacto financiero**
    - Alerta informativa (amarilla `color="yellow"` si hay deuda, verde si no hay):
    - Tabla de suscripciones activas que se cerrarán:
      - Plan, importe efectivo, periodicidad
    - Tabla de cargos pendientes que se mantienen:
      - Descripción, importe, fecha vencimiento
    - Total deuda pendiente (destacado, tamaño grande, rojo si > 0)
    - Usar `formatMoney()` de `@/shared/utils/format-money.ts` para mostrar todos los importes.
      Backend envía centavos como enteros: 34500 → "345,00 €"
    - Notas: "Los cargos pendientes se mantienen como deuda" y "No se generarán nuevos cargos futuros"
  - **Sección: Motivo**
    - Campo motivo (Textarea, @mantine/form, requerido, min 3 chars, max 500)
  - **Confirmación:**
    - Botón "Confirmar Baja Voluntaria" (`color="red"`, loading state). Nunca usar `variant="gradient"`.
    - Al pulsar: modal de confirmación de doble paso:
      - Resumen: "Se dará de baja al socio [Nombre] (#XXXXX) con fecha efectiva [fecha]"
      - "Esta acción cerrará X suscripciones activas"
      - "Los cargos pendientes (XXX,XX €) se mantienen" (usar `formatMoney()`)
      - Botón "Confirmar" (rojo) y "Cancelar"

### Paso 6: Pantalla de baja por impago

Crear en `web/src/features/membership/leave/pages/`:

- **`nonpayment-leave.page.tsx`**: Pantalla para la baja por impago:
  - Solo accesible si `can('membership:members:deactivate')` y el socio cumple las condiciones del workflow
  - **Sección: Resumen del workflow de morosidad**
    - Timeline de fases completadas:
      - Fase 1 (90 días): Primera notificación [fecha]
      - Fase 2 (180 días): Segunda notificación [fecha]
      - Fase 3 (365 días): Aviso de expediente [fecha]
      - Fase 4 (730 días): Certificado de descubierto [fecha]
      - Fase 5: Baja efectiva [pendiente]
    - Si no todas las fases están completas: alerta "El workflow de morosidad no está completo. Faltan X fases."
  - **Sección: Certificado de descubierto (preview)**
    - Datos del socio
    - Deuda detallada (cargos, importes, fechas)
    - Fechas de notificaciones enviadas
    - Botón "Generar Certificado PDF" (`color="brand"`, descarga el PDF generado por backend). Nunca usar `variant="gradient"`.
  - **Sección: Oportunidad de regularización**
    - Si el socio paga antes del plazo, mostrar botón "Cancelar Baja - Regularización" (`color="brand"`)
    - Al pulsar: confirmar que se cancela el proceso y el socio vuelve a ACTIVO
  - **Confirmación de baja:**
    - Botón "Ejecutar Baja por Impago" (`color="red"`, con confirmación de doble paso). Nunca usar `variant="gradient"`.

### Paso 7: Pantalla de rehabilitación

Crear en `web/src/features/membership/leave/pages/`:

- **`reinstatement.page.tsx`**: Pantalla de rehabilitación de ex-socio:
  - Solo accesible si el socio está en estado VOLUNTARY_LEAVE o NONPAYMENT_LEAVE
  - Si está en DISCIPLINARY_LEAVE o DECEASED → alerta "Este socio no puede rehabilitarse"
  - Carga resumen via `useReinstatementSummary(memberId)`
  - **Sección: Datos del ex-socio**
    - Nombre, número, fecha de baja, tipo de baja (StatusBadge)
  - **Sección: Desglose de importe a pagar**
    - Tabla desglosada (Mantine Table):
      - Deuda pendiente: XXX,XX €
      - Penalización: XXX,XX € (si aplica según estatutos)
      - Nueva inscripción: XXX,XX € (si aplica)
      - **Total a pagar: XXX,XX €** (destacado)
    - Usar `formatMoney()` de `@/shared/utils/format-money.ts` para mostrar todos los importes.
      Backend envía centavos como enteros: 34500 → "345,00 €"
    - Alerta (`color="yellow"`): "El pago debe ser completo. No se permiten pagos parciales." (FE-3)
  - **Sección: Antigüedad**
    - Si `keepSeniority = true`: "Se recuperará la antigüedad anterior (XX meses)"
    - Si `keepSeniority = false`: "La antigüedad comenzará desde la fecha de rehabilitación"
  - **Confirmación:**
    - Checkbox: "Confirmo que el pago de XXX,XX € ha sido recibido" (obligatorio, usar `formatMoney()`)
    - Botón "Rehabilitar Socio" (`color="green"`, loading state, deshabilitado hasta confirmar pago). Nunca usar `variant="gradient"`.
    - Al confirmar exitoso: notificación de éxito + redirigir a ficha del socio

### Paso 8: Integración con ficha del socio

Crear en `web/src/features/membership/leave/components/`:

- **`leave-actions.tsx`**: Componente de acciones de baja integrable en la ficha del socio:
  - Consulta transiciones disponibles via `useAvailableTransitions(memberId)`
  - Si el socio puede darse de baja (transición a VOLUNTARY_LEAVE disponible):
    - Botón "Procesar Baja Voluntaria" (`color="red"`, `variant="outline"`, icono `IconUserMinus`)
    - Link a `/members/:id/leave`
  - Si el socio está en estado terminal rehabilitable:
    - Botón "Rehabilitar Socio" (`color="green"`, icono `IconUserPlus`)
    - Link a `/members/:id/reinstate`
  - Si el socio está en estado terminal inmutable (DISCIPLINARY_LEAVE, DECEASED):
    - Texto informativo: "Este socio está dado de baja de forma permanente"
  - Si el socio está en PENDING_PAYMENT y es tesorero:
    - Botón "Procesar Baja por Impago" (`color="yellow"`, warning según sistema de marca)

### Paso 9: Integración con AppShell y rutas

Actualizar `web/src/app/router.tsx`:

- Añadir rutas protegidas:
  ```typescript
  {
    path: 'members/:id/leave',
    element: <ProtectedRoute permissions={['membership:members:deactivate']} />,
    children: [
      { index: true, element: <VoluntaryLeavePage /> },
    ],
  },
  {
    path: 'members/:id/nonpayment-leave',
    element: <ProtectedRoute permissions={['membership:members:deactivate']} />,
    children: [
      { index: true, element: <NonpaymentLeavePage /> },
    ],
  },
  {
    path: 'members/:id/reinstate',
    element: <ProtectedRoute permissions={['membership:members:reinstate']} />,
    children: [
      { index: true, element: <ReinstatementPage /> },
    ],
  },
  ```

- Las rutas de baja no aparecen directamente en el sidebar (se accede desde la ficha del socio via el componente `LeaveActions`)

### Paso 10: Integración con ErrorReporter

- Errores 5xx en procesos de baja → `ErrorReporter.captureException()` con contexto del socio y tipo de baja
- `ZodError` en parseo de respuestas → reporte con detalle de campos fallidos
- Errores de negocio (422 transición no permitida, 409 estado concurrente) → notificaciones en UI sin reporte al ErrorReporter
- Error al obtener `leave-summary` (BC-Treasury caído, FE-2) → alerta en UI con opción de reintentar

### Paso 11: Tests

**Tests unitarios (componentes):**
- `VoluntaryLeavePage`:
  - Renderiza resumen del socio con datos correctos (mock useLeaveSummary)
  - Muestra opciones de fecha efectiva según estatutos
  - Muestra suscripciones activas que se cerrarán
  - Muestra deuda pendiente con total destacado
  - Bloquea baja si estado no permite transición
  - Modal de confirmación de doble paso funciona
  - Motivo obligatorio: no permite confirmar sin motivo
- `NonpaymentLeavePage`:
  - Renderiza timeline de fases del workflow
  - Muestra alerta si workflow incompleto
  - Muestra preview de certificado de descubierto
  - Botón de regularización cancela el proceso
- `ReinstatementPage`:
  - Renderiza desglose de importe a pagar
  - Muestra información de antigüedad
  - Checkbox de confirmación de pago es obligatorio
  - Botón deshabilitado hasta confirmar pago
  - Muestra error si estado no es rehabilitable
- `StatusBadge`:
  - Renderiza badge con color correcto para cada uno de los 8 estados
- `StatusTimeline`:
  - Renderiza timeline con entradas ordenadas cronológicamente
  - Diferencia cambios manuales de automáticos
- `LeaveActions`:
  - Muestra botón de baja si transición disponible
  - Muestra botón de rehabilitación si estado terminal rehabilitable
  - Muestra texto informativo si estado inmutable
  - Oculta acciones si no tiene permisos

**Tests unitarios (hooks):**
- `useLeaveSummary()`:
  - Retorna resumen con suscripciones y cargos pendientes
  - Retorna error cuando la API falla
- `useVoluntaryLeave()`:
  - Invalida queries en `onSuccess`
  - Muestra notificación con fecha efectiva
  - Maneja error 422 (transición no permitida) con notificación
- `useReinstateMember()`:
  - Invalida queries de members y status-history
  - Muestra notificación de éxito
  - Maneja error de pago incompleto (FE-3)
- `useStatusHistory()`:
  - Retorna historial ordenado cronológicamente
- `useAvailableTransitions()`:
  - Retorna transiciones correctas según estado actual

**Tests E2E (Playwright):**
- Flujo completo de baja voluntaria: acceder a ficha de socio activo → pulsar "Procesar Baja" → seleccionar fecha efectiva → escribir motivo → confirmar → verificar estado cambiado a VOLUNTARY_LEAVE
- Flujo de rehabilitación: acceder a ficha de ex-socio → pulsar "Rehabilitar" → confirmar pago → verificar estado cambiado a ACTIVE
- Validaciones: intentar baja de socio ya dado de baja → verificar rechazo; intentar rehabilitación sin confirmar pago → verificar botón deshabilitado

## Criterios de aceptación

Derivados de US-032, US-033, US-034, US-035:

1. **Baja voluntaria con fecha según estatutos (US-032, escenario 1):** El secretario puede procesar una baja voluntaria seleccionando la opción de fecha efectiva configurada en los estatutos (inmediata, fin de ejercicio, o tras preaviso). Las suscripciones se cierran con motivo BAJA_SOCIO y los cargos pendientes se mantienen.

2. **Baja inmediata vs fin de ejercicio (US-032, escenario 2):** La UI muestra las opciones de fecha efectiva disponibles con la fecha calculada correspondiente para cada una. El secretario puede elegir la opción adecuada.

3. **Registro en historial (US-032, escenario 3):** Tras la baja, el timeline del socio muestra la solicitud de baja con fecha y la baja efectiva con motivo. Visible en el componente StatusTimeline.

4. **Workflow de baja por impago (US-033, escenario 1):** La pantalla de baja por impago muestra el timeline de fases del workflow de morosidad. Si no están completas todas las fases, se bloquea la baja.

5. **Certificado de descubierto (US-033, escenario 2):** El tesorero puede previsualizar el certificado de descubierto con datos del socio, deuda detallada y notificaciones enviadas antes de generar el PDF.

6. **Oportunidad de regularización (US-033, escenario 3):** Si el socio paga la deuda antes del plazo, el tesorero puede cancelar el proceso de baja y el socio vuelve a estado ACTIVO.

7. **Rehabilitación con pago de deuda (US-035, escenario 1):** El secretario puede rehabilitar a un ex-socio dado de baja por impago. La pantalla muestra el desglose de deuda pendiente + penalización + nueva inscripción. El pago debe ser completo.

8. **Rehabilitación con antigüedad (US-035, escenario 2):** Si la configuración del tenant lo permite, al rehabilitar se recupera la antigüedad anterior. El timeline muestra claramente el periodo de baja.
