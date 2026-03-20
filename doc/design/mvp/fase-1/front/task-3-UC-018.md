# Task 3 — UC-018: Gestión de suscripciones de cuota (Frontend)

## Información general

- **Fase:** 1
- **Tipo:** Frontend
- **UC:** UC-018
- **Bounded Context:** BC-Treasury
- **Prioridad:** Must

## Alcance

### Incluido

- Página de gestión de suscripciones dentro de la cuenta de socio (`/treasury/members/:memberId/subscriptions`)
- Creación de suscripción con selección de plan, descuentos por tipo y descuentos personalizados
- Cálculo en tiempo real del importe efectivo con fórmula multiplicativa de descuentos
- Cambio de modalidad de pago (cambio de plan) con selección de fecha efectiva
- Modificación de descuento personalizado en suscripción activa
- Visualización del histórico de suscripciones (timeline)
- Gestión de exenciones temporales (cierre de suscripción con motivo EXEMPTION)
- Feedback visual: cálculo de importes en vivo, notificaciones, estados de carga
- Integración con AppShell (navegación, permisos)
- Integración con ErrorReporter (errores 5xx, ZodError)
- Tests unitarios (componentes + hooks) y tests E2E con Playwright

### Excluido

- Creación automática de suscripción en el flujo de alta de socio (se gestiona en UC-011 frontend)
- Generación de cargos derivados de suscripciones (UC-019)
- Cálculo de prorrateo para altas a mitad de ejercicio (UC-019, backend)
- Pasarela de pago online (UC-025, post-MVP)
- Gestión de mandatos SEPA (UC-023, Fase 2)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F1-Back Task 10 — UC-018** | Endpoints REST operativos: `POST /api/v1/member-accounts/:id/subscriptions`, `GET /api/v1/member-accounts/:id/subscriptions`, `PUT /api/v1/member-accounts/:id/subscriptions/:subId`, `POST /api/v1/member-accounts/:id/subscriptions/:subId/change-plan`, `PATCH /api/v1/member-accounts/:id/subscriptions/:subId/close`. Contratos de DTOs definidos |
| **F1-Front Task 2 — UC-017** | Schemas Zod de planes de cuota, hook `useFeePlans()`, servicio API `fee-plan.api.ts` para consultar planes vinculados al tipo de socio |
| **F1-Front Task 1 — UC-002** | `AuthProvider`, `useAuth()`, `usePermissions()`, `ProtectedRoute`, `AppShell` con sidebar, HttpClient con interceptors de auth, `ErrorReporter` configurado |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `web/src/features/treasury/fee-plans/schemas/fee-plan.schemas.ts` existe con schemas exportados
- [ ] `web/src/features/treasury/fee-plans/hooks/use-fee-plans.ts` existe y funciona
- [ ] `web/src/shared/api/http-client.ts` existe con interceptors de auth configurados
- [ ] `web/src/shared/components/layout/app-shell.tsx` existe con sidebar funcional
- [ ] `web/src/features/auth/context/use-permissions.ts` existe y exporta `usePermissions()`
- [ ] `zod` y `@mantine/form` están instalados
- [ ] Endpoint `GET /api/v1/member-accounts/:id/subscriptions` responde correctamente
- [ ] Endpoint `POST /api/v1/member-accounts/:id/subscriptions` crea suscripciones
- [ ] Endpoint `POST /api/v1/member-accounts/:id/subscriptions/:subId/change-plan` funciona
- [ ] Docker Compose con API y BD arrancados y accesibles desde `localhost:3000`
- [ ] Los permisos `treasury:subscriptions:read`, `treasury:subscriptions:create`, `treasury:subscriptions:update` existen en los roles seedeados

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Schemas Zod de suscripciones (`schemas/subscription.schemas.ts`) | F1-Front Task 4 (UC-011 — alta de socio selecciona plan y crea suscripción) |
| Hook `useSubscriptions(memberId)` y `useCreateSubscription()` | F1-Front Task 4 (UC-011 — paso 3 del wizard de alta) |
| Componente `SubscriptionSelector` | F1-Front Task 4 (UC-011 — selector de plan en wizard) |
| Función `calculateEffectiveAmount()` (utilidad de cálculo de descuento) | F1-Front Task 4 (UC-011 — preview de importe en alta) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-018.md` | Flujo completo de suscripciones: creación en alta, cambio de plan, descuentos, exenciones, histórico |
| `us/us-045.md` | Criterios de aceptación: selección de modalidad de pago en alta, descuento por tipo, descuento personalizado |
| `us/us-046.md` | Criterios de aceptación: cambio de plan con cierre y apertura de suscripción, histórico |
| `us/us-049.md` | Criterios de aceptación: descuentos por tipo, personalizados, modificación en suscripción activa |
| `us/us-050.md` | Criterios de aceptación: exención total, temporal, parcial (descuento 100%) |
| `us/us-052.md` | Criterios de aceptación: histórico de suscripciones, detalle con cargos generados |
| `bc/bc-treasury.md` | Entity FeeSubscription (effectiveAmount, discount, cancelReason), Aggregate MemberAccount, SubscriptionCancelReason enum |
| `doc/brand/001-associated-brand-foundation.md` | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |

## Formateo de datos

### Importes monetarios

Todos los importes monetarios se formatean con la utilidad estándar:

```typescript
// Utility definida en web/src/shared/utils/format-money.ts
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
// Backend envía centavos (integers): 34500 → "345,00 €"
```

### Fechas

- Formato largo: "8 de marzo de 2026" (`Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })`)
- Formato compacto: "08/03/2026" (dd/MM/yyyy)
- NUNCA usar formato anglosajón: "03/08/2026"

### Tablas y columnas numéricas

Las columnas de importes en tablas y desgloses deben aplicar:

- `fontVariantNumeric: 'tabular-nums'` para columnas numéricas
- `textAlign: 'right'` para columnas de importes
- Headers de tabla: `uppercase`, `fz="xs"`, `fw={600}`, `c="dimmed"`

### Badges

Valores por defecto para todos los badges:

- `variant="light"` como default
- `radius="sm"` como default

### Color primario

Los botones de acción principal deben usar `color="brand"` en lugar del azul por defecto de Mantine. Nunca usar `variant="gradient"`.

## Puntos críticos

1. **Fórmula de descuento multiplicativa (CRITICO).** El cálculo del importe efectivo DEBE usar la fórmula multiplicativa: `effectiveAmount = baseAmount x (1 - descuentoTipo) x (1 - descuentoPersonalizado)`. NUNCA sumar porcentajes. La UI debe mostrar en tiempo real el desglose del cálculo para que el usuario vea claramente cómo se aplica cada descuento. Implementar la función `calculateEffectiveAmount()` como utilidad pura y testearla exhaustivamente.

2. **Restricción de una sola suscripción periódica activa.** Un socio solo puede tener una suscripción periódica activa simultáneamente (FE-3). La UI debe deshabilitar la creación de nueva suscripción periódica si ya existe una activa, y sugerir el flujo de "Cambiar Plan" en su lugar.

3. **Cambio de plan con fecha efectiva.** Al cambiar de plan, el usuario debe seleccionar cuándo se hace efectivo: inmediatamente, inicio del próximo mes, o inicio del próximo ejercicio. La UI debe mostrar las implicaciones de cada opción (cargos futuros cancelados, nuevo importe desde la fecha seleccionada).

4. **Descuentos combinados: descuento por tipo vs personalizado.** El descuento por tipo viene configurado en el `MemberType` y se aplica automáticamente. El descuento personalizado lo introduce el tesorero con un motivo obligatorio. Ambos se combinan multiplicativamente. La UI debe distinguir claramente ambos componentes y no permitir que el total combinado alcance 100% (FE-2, máximo 99%).

5. **Histórico de suscripciones como timeline.** El componente de histórico debe mostrar todas las suscripciones (activas y cerradas) en formato timeline con fechas, plan, importe efectivo y motivo de cierre. Los datos de suscripciones cerradas son de solo lectura.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Error en implementación de fórmula multiplicativa (se usa aditiva por error) | Media | Alto | Tests unitarios específicos que validan fórmula multiplicativa vs aditiva; test que verifica que 30%+10% da 37% efectivo, no 40% |
| Confusión del usuario con descuentos acumulados (no entiende por qué 30%+10% no es 40%) | Media | Medio | Mostrar desglose paso a paso en la UI: "Base: 120EUR -> Con dto tipo 30%: 84EUR -> Con dto personal 10%: 75.60EUR" |
| Cambio de plan con cargos pendientes genera inconsistencias | Baja | Alto | Mostrar advertencia clara con listado de cargos pendientes antes de confirmar; respetar la decisión del usuario (mantener o condonar) |
| Latencia al consultar cuenta de socio con muchas suscripciones históricas | Baja | Bajo | Paginar histórico de suscripciones; cargar solo suscripción activa por defecto |

## Plan de implementación

### Paso 1: Schemas Zod y tipos derivados

Crear en `web/src/features/treasury/subscriptions/schemas/`:

- **`subscription.schemas.ts`**: Definir schemas Zod para suscripciones:
  ```typescript
  import { z } from 'zod';

  // Enum de motivos de cierre
  const cancelReasonSchema = z.enum([
    'PLAN_CHANGE', 'MEMBER_LEAVE', 'EXEMPTION', 'ONE_TIME_COMPLETED'
  ]);

  // Schema de suscripción
  const feeSubscriptionSchema = z.object({
    id: z.string().uuid(),
    feePlanId: z.string().uuid(),
    feePlanName: z.string(),
    feePlanCode: z.string(),
    feePlanType: z.enum(['ONE_TIME', 'RECURRING']),
    baseAmount: z.number().min(0),
    typeDiscount: z.number().min(0).max(1).nullable(),
    personalDiscount: z.number().min(0).max(1).nullable(),
    personalDiscountReason: z.string().nullable(),
    effectiveAmount: z.number().min(0),
    registrationDate: z.string().datetime(),
    leaveDate: z.string().datetime().nullable(),
    cancelReason: cancelReasonSchema.nullable(),
    chargesGenerated: z.number().int().min(0),
    totalCollected: z.number().min(0),
  });

  // Schema de listado de suscripciones de un socio
  const memberSubscriptionsResponseSchema = z.object({
    memberId: z.string().uuid(),
    memberName: z.string(),
    memberTypeId: z.string().uuid(),
    memberTypeName: z.string(),
    activeSubscription: feeSubscriptionSchema.nullable(),
    closedSubscriptions: z.array(feeSubscriptionSchema),
  });

  // Schema para crear suscripción
  const createSubscriptionInputSchema = z.object({
    feePlanId: z.string().uuid(),
    personalDiscount: z.number().min(0).max(0.99).nullable(),
    personalDiscountReason: z.string().min(3).max(500).nullable(),
  });

  // Schema para cambio de plan
  const changePlanInputSchema = z.object({
    newFeePlanId: z.string().uuid(),
    effectiveDate: z.string().datetime(),
    effectiveDateType: z.enum(['IMMEDIATE', 'NEXT_MONTH', 'NEXT_FISCAL_YEAR']),
    keepPendingCharges: z.boolean(),
  });

  // Schema para modificar descuento
  const updateDiscountInputSchema = z.object({
    personalDiscount: z.number().min(0).max(0.99),
    reason: z.string().min(3).max(500),
    approvedBy: z.string().min(3).max(200),
  });

  // Tipos inferidos
  type FeeSubscription = z.infer<typeof feeSubscriptionSchema>;
  type MemberSubscriptionsResponse = z.infer<typeof memberSubscriptionsResponseSchema>;
  type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;
  type ChangePlanInput = z.infer<typeof changePlanInputSchema>;
  type UpdateDiscountInput = z.infer<typeof updateDiscountInputSchema>;
  type CancelReason = z.infer<typeof cancelReasonSchema>;
  ```

### Paso 2: Utilidad de cálculo de descuento

Crear en `web/src/features/treasury/subscriptions/utils/`:

- **`discount-calculator.ts`**: Función pura para cálculo multiplicativo de descuentos:
  ```typescript
  /**
   * Calcula el importe efectivo aplicando descuentos multiplicativamente.
   * NUNCA suma porcentajes — cada descuento se aplica sobre el importe ya descontado.
   *
   * @example
   * calculateEffectiveAmount(120, 0.30, 0.10)
   * // 120 * (1 - 0.30) * (1 - 0.10) = 120 * 0.70 * 0.90 = 75.60
   */
  const calculateEffectiveAmount = (
    baseAmount: number,
    typeDiscount: number | null,
    personalDiscount: number | null
  ): { effectiveAmount: number; totalDiscountPercent: number; breakdown: DiscountBreakdown }
  ```
  - Retorna el importe efectivo, el porcentaje total de descuento y un desglose paso a paso
  - Redondeo a 2 decimales con `Math.round(value * 100) / 100`
  - Validación: si la suma efectiva de descuentos alcanza 100%, lanza error

### Paso 3: Servicio API de suscripciones

Crear en `web/src/features/treasury/subscriptions/api/`:

- **`subscription.api.ts`**: Funciones API:
  - `getSubscriptions(memberAccountId: string): Promise<MemberSubscriptionsResponse>` — parsea con `memberSubscriptionsResponseSchema`
  - `createSubscription(memberAccountId: string, data: CreateSubscriptionInput): Promise<FeeSubscription>` — parsea con `feeSubscriptionSchema`
  - `changePlan(memberAccountId: string, subscriptionId: string, data: ChangePlanInput): Promise<FeeSubscription>` — parsea con `feeSubscriptionSchema`
  - `updateDiscount(memberAccountId: string, subscriptionId: string, data: UpdateDiscountInput): Promise<FeeSubscription>` — parsea con `feeSubscriptionSchema`
  - `closeSubscription(memberAccountId: string, subscriptionId: string, reason: CancelReason): Promise<void>`
  - Si `ZodError` se produce, se reporta via `ErrorReporter.captureException()` con contexto del schema

### Paso 4: Custom hooks con TanStack Query

Crear en `web/src/features/treasury/subscriptions/hooks/`:

- **`use-subscriptions.ts`**: Hook para suscripciones de un socio:
  ```typescript
  const useSubscriptions = (memberAccountId: string) => {
    return useQuery({
      queryKey: ['subscriptions', memberAccountId],
      queryFn: () => getSubscriptions(memberAccountId),
      enabled: !!memberAccountId,
    });
  };
  ```

- **`use-create-subscription.ts`**: Hook de mutación:
  ```typescript
  const useCreateSubscription = (memberAccountId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: CreateSubscriptionInput) =>
        createSubscription(memberAccountId, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['subscriptions', memberAccountId] });
        notifications.show({
          title: 'Suscripción creada',
          message: 'La suscripción se ha creado correctamente',
          color: 'green',
        });
      },
      onError: (error) => {
        if (error.response?.status === 409) {
          notifications.show({
            title: 'Suscripción duplicada',
            message: 'Ya existe una suscripción periódica activa. Ciérrela primero o cambie de plan.',
            color: 'red',
          });
        }
      },
    });
  };
  ```

- **`use-change-plan.ts`**: Hook de mutación para cambio de plan. Invalida queries de suscripciones en `onSuccess`. Maneja error 422 (cargos pendientes) mostrando diálogo de confirmación.

- **`use-update-discount.ts`**: Hook de mutación para modificar descuento personalizado.

- **`use-close-subscription.ts`**: Hook de mutación para cerrar suscripción (exención, baja).

### Paso 5: Componente de selección de plan (reutilizable)

Crear en `web/src/features/treasury/subscriptions/components/`:

- **`subscription-selector.tsx`**: Componente reutilizable para seleccionar plan y calcular descuento. Usado tanto en la página de suscripciones como en el wizard de alta de socio (UC-011):
  - Props: `memberTypeId`, `typeDiscount`, `onSelect(subscriptionData)`
  - Obtiene planes vinculados al tipo de socio via `useFeePlans({ memberTypeId })`
  - Renderiza tarjetas (Mantine Card) por cada plan disponible:
    - Nombre del plan
    - Tipo (badge `variant="light"` `radius="sm"`)
    - Importe base (formateado con `formatMoney()`)
    - Importe con descuento por tipo (si aplica, formateado con `formatMoney()`)
    - Badge "Recomendado" (`variant="light"`, `radius="sm"`) en el plan default
  - Campo de descuento personalizado (NumberInput, 0-99%, opcional)
  - Campo de motivo del descuento personalizado (Textarea, requerido si descuento > 0)
  - Preview en tiempo real del importe efectivo con desglose (importes formateados con `formatMoney()`, `fontVariantNumeric: 'tabular-nums'`, `textAlign: 'right'`):
    ```
    Importe base:              120,00 €
    Descuento tipo (30%):     - 36,00 €
    Subtotal:                   84,00 €
    Descuento personal (10%): -  8,40 €
    Importe efectivo:           75,60 €
    Descuento total:              37 %
    ```
  - Validación: descuento total < 100% (FE-2)

### Paso 6: Página de suscripciones del socio

Crear en `web/src/features/treasury/subscriptions/pages/`:

- **`member-subscriptions.page.tsx`**: Página de gestión de suscripciones de un socio:
  - Breadcrumb: "Tesorería > Cuentas de Socio > [Nombre] > Suscripciones"
  - **Sección: Suscripción Activa**
    - Si hay suscripción activa, mostrar tarjeta (Mantine Card) con:
      - Nombre del plan, código (badge `variant="light"` `radius="sm"`), tipo (badge `variant="light"` `radius="sm"`)
      - Importe base y descuento desglosado (formateado con `formatMoney()`, `fontVariantNumeric: 'tabular-nums'`)
      - Importe efectivo (destacado, tamaño grande, formateado con `formatMoney()`)
      - Fecha de inicio (formato largo: "8 de marzo de 2026")
      - Cargos generados / cargos pagados
      - Botones de acción (`color="brand"`, visibles según permisos):
        - "Cambiar Plan" → abre modal de cambio
        - "Modificar Descuento" → abre modal de descuento
        - "Exención Temporal" → abre modal de exención
    - Si no hay suscripción activa:
      - Texto "Sin suscripción activa"
      - Botón "Crear Suscripción" (`color="brand"`, si `can('treasury:subscriptions:create')`)
  - **Sección: Histórico de Suscripciones**
    - Timeline (Mantine Timeline) con suscripciones cerradas:
      - Cada entrada muestra: periodo (formato compacto "dd/MM/yyyy"), plan, importe efectivo (formateado con `formatMoney()`), motivo de cierre
      - Al expandir: desglose de descuentos, cargos generados, total cobrado (formateado con `formatMoney()`, `fontVariantNumeric: 'tabular-nums'`)
  - Loading: skeleton completo
  - Error: alerta con reintentar

### Paso 7: Modal de cambio de plan

Crear en `web/src/features/treasury/subscriptions/components/`:

- **`change-plan-modal.tsx`**: Modal para cambio de modalidad de pago:
  - Sección "Plan actual": nombre, importe (formateado con `formatMoney()`), descuento
  - Selector de nuevo plan (Select, filtrado por planes vinculados al tipo de socio)
  - Previsualización del nuevo importe efectivo (formateado con `formatMoney()`, mantiene descuento actual)
  - Selector de fecha efectiva (SegmentedControl):
    - "Inmediato (próximo cargo)"
    - "Inicio próximo mes"
    - "Inicio próximo ejercicio"
  - Alerta informativa: "Los cargos futuros del plan actual se cancelarán"
  - Si hay cargos pendientes (FE-1): alerta amarilla (`color="yellow"`) con opciones:
    - "Mantener cargos pendientes (la deuda se arrastra)"
    - "Cancelar cargos pendientes (requiere autorización)" — solo si `can('treasury:subscriptions:cancel-charges')`
  - Botones "Cancelar" y "Confirmar Cambio" (`color="brand"`) con loading state

### Paso 8: Modal de modificación de descuento

Crear en `web/src/features/treasury/subscriptions/components/`:

- **`update-discount-modal.tsx`**: Modal para modificar descuento personalizado:
  - Muestra descuento actual desglosado (por tipo + personalizado)
  - Campo nuevo descuento personalizado (NumberInput, 0-99%)
  - Campo motivo obligatorio (Textarea, min 3 chars)
  - Campo "Aprobado por" (TextInput, ej: "Junta Directiva 15/03/2026")
  - Previsualización del nuevo importe efectivo con desglose en tiempo real (importes formateados con `formatMoney()`, `fontVariantNumeric: 'tabular-nums'`)
  - Alerta informativa: "Los cargos ya generados mantienen su importe original. Solo los cargos futuros usarán el nuevo descuento."
  - Validación: descuento total combinado < 100% (FE-2)
  - Botones "Cancelar" y "Guardar" (`color="brand"`) con loading state

### Paso 9: Modal de exención temporal

Crear en `web/src/features/treasury/subscriptions/components/`:

- **`exemption-modal.tsx`**: Modal para aplicar exención temporal:
  - Selector de tipo de exención:
    - "Exención total (sin suscripción)" — cierra suscripción con motivo EXEMPTION
    - "Exención con trazabilidad (descuento 100%)" — modifica descuento a 100%
  - Campos:
    - Motivo (Textarea, requerido)
    - Periodo de exención: fecha inicio / fecha fin (DatePicker de Mantine, formato compacto "dd/MM/yyyy")
    - Aprobado por (TextInput)
  - Alerta: "No se generarán cargos durante el periodo de exención"
  - Botones "Cancelar" y "Aplicar Exención" (`color="brand"`) con loading state

### Paso 10: Integración con AppShell y rutas

Actualizar `web/src/app/router.tsx`:

- Añadir ruta protegida:
  ```typescript
  {
    path: 'treasury/members/:memberId/subscriptions',
    element: <ProtectedRoute permissions={['treasury:subscriptions:read']} />,
    children: [
      { index: true, element: <MemberSubscriptionsPage /> },
    ],
  }
  ```

- El acceso a esta página se realiza desde la ficha del socio o desde el listado de cuentas de tesorería (link "Ver suscripciones")

### Paso 11: Tests

**Tests unitarios (componentes):**
- `MemberSubscriptionsPage`:
  - Renderiza suscripción activa cuando existe (mock useSubscriptions)
  - Muestra "Sin suscripción activa" cuando no hay
  - Muestra timeline de suscripciones cerradas
  - Botones de acción solo visibles con permisos correctos
- `SubscriptionSelector`:
  - Renderiza planes disponibles para el tipo de socio
  - Calcula importe efectivo correctamente con descuento multiplicativo
  - Muestra desglose de descuentos paso a paso
  - Rechaza descuento total >= 100%
  - Marca plan default con badge "Recomendado"
- `ChangePlanModal`:
  - Muestra plan actual y selector de nuevo plan
  - Previsualiza nuevo importe
  - Muestra alerta de cargos pendientes si los hay
  - Opciones de fecha efectiva funcionan correctamente
- `UpdateDiscountModal`:
  - Muestra descuento actual desglosado
  - Calcula nuevo importe en tiempo real
  - Valida motivo obligatorio
  - Rechaza descuento >= 100% combinado

**Tests unitarios (utils):**
- `calculateEffectiveAmount()`:
  - `(120, 0.30, null)` → `84.00` (solo descuento tipo)
  - `(120, 0.30, 0.10)` → `75.60` (multiplicativo correcto)
  - `(120, 0.30, 0.10)` NO da `72.00` (verificar que NO es aditivo)
  - `(120, null, 0.20)` → `96.00` (solo descuento personalizado)
  - `(120, null, null)` → `120.00` (sin descuentos)
  - `(120, 0.50, 0.50)` → `30.00` (descuento total 75%, no 100%)
  - `(120, 1.0, null)` → error (descuento tipo = 100%)

**Tests unitarios (hooks):**
- `useSubscriptions()`:
  - Retorna datos correctos con suscripción activa y cerradas
  - Retorna error cuando la API falla
- `useCreateSubscription()`:
  - Invalida queries en `onSuccess`
  - Maneja error 409 (suscripción duplicada)
- `useChangePlan()`:
  - Invalida queries de suscripciones en `onSuccess`
  - Maneja error 422 (cargos pendientes sin confirmar)

**Tests E2E (Playwright):**
- Flujo completo: ver suscripción activa de socio → cambiar plan a anual → verificar nueva suscripción → modificar descuento → verificar importe actualizado
- Flujo de exención: aplicar exención temporal → verificar que suscripción se cierra → verificar motivo en histórico
- Validaciones: intentar crear segunda suscripción periódica → verificar rechazo

## Criterios de aceptación

Derivados de US-045, US-046, US-049, US-050, US-052:

1. **Selección de modalidad de pago (US-045, escenario 1):** Al acceder a las suscripciones de un socio juvenil, se muestran los planes disponibles con descuento del 30% aplicado. El importe efectivo se calcula con fórmula multiplicativa y se muestra en tiempo real.

2. **Descuento personalizado adicional (US-045, escenario 3):** El tesorero puede añadir un descuento personalizado del 10% adicional al descuento por tipo del 30%. El importe resultante es 75.60EUR (120 x 0.70 x 0.90), no 72EUR (120 x 0.60).

3. **Cambio de plan (US-046, escenario 1):** Al cambiar de plan mensual a anual, la suscripción actual se cierra con motivo CAMBIO_PLAN, se crea nueva suscripción con el nuevo plan, y el usuario puede elegir la fecha efectiva del cambio.

4. **Histórico de suscripciones (US-046, escenario 2):** El socio con múltiples cambios de plan ve un timeline con todas sus suscripciones históricas, mostrando periodo, plan, importe y motivo de cierre.

5. **Descuento por tipo automático (US-049, escenario 1):** Al crear suscripción para socio juvenil con descuento configurado del 30% y plan anual de 120EUR, el importe efectivo es 84EUR automáticamente.

6. **Modificación de descuento en suscripción activa (US-049, escenario 3):** Al modificar el descuento de 30% a 40%, los cargos futuros reflejan el nuevo importe. Los cargos ya generados mantienen su importe original.

7. **Exención total para socio de honor (US-050, escenario 1):** Un tipo de socio sin planes vinculados no genera suscripción ni cargos. Aparece en listado de socios exentos.

8. **Exención temporal (US-050, escenario 2):** Se puede cerrar una suscripción con motivo EXEMPTION para un periodo definido. No se generan cargos durante la exención.

9. **Detalle de suscripción (US-052, escenario 2):** Al expandir una suscripción del histórico, se muestra plan, importe base, descuento, importe efectivo, cargos generados y total cobrado.
