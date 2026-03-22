# Task 4 — UC-011: Alta simple de socio (Frontend)

## Información general

- **Fase:** 1
- **Tipo:** Frontend
- **UC:** UC-011
- **Bounded Context:** BC-Membership
- **Prioridad:** Must

## Alcance

### Incluido

- Wizard de alta de socio en 3 pasos (`/members/new`)
- Paso 1: Formulario de datos personales (DNI/NIE, nombre, apellidos, fecha nacimiento, email, teléfono, dirección)
- Paso 2: Selector de tipo de socio con validación de requisitos (rango de edad)
- Paso 3: Resumen y confirmación con cargo de inscripción
- Validación de DNI español (algoritmo mod 23) y NIE
- Validación de unicidad de DNI en el tenant (consulta al backend)
- Validación de edad contra requisitos del tipo de socio seleccionado
- Cálculo y previsualización de cargo de inscripción (plan UNICA)
- Asignación automática de número de socio
- Feedback visual: progress bar, validaciones en tiempo real, notificaciones de éxito/error
- Integración con AppShell (navegación, permisos)
- Integración con ErrorReporter (errores 5xx, ZodError)
- Tests unitarios (componentes + hooks) y tests E2E con Playwright

### Excluido

- Alta completa con documentación y avales (UC-006, Fase 2)
- Selección de plan de cuota periódica (se gestiona post-alta en UC-018)
- Proceso de lista de espera (UC-006, post-MVP)
- Generación de carnet digital (post-MVP)
- Envío de email de bienvenida (BC-Communication, backend)
- Pasarela de pago online (UC-025, post-MVP)
- Datos bancarios / IBAN (FA-2, se gestiona en edición de ficha UC-006)

## Dependencias

### Tareas previas requeridas

| Tarea                        | Artefacto necesario                                                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1-Back Task 7 — UC-011**  | Endpoints REST operativos: `POST /api/v1/members/simple-registration`, `GET /api/v1/members/check-dni/:dni` (verificación unicidad). Contratos de DTOs definidos (`SimpleRegistrationDto`, `MemberResponseDto`) |
| **F1-Back Task 3 — UC-008**  | Endpoint `GET /api/v1/member-types` operativo para obtener tipos de socio con sus requisitos (rangos de edad, derechos)                                                                                         |
| **F1-Front Task 1 — UC-002** | `AuthProvider`, `useAuth()`, `usePermissions()`, `ProtectedRoute`, `AppShell` con sidebar, HttpClient con interceptors de auth, `ErrorReporter` configurado                                                     |

### Checklist de verificación de dependencias

Antes de iniciar esta tarea, verificar que:

- [ ] `web/src/shared/api/http-client.ts` existe con interceptors de auth configurados
- [ ] `web/src/shared/components/layout/app-shell.tsx` existe con sidebar funcional
- [ ] `web/src/features/auth/context/use-permissions.ts` existe y exporta `usePermissions()`
- [ ] `web/src/shared/observability/error-reporter.port.ts` existe y exporta la interfaz `ErrorReporter`
- [ ] `zod`, `react-hook-form` y `@hookform/resolvers` están instalados
- [ ] Endpoint `POST /api/v1/members/simple-registration` responde correctamente
- [ ] Endpoint `GET /api/v1/member-types` responde con lista de tipos de socio activos
- [ ] Endpoint `GET /api/v1/members/check-dni/:dni` responde con existencia del DNI
- [ ] Los permisos `membership:members:create`, `membership:members:read` existen en los roles seedeados
- [ ] Al menos 1 tipo de socio configurado en el tenant
- [ ] Al menos 1 plan de cuota tipo UNICA (inscripción) configurado
- [ ] Ejercicio activo abierto en el tenant
- [ ] Docker Compose con API y BD arrancados y accesibles desde `localhost:3000`

### Artefactos producidos

| Artefacto                                                               | Consumido por                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| Schemas Zod de alta de socio (`schemas/member-registration.schemas.ts`) | F1-Front Task 5 (UC-013 — baja necesita datos del socio)     |
| Hook `useMemberTypes()` para listar tipos de socio                      | Reutilizable en otros módulos que necesiten selector de tipo |
| Utilidad `validateDni()` para validación client-side de DNI/NIE         | Reutilizable en importación masiva (UC-056, Fase 2)          |
| Página de alta como entrada de navegación en sidebar                    | Navegación desde "Socios > Nuevo Socio"                      |

