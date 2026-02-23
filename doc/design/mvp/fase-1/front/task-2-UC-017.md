# Task 2 — UC-017: Configuración de planes de cuota (Frontend)

## Información general

- **Fase:** 1
- **Tipo:** Frontend
- **UC:** UC-017
- **Bounded Context:** BC-Treasury
- **Prioridad:** Must

## Alcance

### Incluido

- Página de listado de planes de cuota (`/treasury/fee-plans`) con tabla filtrable por estado activo/inactivo
- Formulario de creación de plan de cuota con validación diferenciada por tipo (RECURRING vs ONE_TIME)
- Formulario de edición de plan existente con protección contra cambios destructivos
- Inactivación de plan con confirmación y verificación de suscripciones activas
- Vinculación de planes a tipos de socio (tabla intermedia `MemberTypeFeePlan`)
- Selector de plantillas predefinidas por tipo de colectividad (FA-1)
- Feedback visual: notificaciones de éxito/error, estados de carga, validaciones en tiempo real
- Integración con AppShell (navegación lateral, control de permisos)
- Integración con ErrorReporter (errores 5xx, ZodError)
- Tests unitarios (componentes + hooks) y tests E2E con Playwright

### Excluido

- Generación de cargos a partir de los planes (UC-019)
- Gestión de suscripciones de socios a planes (UC-018)
- Cálculo de prorrateo (UC-019, backend)
- Histórico de modificaciones de planes (post-MVP)
- Importación/exportación de planes en CSV/Excel (post-MVP)

## Dependencias

### Tareas previas requeridas