## Referencia de especificación

| Documento                                           | Contenido relevante                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `uc/uc-011.md`                                      | Flujo completo del wizard de 3 pasos, validaciones, cargo de inscripción, evento MemberRegistered                                  |
| `us/us-028.md`                                      | Criterios de aceptación: alta simple en 3 pasos, alta con pago inmediato                                                           |
| `bc/bc-membership.md`                               | Aggregate Member (PersonalData, ContactData, IdentityDocument, MemberStatus, MemberType), Value Objects                            |
| `bc/bc-treasury.md`                                 | Entity FeeSubscription (plan UNICA, cierre automático), Charge (cargo de inscripción)                                              |
| `adr/adr-010.md`                                    | Formato de respuesta API, headers                                                                                                  |
| `rnf/rnf-001.md`                                    | Validación de DNI (RNFT-009): algoritmo mod 23, soporte NIE                                                                        |
| `doc/brand/001-associated-brand-foundation.md`      | Fundamentos de marca, paleta de colores, tipografía, iconografía, tono de voz y principios de composición                          |
| `doc/brand/002-associated-ui-product-guidelines.md` | Guía de implementación UI/UX con Mantine 8.x: theme tokens, default props de componentes, layout, formateo de datos y brand assets |

## Puntos críticos

1. **Wizard multi-paso con estado persistente.** El wizard de 3 pasos debe mantener el estado entre pasos sin perder datos al navegar adelante/atrás. Usar estado local del componente padre (no Context API global, ya que el wizard es autocontenido). Validar cada paso antes de permitir avanzar al siguiente. El botón "Siguiente" debe estar deshabilitado hasta que el paso actual sea válido.

2. **Validación de DNI/NIE en tiempo real.** Implementar dos niveles de validación: (a) formato/algoritmo client-side (mod 23 para DNI, prefijo X/Y/Z para NIE) que valida al perder foco del campo, y (b) unicidad via API (debounced, 500ms) que consulta `check-dni` para verificar que no existe otro socio con el mismo DNI en el tenant. Si existe, mostrar error con datos del socio existente y sugerir rehabilitación.

3. **Validación de edad contra tipo de socio.** Al seleccionar un tipo de socio en el paso 2, el sistema debe verificar que la edad del aspirante (calculada desde la fecha de nacimiento del paso 1) cumple el rango de edad del tipo. Si no cumple, mostrar alerta descriptiva ("El aspirante tiene 30 años, pero 'Adulto' requiere 35+ años") y sugerir tipos compatibles.

4. **Cargo de inscripción obligatorio.** El paso 3 muestra el cargo de inscripción que se generará (plan UNICA). Si no hay plan de inscripción configurado en el tenant (FE-4), el sistema debe bloquear el alta y redirigir a la configuración de planes. El cargo se crea como pendiente de pago; el pago efectivo se gestiona por separado.

5. **Precondición de ejercicio abierto.** Si no hay ejercicio activo abierto (FE-5), el sistema debe bloquear el acceso al wizard con mensaje claro: "No hay ejercicio abierto. Abra el ejercicio actual primero." y link a la gestión de ejercicios.

## Riesgos

| Riesgo                                                                         | Probabilidad | Impacto | Mitigación                                                                                                   |
| ------------------------------------------------------------------------------ | ------------ | ------- | ------------------------------------------------------------------------------------------------------------ |
| Validación de DNI con algoritmo incorrecto genera falsos positivos/negativos   | Baja         | Alto    | Implementar algoritmo estándar mod 23 con tests exhaustivos (casos límite: letras especiales, NIE con X/Y/Z) |
| Usuario pierde datos del wizard por navegación accidental (back del navegador) | Media        | Medio   | Usar `beforeunload` event para advertir, y `useBlocker` de React Router para confirmar salida                |
| API de alta responde lento (>2s) y el usuario hace doble click                 | Media        | Medio   | Deshabilitar botón "Confirmar" durante submit; mostrar overlay de loading; idempotencia en backend           |
| Tipo de socio sin plan de inscripción bloquea el alta sin alternativa clara    | Baja         | Alto    | Mostrar alerta con link directo a configuración de planes; verificar precondición al cargar el wizard        |

## Plan de implementación

### Paso 1: Schemas Zod y tipos derivados

Crear en `web/src/features/membership/registration/schemas/`:

- **`member-registration.schemas.ts`**: Definir schemas Zod para el proceso de alta:

  ```typescript
  import { z } from 'zod';

  // Schema de datos personales (paso 1)
  const personalDataSchema = z.object({
    dni: z.string().min(1, 'DNI/NIE es obligatorio').max(20),
    firstName: z.string().min(1, 'Nombre es obligatorio').max(100),
    lastName: z.string().min(1, 'Apellidos es obligatorio').max(200),
    birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Fecha de nacimiento inválida'),
    email: z.string().email('Email inválido'),
    phone: z.string().max(20).nullable(),
    address: z.string().max(300).nullable(),
    postalCode: z.string().max(10).nullable(),
    city: z.string().max(100).nullable(),
  });

  // Schema de tipo de socio (para selector del paso 2)
  const memberTypeSchema = z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    ageRangeMin: z.number().int().nullable(),
    ageRangeMax: z.number().int().nullable(),
    votingRight: z.boolean(),
    eligibleForOffice: z.boolean(),
    active: z.boolean(),
  });

  // Schema de cargo de inscripción (paso 3)
  const registrationChargeSchema = z.object({
    feePlanId: z.string().uuid(),
    feePlanName: z.string(),
    amount: z.number().min(0),
  });

  // Schema de la petición completa de alta
  const simpleRegistrationRequestSchema = z.object({
    dni: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    birthDate: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    postalCode: z.string().nullable(),
    city: z.string().nullable(),
    memberTypeId: z.string().uuid(),
  });

  // Schema de respuesta de alta exitosa
  const registrationResponseSchema = z.object({
    memberId: z.string().uuid(),
    memberNumber: z.string(),
    status: z.string(),
    memberTypeName: z.string(),
    registrationDate: z.string().datetime(),
    registrationCharge: z
      .object({
        chargeId: z.string().uuid(),
        amount: z.number(),
        description: z.string(),
        status: z.string(),
      })
      .nullable(),
  });

  // Schema de verificación de DNI
  const dniCheckResponseSchema = z.object({
    exists: z.boolean(),
    memberName: z.string().nullable(),
    memberNumber: z.string().nullable(),
  });

  // Tipos inferidos
  type PersonalData = z.infer<typeof personalDataSchema>;
  type MemberType = z.infer<typeof memberTypeSchema>;
  type RegistrationCharge = z.infer<typeof registrationChargeSchema>;
  type SimpleRegistrationRequest = z.infer<typeof simpleRegistrationRequestSchema>;
  type RegistrationResponse = z.infer<typeof registrationResponseSchema>;
  type DniCheckResponse = z.infer<typeof dniCheckResponseSchema>;
  ```

### Paso 2: Utilidad de validación de DNI/NIE

Crear en `web/src/features/membership/registration/utils/`:

- **`dni-validator.ts`**: Funciones puras de validación:

  ```typescript
  /**
   * Valida formato y letra de control de DNI español.
   * Algoritmo: número mod 23 → letra correspondiente en tabla.
   */
  const validateDni = (dni: string): { valid: boolean; error?: string }

  /**
   * Valida formato de NIE (X, Y, Z + 7 dígitos + letra).
   * X→0, Y→1, Z→2 para el cálculo de la letra de control.
   */
  const validateNie = (nie: string): { valid: boolean; error?: string }

  /**
   * Valida DNI o NIE según el formato detectado.
   */
  const validateIdentityDocument = (document: string): { valid: boolean; error?: string }

  /**
   * Calcula la edad a partir de una fecha de nacimiento.
   */
  const calculateAge = (birthDate: string): number
  ```

### Paso 3: Servicio API de alta de socio

Crear en `web/src/features/membership/registration/api/`:

- **`registration.api.ts`**: Funciones API:
  - `checkDni(dni: string): Promise<DniCheckResponse>` — parsea con `dniCheckResponseSchema.parse(response.data.data)`
  - `getMemberTypes(): Promise<MemberType[]>` — parsea con `z.array(memberTypeSchema).parse(response.data.data)`
  - `simpleRegistration(data: SimpleRegistrationRequest): Promise<RegistrationResponse>` — parsea con `registrationResponseSchema.parse(response.data.data)`
  - Si `ZodError` se produce, se reporta via `ErrorReporter.captureException()`