| Tarea | Artefacto necesario |
|-------|-------------------|
| **F1-Back Task 9 — UC-017** | Endpoints REST operativos: `POST /api/v1/fee-plans`, `GET /api/v1/fee-plans`, `GET /api/v1/fee-plans/:id`, `PUT /api/v1/fee-plans/:id`, `PATCH /api/v1/fee-plans/:id/deactivate`, `POST /api/v1/fee-plans/:id/link-member-types`, `GET /api/v1/member-types` (para vincular). Contratos de DTOs definidos |
| **F1-Back Task 3 — UC-008** | Endpoint `GET /api/v1/member-types` operativo para obtener tipos de socio disponibles al vincular planes |
| **F1-Front Task 1 — UC-002** | `AuthProvider`, `useAuth()`, `usePermissions()`, `ProtectedRoute`, `AppShell` con sidebar, HttpClient con interceptors de auth, `ErrorReporter` configurado |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `web/src/app/providers.tsx` existe con `MantineProvider` y `QueryClientProvider` configurados
- [ ] `web/src/shared/api/http-client.ts` existe con instancia Axios base configurada e interceptors de auth
- [ ] `web/src/shared/components/layout/app-shell.tsx` existe con sidebar funcional
- [ ] `web/src/features/auth/context/use-permissions.ts` existe y exporta `usePermissions()`
- [ ] `web/src/shared/observability/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] `zod` está instalado y disponible como dependencia
- [ ] `@mantine/form` está instalado y disponible
- [ ] Endpoint `GET /api/v1/fee-plans` responde correctamente (probar con curl o REST client)
- [ ] Endpoint `POST /api/v1/fee-plans` responde correctamente con plan creado
- [ ] Endpoint `GET /api/v1/member-types` responde con lista de tipos de socio
- [ ] Docker Compose con API y BD arrancados y accesibles desde `localhost:3000`
- [ ] Los permisos `treasury:fee-plans:read`, `treasury:fee-plans:create`, `treasury:fee-plans:update` existen en los roles seedeados

### Artefactos producidos

| Artefacto | Consumido por |
|-----------|---------------|
| Schemas Zod de planes de cuota (`schemas/fee-plan.schemas.ts`) | F1-Front Task 3 (UC-018 — suscripciones necesita datos de planes) |
| Hook `useFeePlans()` y `useFeePlan(id)` | F1-Front Task 3 (UC-018 — selector de plan al crear suscripción) |
| Página de listado y gestión de planes | Navegación desde sidebar de Tesorería |
| Servicio API `fee-plan.api.ts` | F1-Front Task 3 (UC-018 — consulta de planes vinculados a tipo de socio) |

## Referencia de especificación

| Documento | Contenido relevante |
|-----------|-------------------|
| `uc/uc-017.md` | Flujo completo de creación de planes, vinculación a tipos, plantillas predefinidas, flujos de excepción |
| `us/us-043.md` | Criterios de aceptación: creación de plan periódico, trimestral, único, importes no proporcionales |
| `us/us-044.md` | Criterios de aceptación: vinculación de planes a tipos de socio, plan default, orden |
| `bc/bc-treasury.md` | Aggregate FeePlan (code, name, type, amount, billingMonths, active), Entity MemberTypeFeePlan, Value Objects (Frequency, PlanType, BillingMonths) |
| `adr/adr-010.md` | Formato de respuesta API, paginación, headers |
| `stack/frontend.md` | React 19, Mantine 8, React Router 7, TanStack Query 5, Axios, Zod 4 |

## Puntos críticos

1. **Diferenciación de formulario por tipo de plan.** El formulario de creación debe adaptarse dinámicamente: si el tipo es `RECURRING`, mostrar selector de periodicidad orientativa y chips de meses de cobro (`billingMonths`). Si es `ONE_TIME`, ocultar los campos de periodicidad y meses. La validación Zod debe reflejar esta lógica condicional (discriminated union o refinement).

2. **Validación de meses de cobro.** Los `billingMonths` son un array de enteros 1-12 que define en qué meses se generan cargos. La UI debe permitir seleccionar meses individualmente (chips/checkboxes) y validar que para planes periódicos haya al menos un mes seleccionado. Además, debe mostrar una previsualización orientativa de la periodicidad (ej: "Se generarán 4 cargos al año").

3. **Vinculación a tipos de socio con restricción de default.** Al vincular planes a tipos de socio, solo puede haber un plan marcado como `isDefault` por tipo. La UI debe gestionar esto con radio buttons o toggle exclusivo, y mostrar advertencia si se intenta establecer un default cuando ya existe uno.

4. **Inactivación protegida.** No se puede eliminar un plan con suscripciones activas (FE-2). El frontend debe mostrar el conteo de suscripciones activas antes de permitir la inactivación, y ofrecer la alternativa de "marcar como inactivo" cuando la eliminación no es posible.

5. **Plantillas predefinidas.** El flujo FA-1 permite importar plantillas según tipo de colectividad. La UI debe mostrar un modal con las plantillas disponibles, permitir previsualizar los planes que se crearán, y confirmar antes de la importación masiva.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Contrato de API de planes no estabilizado al iniciar frontend | Media | Alto | Definir schemas Zod estrictos; cualquier cambio de API se detecta inmediatamente por error de parseo |
| Complejidad del formulario condicional (RECURRING vs ONE_TIME) | Media | Medio | Usar discriminated union en Zod y renderizado condicional en Mantine form |
| Endpoint de tipos de socio (BC-Membership) con latencia alta desde BC-Treasury | Baja | Medio | Cachear tipos de socio con TanStack Query (staleTime: 5 min) |
| Código de plan duplicado no detectado hasta submit | Baja | Bajo | Validación client-side informativa + error 409 del backend manejado con notificación clara |

## Plan de implementación

### Paso 1: Schemas Zod y tipos derivados

Crear en `web/src/features/treasury/fee-plans/schemas/`:

- **`fee-plan.schemas.ts`**: Definir schemas Zod que sirven como contrato de la API. Los tipos TypeScript se infieren automáticamente con `z.infer<>`, garantizando que la validación en runtime y el tipado en compilación estén siempre sincronizados:
  ```typescript
  import { z } from 'zod';

  // Enums
  const frequencySchema = z.enum([
    'MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'CUSTOM'
  ]);
  const planTypeSchema = z.enum(['ONE_TIME', 'RECURRING']);

  // Schema base del plan de cuota
  const feePlanSchema = z.object({
    id: z.string().uuid(),
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(100),
    description: z.string().nullable(),
    type: planTypeSchema,
    amount: z.number().min(0),
    frequency: frequencySchema.nullable(),
    billingMonths: z.array(z.number().int().min(1).max(12)),
    active: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

  // Schema de vinculación plan-tipo socio
  const memberTypeFeePlanSchema = z.object({
    memberTypeId: z.string().uuid(),
    memberTypeName: z.string(),
    feePlanId: z.string().uuid(),
    isDefault: z.boolean(),
    order: z.number().int().min(0),
    active: z.boolean(),
  });

  // Schema de plan con vinculaciones
  const feePlanDetailSchema = feePlanSchema.extend({
    linkedMemberTypes: z.array(memberTypeFeePlanSchema),
  });

  // Schema de listado (respuesta paginada)
  const feePlanListResponseSchema = z.object({
    data: z.array(feePlanSchema),
    total: z.number(),
  });

  // Schema de tipo de socio (para selector de vinculación)
  const memberTypeOptionSchema = z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    active: z.boolean(),
  });

  // Schema de plantilla predefinida
  const feePlanTemplateSchema = z.object({
    collectivityType: z.string(),
    templates: z.array(z.object({
      code: z.string(),
      name: z.string(),
      type: planTypeSchema,
      amount: z.number(),
      frequency: frequencySchema.nullable(),
      billingMonths: z.array(z.number().int().min(1).max(12)),
    })),
  });

  // Tipos inferidos
  type FeePlan = z.infer<typeof feePlanSchema>;
  type FeePlanDetail = z.infer<typeof feePlanDetailSchema>;
  type MemberTypeFeePlan = z.infer<typeof memberTypeFeePlanSchema>;
  type MemberTypeOption = z.infer<typeof memberTypeOptionSchema>;
  type FeePlanTemplate = z.infer<typeof feePlanTemplateSchema>;
  type Frequency = z.infer<typeof frequencySchema>;
  type PlanType = z.infer<typeof planTypeSchema>;
  ```

- Los schemas se exportan junto con los tipos. Las funciones API del paso 2 parsean las respuestas con `schema.parse(response.data.data)`, lo cual lanza `ZodError` si la API devuelve una estructura inesperada. Esto se captura en el interceptor de Axios y se reporta via `ErrorReporter`.

### Paso 2: Servicio API de planes de cuota

Crear en `web/src/features/treasury/fee-plans/api/`:

- **`fee-plan.api.ts`**: Funciones que encapsulan llamadas al backend. Cada función parsea la respuesta con el schema Zod correspondiente:
  - `getFeePlans(params?: { active?: boolean }): Promise<FeePlan[]>` — parsea con `z.array(feePlanSchema).parse(response.data.data)`
  - `getFeePlan(id: string): Promise<FeePlanDetail>` — parsea con `feePlanDetailSchema.parse(response.data.data)`
  - `createFeePlan(data: CreateFeePlanInput): Promise<FeePlan>` — parsea con `feePlanSchema.parse(response.data.data)`
  - `updateFeePlan(id: string, data: UpdateFeePlanInput): Promise<FeePlan>` — parsea con `feePlanSchema.parse(response.data.data)`
  - `deactivateFeePlan(id: string): Promise<void>`
  - `linkMemberTypes(planId: string, links: LinkMemberTypeInput[]): Promise<void>`
  - `getMemberTypes(): Promise<MemberTypeOption[]>` — parsea con `z.array(memberTypeOptionSchema).parse(response.data.data)`
  - `getTemplates(collectivityType: string): Promise<FeePlanTemplate>` — parsea con `feePlanTemplateSchema.parse(response.data.data)`
  - `importTemplate(collectivityType: string): Promise<FeePlan[]>` — parsea con `z.array(feePlanSchema).parse(response.data.data)`
  - Si `ZodError` se produce, se reporta via `ErrorReporter.captureException()` con el detalle de los campos que no coinciden

### Paso 3: Custom hooks con TanStack Query

Crear en `web/src/features/treasury/fee-plans/hooks/`:

- **`use-fee-plans.ts`**: Hook para listado de planes:
  ```typescript
  const useFeePlans = (params?: { active?: boolean }) => {
    return useQuery({
      queryKey: ['fee-plans', params],
      queryFn: () => getFeePlans(params),
      staleTime: 30_000, // 30 segundos
    });
  };
  ```
  Expone: `{ data: FeePlan[] | undefined, isLoading, isError, error }`

- **`use-fee-plan.ts`**: Hook para detalle de un plan:
  ```typescript
  const useFeePlan = (id: string) => {
    return useQuery({
      queryKey: ['fee-plans', id],
      queryFn: () => getFeePlan(id),
      enabled: !!id,
    });
  };
  ```

- **`use-create-fee-plan.ts`**: Hook de mutación para crear plan:
  ```typescript
  const useCreateFeePlan = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: createFeePlan,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['fee-plans'] });
        notifications.show({
          title: 'Plan creado',
          message: 'El plan de cuota se ha creado correctamente',
          color: 'green',
        });
      },
      onError: (error) => {
        if (error.response?.status === 409) {
          notifications.show({
            title: 'Código duplicado',
            message: 'Ya existe un plan con ese código. Pruebe con otro.',
            color: 'red',
          });
        }
      },
    });
  };
  ```

- **`use-update-fee-plan.ts`**: Hook de mutación para actualizar plan. Invalida queries `['fee-plans']` y `['fee-plans', id]` en `onSuccess`.

- **`use-deactivate-fee-plan.ts`**: Hook de mutación para inactivar plan. Maneja error 422 (suscripciones activas) con notificación descriptiva.

- **`use-link-member-types.ts`**: Hook de mutación para vincular tipos de socio a un plan.

- **`use-member-types.ts`**: Hook para obtener tipos de socio disponibles (para selector de vinculación). `staleTime: 300_000` (5 minutos).

- **`use-fee-plan-templates.ts`**: Hook para obtener plantillas predefinidas y mutation para importar.

### Paso 4: Página de listado de planes

Crear en `web/src/features/treasury/fee-plans/pages/`:

- **`fee-plans-list.page.tsx`**: Página principal del módulo de planes de cuota:
  - Título "Planes de Cuota" con badge del conteo total
  - Botón "Nuevo Plan" (visible solo si `can('treasury:fee-plans:create')`)
  - Botón "Importar Plantilla" (visible solo si no hay planes y `can('treasury:fee-plans:create')`)
  - Filtro por estado: toggle "Mostrar inactivos" (Switch de Mantine)
  - Tabla (Mantine Table) con columnas:
    - Código (badge monospace)
    - Nombre
    - Tipo (badge: "Periódico" verde / "Única" azul)
    - Importe (formateado en EUR con `Intl.NumberFormat`)
    - Periodicidad (texto descriptivo: "Mensual", "Trimestral", etc.)
    - Estado (badge: "Activo" verde / "Inactivo" gris)
    - Acciones (menú: Editar, Ver vinculaciones, Inactivar)
  - Estado vacío: ilustración + texto "No hay planes de cuota configurados" + botón "Crear primer plan"
  - Loading: skeleton de tabla con 5 filas
  - Error: alerta roja con botón de reintentar

### Paso 5: Formulario de creación/edición de plan

Crear en `web/src/features/treasury/fee-plans/components/`:

- **`fee-plan-form.tsx`**: Formulario reutilizable (creación y edición) con `@mantine/form`:
  - Campo `code` (TextInput, validación: 1-20 chars alfanuméricos, requerido, transformación a mayúsculas)
  - Campo `name` (TextInput, validación: requerido, 1-100 chars)
  - Campo `description` (Textarea, opcional, max 500 chars)
  - Campo `type` (SegmentedControl: "Periódico" / "Cuota Única")
  - Campo `amount` (NumberInput, validación: >= 0, precisión 2 decimales, sufijo "EUR")
  - **Sección condicional (solo si type === 'RECURRING'):**
    - Campo `frequency` (Select: Mensual, Trimestral, Semestral, Anual, Personalizada)
    - Campo `billingMonths` (Chip.Group, multi-select con los 12 meses)
    - Al seleccionar una periodicidad orientativa, preseleccionar los meses correspondientes:
      - MONTHLY → [1,2,3,4,5,6,7,8,9,10,11,12]
      - QUARTERLY → [1,4,7,10]
      - BIANNUAL → [1,7]
      - ANNUAL → [1]
      - CUSTOM → sin preselección
    - Texto informativo: "Se generarán X cargos al año"
  - Validación con `@mantine/form`:
    - `code`: requerido, formato alfanumérico
    - `amount`: requerido, >= 0
    - `billingMonths`: si type=RECURRING, al menos 1 mes seleccionado
  - Botón "Guardar" con loading state durante submit
  - Manejo de errores:
    - Código duplicado (409) → notificación roja con sugerencia de sufijo
    - Validación de meses inválidos (FE-4) → notificación roja
    - Plan periódico sin meses (FE-5) → error inline en el campo

- **`fee-plan-create-modal.tsx`**: Modal (Mantine Modal) que envuelve `fee-plan-form.tsx` para la creación. Se abre desde el botón "Nuevo Plan" de la lista.

- **`fee-plan-edit-modal.tsx`**: Modal que envuelve `fee-plan-form.tsx` con datos precargados del plan existente. Protege contra edición de código si tiene suscripciones activas.

### Paso 6: Vinculación de planes a tipos de socio

Crear en `web/src/features/treasury/fee-plans/components/`:

- **`link-member-types-modal.tsx`**: Modal de vinculación:
  - Título "Vincular a Tipos de Socio"
  - Tabla con todos los tipos de socio activos (obtenidos via `useMemberTypes()`)
  - Columnas:
    - Checkbox (seleccionar/deseleccionar vinculación)
    - Código del tipo
    - Nombre del tipo
    - Es Default (radio button, mutuamente exclusivo — solo uno puede ser default)
    - Orden (NumberInput, para prioridad en UI de alta)
  - Validación: solo un default por tipo de socio
  - Advertencia si un tipo ya tiene otro plan como default: "El tipo 'Adulto' ya tiene 'Anual' como plan por defecto. Se reemplazará"
  - Botones "Cancelar" y "Guardar vinculaciones" con loading state

### Paso 7: Plantillas predefinidas

Crear en `web/src/features/treasury/fee-plans/components/`:

- **`import-template-modal.tsx`**: Modal para importar plantillas (FA-1):
  - Selector de tipo de colectividad (Select: Peña, Cofradía, Club Deportivo, Asociación Cultural)
  - Al seleccionar tipo, mostrar previsualización de los planes que se crearán:
    - Tabla con nombre, tipo, importe, periodicidad de cada plan de la plantilla
  - Texto informativo: "Se crearán X planes de cuota con la configuración estándar para [tipo]"
  - Advertencia si ya existen planes: "Ya hay planes configurados. Los nuevos se añadirán a los existentes"
  - Botón "Importar" con loading state y confirmación
  - En `onSuccess`: invalidar queries, cerrar modal, notificación de éxito

### Paso 8: Diálogo de inactivación

Crear en `web/src/features/treasury/fee-plans/components/`:

- **`deactivate-fee-plan-modal.tsx`**: Modal de confirmación para inactivar un plan:
  - Si el plan tiene suscripciones activas: mostrar alerta naranja "Este plan tiene X suscripciones activas. No puede eliminarse, pero sí marcarse como inactivo."
  - Si no tiene suscripciones: permitir inactivación directa
  - Texto: "El plan dejará de aparecer en los selectores de alta pero las suscripciones existentes no se verán afectadas"
  - Botones "Cancelar" y "Marcar como Inactivo" (color naranja)

### Paso 9: Integración con AppShell

Actualizar `web/src/shared/components/layout/app-shell.tsx`:

- Añadir entrada en el sidebar bajo la sección "Tesorería":
  - Link "Planes de Cuota" condicionado por permiso `treasury:fee-plans:read`
  - Icono: `IconReceipt` de `@tabler/icons-react`
  - Ruta: `/treasury/fee-plans`

Actualizar `web/src/app/router.tsx`:

- Añadir ruta protegida:
  ```typescript
  {
    path: 'treasury/fee-plans',
    element: <ProtectedRoute permissions={['treasury:fee-plans:read']} />,
    children: [
      { index: true, element: <FeePlansListPage /> },
    ],
  }
  ```

### Paso 10: Integración con ErrorReporter

- Todos los errores 5xx capturados por el interceptor Axios se reportan automaticamente via `ErrorReporter.captureException()`
- Los `ZodError` producidos en el parseo de respuestas API se reportan con contexto: nombre del schema, campos fallidos, respuesta raw
- Los errores de negocio (409, 422) se manejan con notificaciones en la UI, sin reportar al ErrorReporter (son errores esperados)

### Paso 11: Tests

**Tests unitarios (componentes):**
- `FeePlansListPage`:
  - Renderiza tabla con planes cuando hay datos (mock useFeePlans)
  - Muestra estado vacío cuando no hay planes
  - Muestra loading skeleton durante carga
  - El botón "Nuevo Plan" solo aparece si tiene permiso `treasury:fee-plans:create`
  - El filtro de inactivos funciona correctamente
- `FeePlanForm`:
  - Renderiza campos correctos para tipo RECURRING (incluye meses)
  - Renderiza campos correctos para tipo ONE_TIME (oculta meses)
  - Muestra error de validación si code está vacío
  - Muestra error si type=RECURRING y billingMonths vacío
  - Al seleccionar periodicidad QUARTERLY, preselecciona meses [1,4,7,10]
  - Submit con datos válidos llama a la función onSubmit con datos correctos
- `LinkMemberTypesModal`:
  - Renderiza lista de tipos de socio
  - Solo permite un default por tipo
  - Muestra advertencia si se cambia el default
- `DeactivateFeePlanModal`:
  - Muestra alerta si hay suscripciones activas
  - Permite inactivar si no hay suscripciones

**Tests unitarios (hooks):**
- `useFeePlans()`:
  - Retorna datos correctos cuando la API responde
  - Retorna error cuando la API falla
  - Respeta el parámetro `active` en el filtro
- `useCreateFeePlan()`:
  - Invalida queries en `onSuccess`
  - Muestra notificación de éxito
  - Maneja error 409 con notificación de código duplicado
- `useDeactivateFeePlan()`:
  - Invalida queries en `onSuccess`
  - Maneja error 422 con notificación de suscripciones activas

**Tests E2E (Playwright):**
- Flujo completo: crear plan periódico mensual → verificar aparece en listado → editar importe → verificar cambio → vincular a tipo de socio → inactivar plan
- Flujo de plantillas: importar plantilla de peña → verificar que se crean los planes esperados
- Validaciones: intentar crear plan con código duplicado → verificar error

## Criterios de aceptación

Derivados de US-043 y US-044:

1. **Creación de plan periódico (US-043, escenario 1):** El tesorero puede crear un plan de cuota mensual con nombre, importe (15EUR), periodicidad MENSUAL y meses de cobro [1-12]. El plan queda activo y visible en el listado.

2. **Creación de plan trimestral personalizado (US-043, escenario 2):** El tesorero puede crear un plan trimestral con meses de cobro [9,12,3,6] para un ejercicio no natural (temporada). Los meses se almacenan correctamente.

3. **Creación de cuota única (US-043, escenario 3):** El tesorero puede crear un plan de tipo UNICA (inscripción) con importe fijo sin periodicidad ni meses de cobro. El plan queda disponible para aplicar en altas.

4. **Importes no proporcionales (US-043, escenario 4):** Los planes pueden tener importes independientes sin requerir proporcionalidad matemática entre ellos (ej: mensual 12EUR, trimestral 35EUR, anual 120EUR).

5. **Vinculación a tipos de socio (US-044, escenario 1):** El tesorero puede vincular múltiples planes a un tipo de socio, estableciendo uno como default y definiendo el orden de presentación en la UI de alta.

6. **Planes diferenciados por tipo (US-044, escenario 2):** Cada tipo de socio puede tener un conjunto distinto de planes vinculados. Los tipos sin planes muestran advertencia al intentar dar de alta.

7. **Código duplicado rechazado (FE-1):** Si se intenta crear un plan con un código que ya existe, la UI muestra error claro y sugiere alternativa con sufijo.

8. **Protección contra eliminación (FE-2):** Un plan con suscripciones activas no puede eliminarse. La UI ofrece la opción de inactivar en su lugar.