### Paso 4: Custom hooks con TanStack Query

Crear en `web/src/features/membership/registration/hooks/`:

- **`use-member-types.ts`**: Hook para listar tipos de socio:

  ```typescript
  const useMemberTypes = () => {
    return useQuery({
      queryKey: ['member-types', { active: true }],
      queryFn: () => getMemberTypes(),
      staleTime: 300_000, // 5 minutos
    });
  };
  ```

- **`use-check-dni.ts`**: Hook para verificar unicidad de DNI (debounced):

  ```typescript
  const useCheckDni = (dni: string) => {
    const debouncedDni = useDebouncedValue(dni, 500);
    return useQuery({
      queryKey: ['check-dni', debouncedDni],
      queryFn: () => checkDni(debouncedDni),
      enabled: !!debouncedDni && debouncedDni.length >= 8,
    });
  };
  ```

- **`use-simple-registration.ts`**: Hook de mutación para ejecutar el alta:
  ```typescript
  const useSimpleRegistration = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: simpleRegistration,
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['members'] });
        notifications.show({
          title: 'Socio dado de alta',
          message: `Socio dado de alta correctamente. Número asignado: ${data.memberNumber}`,
          color: 'green',
        });
      },
      onError: (error) => {
        if (error.response?.status === 409) {
          notifications.show({
            title: 'DNI duplicado',
            message: 'Ya existe un socio con ese DNI. ¿Es una reactivación?',
            color: 'red',
          });
        } else if (error.response?.status === 422) {
          const detail = error.response?.data?.message;
          notifications.show({
            title: 'Error de validación',
            message: detail || 'Datos inválidos. Revise el formulario.',
            color: 'red',
          });
        }
      },
    });
  };
  ```

### Paso 5: Componente wizard con stepper

Crear en `web/src/features/membership/registration/pages/`:

- **`simple-registration.page.tsx`**: Página principal del wizard:
  - Verificación de precondiciones al montar:
    - Si no hay ejercicio abierto (FE-5) → alerta bloqueante con link a gestión de ejercicios
    - Si no hay tipos de socio → alerta bloqueante con link a configuración de tipos
  - Stepper de Mantine con 3 pasos:
    - Paso 1: "Datos Personales" (icono usuario)
    - Paso 2: "Tipo de Socio" (icono categoría)
    - Paso 3: "Confirmación" (icono check)
  - Progress bar visual
  - Estado del wizard en `useState` del componente padre:
    ```typescript
    const [wizardData, setWizardData] = useState<{
      personalData: PersonalData | null;
      memberTypeId: string | null;
    }>({ personalData: null, memberTypeId: null });
    ```
  - Botones "Anterior" (`variant="default"`) / "Siguiente" (`color="brand"`) / "Confirmar Alta" (`color="brand"`) según paso activo. Nunca usar `variant="gradient"`.
  - `useBlocker` de React Router para prevenir navegación accidental con datos sin guardar

### Paso 6: Paso 1 — Datos personales

Crear en `web/src/features/membership/registration/components/`:

- **`personal-data-step.tsx`**: Formulario del paso 1 con `react-hook-form` + `zodResolver`:
  - Campo `dni` (TextInput):
    - Validación de formato client-side (DNI/NIE) al perder foco
    - Consulta de unicidad debounced via `useCheckDni()`
    - Indicador de estado: spinner (consultando), check verde (disponible), X roja (duplicado)
    - Si duplicado: alerta "Ya existe un socio con DNI 12345678A (Juan García, #00142). ¿Es una reactivación?"
  - Campo `firstName` (TextInput, requerido)
  - Campo `lastName` (TextInput, requerido)
  - Campo `birthDate` (DateInput de Mantine, requerido):
    - Calcula y muestra la edad automáticamente: "(30 años)"
    - Fecha máxima: hoy
    - Formato de visualización: dd/MM/yyyy (ej. "08/03/2026"). NUNCA usar formato anglosajón.
  - Campo `email` (TextInput, type email, requerido)
  - Campo `phone` (TextInput, opcional, formato ES)
  - Campo `address` (TextInput, opcional)
  - Campo `postalCode` (TextInput, opcional, 5 dígitos)
  - Campo `city` (TextInput, opcional)
  - Validación completa del paso antes de permitir avanzar

### Paso 7: Paso 2 — Tipo de socio

Crear en `web/src/features/membership/registration/components/`:

- **`member-type-step.tsx`**: Selector de tipo de socio:
  - Lista de tipos de socio activos (obtenidos via `useMemberTypes()`)
  - Cada tipo se renderiza como Mantine Card (radio button visual):
    - Nombre del tipo (título)
    - Rango de edad (si definido): "Edad: 35+ años" o "Edad: 18-34 años"
    - Derechos: badges "Voto" (`color="green"`), "Elegible para cargos" (`color="blue"`), ambos con `variant="light"` y `radius="sm"` (defaults de marca)
    - Descripción del tipo
  - Al seleccionar un tipo, verificar compatibilidad de edad:
    - Si la edad del aspirante NO cumple el rango del tipo:
      - Alerta amarilla (color `yellow`): "El aspirante tiene 30 años, pero 'Adulto' requiere 35+ años"
      - Sugerencia: resaltar tipos compatibles con la edad del aspirante
      - Permitir continuar solo si se selecciona un tipo compatible
    - Si la edad SÍ cumple: indicador verde "Edad compatible"
  - Loading: skeleton de 3 tarjetas
  - Error: alerta con reintentar

### Paso 8: Paso 3 — Confirmación

Crear en `web/src/features/membership/registration/components/`:

- **`confirmation-step.tsx`**: Resumen y confirmación:
  - Tarjeta de resumen (Mantine Card) con los datos del aspirante:
    - Nombre completo
    - DNI
    - Fecha nacimiento y edad
    - Email
    - Tipo de socio seleccionado
    - Fecha de alta (hoy)
    - Formato de fechas: largo "8 de marzo de 2026", compacto "08/03/2026" (dd/MM/yyyy). NUNCA usar formato anglosajón.
  - Sección "Cargos a generar":
    - Checkbox (marcado por defecto, no editable): "Cuota de inscripción: 345,00 € (UNICA)"
    - Usar `formatMoney()` de `@/shared/utils/format-money.ts` para mostrar importes.
      Backend envía centavos como enteros: 34500 → "345,00 €"
    - Si no hay plan de inscripción (FE-4): alerta roja bloqueante "Debe configurar un plan de cuota de inscripción" con link a configuración
  - Sección "Al confirmar":
    - Texto informativo con iconos:
      - "Se creará el socio en estado Activo"
      - "Se generará cargo de inscripción"
      - "Se asignará número de socio automáticamente"
  - Botón "Confirmar Alta" (`color="brand"`) con loading state y doble-click prevention. Nunca usar `variant="gradient"`.
  - Al confirmar exitoso:
    - Modal de éxito con datos del socio creado:
      - Número de socio asignado (#00343)
      - Cargo de inscripción generado (pendiente). Usar `formatMoney()` para mostrar importe.
    - Botones: "Dar de alta otro socio" (resetea wizard, `color="brand"`) / "Ver ficha del socio" (navega a detalle, `color="brand"`)

### Paso 9: Integración con AppShell y rutas

Actualizar `web/src/shared/components/layout/app-shell.tsx`:

- Añadir entrada en el sidebar bajo la sección "Socios":
  - Link "Nuevo Socio" condicionado por permiso `membership:members:create`
  - Icono: `IconUserPlus` de `@tabler/icons-react`
  - Ruta: `/members/new`

Actualizar `web/src/app/router.tsx`:

- Añadir ruta protegida:
  ```typescript
  {
    path: 'members/new',
    element: <ProtectedRoute permissions={['membership:members:create']} />,
    children: [
      { index: true, element: <SimpleRegistrationPage /> },
    ],
  }
  ```

### Paso 10: Integración con ErrorReporter

- Errores 5xx en API de alta → `ErrorReporter.captureException()` con contexto completo del paso del wizard
- `ZodError` en parseo de respuesta de alta → reporte con detalle de campos fallidos
- Errores de negocio (409 DNI duplicado, 422 validación, 412 sin ejercicio abierto) → notificaciones en UI, sin reporte al ErrorReporter

### Paso 11: Tests

**Tests unitarios (componentes):**

- `SimpleRegistrationPage`:
  - Renderiza stepper con 3 pasos
  - Muestra alerta si no hay ejercicio abierto
  - Muestra alerta si no hay tipos de socio
  - Permite navegar entre pasos con datos válidos
  - No permite avanzar al paso 2 si paso 1 tiene errores
- `PersonalDataStep`:
  - Renderiza todos los campos del formulario
  - Valida formato de DNI (algoritmo mod 23)
  - Muestra indicador de DNI duplicado (mock useCheckDni)
  - Muestra edad calculada al introducir fecha de nacimiento
  - No permite avanzar con campos obligatorios vacíos
- `MemberTypeStep`:
  - Renderiza tarjetas de tipos de socio (mock useMemberTypes)
  - Muestra alerta de edad incompatible al seleccionar tipo inadecuado
  - Resalta tipos compatibles con la edad del aspirante
  - Muestra derechos (voto, elegibilidad) como badges
- `ConfirmationStep`:
  - Renderiza resumen con todos los datos del aspirante
  - Muestra cargo de inscripción
  - Muestra alerta si no hay plan de inscripción
  - Botón "Confirmar Alta" se deshabilita durante submit
  - Muestra modal de éxito con número de socio asignado

**Tests unitarios (utils):**

- `validateDni()`:
  - DNI válido "12345678Z" → `{ valid: true }`
  - DNI con letra incorrecta "12345678A" → `{ valid: false, error: "..." }`
  - DNI vacío → `{ valid: false }`
  - NIE válido "X1234567L" → `{ valid: true }`
  - NIE con prefijo inválido "A1234567L" → `{ valid: false }`
- `calculateAge()`:
  - Fecha 30 años atrás → 30
  - Fecha hoy → 0
  - Fecha futura → error

**Tests unitarios (hooks):**

- `useMemberTypes()`:
  - Retorna tipos de socio activos
  - Cachea resultados (staleTime 5 min)
- `useCheckDni()`:
  - Retorna `{ exists: false }` para DNI nuevo
  - Retorna `{ exists: true, memberName, memberNumber }` para DNI existente
  - Espera debounce de 500ms antes de consultar
- `useSimpleRegistration()`:
  - Invalida queries de members en `onSuccess`
  - Muestra notificación de éxito con número de socio
  - Maneja error 409 (DNI duplicado) con notificación específica

**Tests E2E (Playwright):**

- Flujo completo: llenar datos personales → seleccionar tipo de socio → confirmar alta → verificar socio creado con número asignado
- Validación de DNI: introducir DNI existente → verificar alerta de duplicado → corregir → completar alta
- Validación de edad: seleccionar tipo incompatible → verificar alerta → seleccionar tipo correcto → completar

## Criterios de aceptación

Derivados de US-028:

1. **Alta simple en 3 pasos (US-028, escenario 1):** El secretario puede registrar un nuevo socio en 3 pasos: datos personales, selección de tipo de socio, y confirmación con cargo de inscripción. Al completar, el socio queda en estado "Activo" con número de socio asignado.

2. **Validación de DNI/NIE:** El sistema valida el formato del DNI español (algoritmo mod 23) y NIE en tiempo real. Si el DNI ya existe en el tenant, muestra error con datos del socio existente y sugiere proceso de rehabilitación.

3. **Validación de edad contra tipo de socio:** Al seleccionar un tipo de socio, el sistema verifica que la edad del aspirante cumple los requisitos. Si no cumple, muestra alerta descriptiva y sugiere tipos compatibles.

4. **Cargo de inscripción generado:** Al confirmar el alta, se genera un cargo de inscripción (plan UNICA) en estado pendiente de pago. La suscripción de inscripción se cierra automáticamente.

5. **Precondición de ejercicio abierto (FE-5):** Si no hay ejercicio activo abierto, el sistema bloquea el alta con mensaje claro y enlace a la gestión de ejercicios.

6. **Precondición de plan de inscripción (FE-4):** Si no hay plan de cuota tipo UNICA configurado, el sistema bloquea el alta con mensaje claro y enlace a la configuración de planes.

7. **Número de socio asignado:** Al completar el alta, el sistema muestra el número de socio asignado automáticamente en la pantalla de confirmación.

8. **Prevención de doble alta:** El botón "Confirmar Alta" se deshabilita durante el submit para prevenir duplicados. Si el DNI ya existe, la API rechaza con 409.
