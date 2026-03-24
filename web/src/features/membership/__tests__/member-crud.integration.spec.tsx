// Test de integracion del flujo de alta de socio (UC-011).
// Usa componentes reales (SimpleRegistrationPage), hooks reales,
// MSW para API y Notifications de Mantine.
// Unico mock: DateInput de @mantine/dates (causa bucles infinitos en jsdom por floating-ui).
// El resto usa componentes reales — testea comportamiento real del usuario.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { type ReactNode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications, notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '@/test/msw/server';
import { apiResponse } from '@/test/msw/utils';
import { buildMemberType, buildRegistrationResponse, resetMemberCounters } from '@/test/factories';
import { AuthContext, type AuthContextValue } from '@/features/auth/context/auth.provider';
import { SimpleRegistrationPage } from '../registration/pages/simple-registration.page';
import { associatedTheme } from '@/shared/theme/associated-theme';
import { DEFAULT_AUTH } from '@/test/test-wrapper';
import type {
  MemberType,
  RegistrationResponse,
} from '../registration/schemas/member-registration.schemas';

// === Mock de DateInput ===
// Mantine DateInput usa Popover + Calendar + floating-ui autoUpdate que causan
// bucles infinitos con ResizeObserver/MutationObserver en jsdom.
// Como este test verifica el flujo del wizard (no el componente DateInput),
// lo reemplazamos con un <input> simple que emula el contrato:
//   - value: string | null (RHF + Zod schema espera string "YYYY-MM-DD")
//   - onChange: recibe string "YYYY-MM-DD"
//   - placeholder: se propaga para que screen.getByPlaceholderText funcione
vi.mock('@mantine/dates', async () => {
  const actual = await vi.importActual('@mantine/dates');
  return {
    ...actual,
    DateInput: ({ value, onChange, onBlur, placeholder }: any) => {
      // value es string "YYYY-MM-DD" o null (segun el schema del form)
      const displayValue = (() => {
        if (!value) return '';
        // Si viene como "YYYY-MM-DD", convertir a "DD/MM/YYYY" para display
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [y, m, d] = value.split('-');
          return `${d}/${m}/${y}`;
        }
        // Si es Date (por si acaso), formatear
        if (value instanceof Date && !isNaN(value.getTime())) {
          return value.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
        }
        return String(value);
      })();

      return (
        <input
          type="text"
          placeholder={placeholder}
          value={displayValue}
          onChange={(e: any) => {
            const raw = e.target.value;
            // Parsear DD/MM/YYYY → "YYYY-MM-DD" (lo que Mantine 8 DateInput produce)
            const parts = raw.split('/');
            if (parts.length === 3 && parts[0].length && parts[1].length && parts[2].length) {
              const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              onChange?.(isoDate);
            } else {
              onChange?.(raw);
            }
          }}
          onBlur={onBlur}
          data-testid="mock-date-input"
        />
      );
    },
  };
});

// === Constantes ===

/** DNI valido con letra correcta (algoritmo mod 23). */
const VALID_DNI = '12345678Z';

/** Datos de precondiciones satisfechas por defecto. */
const DEFAULT_PRECONDITIONS = {
  hasFiscalYear: true,
  hasMemberTypes: true,
  hasRegistrationPlan: true,
  registrationPlan: {
    feePlanId: 'f47ac10b-58cc-4372-a567-000000000001',
    name: 'Cuota de Alta',
    amount: 5000,
  },
  errors: [],
};

// === Helpers ===

/**
 * Renderiza SimpleRegistrationPage dentro de un data router (createMemoryRouter).
 * useBlocker requiere data router — MemoryRouter no basta.
 * Envuelve con AuthContext, QueryClient, MantineProvider y Notifications.
 */
function renderWithDataRouter(auth?: Partial<AuthContextValue>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const authValue: AuthContextValue = { ...DEFAULT_AUTH, ...auth };

  const router = createMemoryRouter(
    [
      { path: '/members/new', element: <SimpleRegistrationPage /> },
      { path: '/members/:memberId', element: <div>Ficha del Socio</div> },
      { path: '/members', element: <div>Listado de Socios</div> },
    ],
    { initialEntries: ['/members/new'] },
  );

  function Providers({ children }: { children: ReactNode }) {
    return (
      <MantineProvider theme={associatedTheme} defaultColorScheme="light" env="test">
        <DatesProvider settings={{ locale: 'es' }}>
          <Notifications />
          <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
          </QueryClientProvider>
        </DatesProvider>
      </MantineProvider>
    );
  }

  return render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
}

/**
 * Renderiza SimpleRegistrationPage y espera a que el wizard cargue.
 * Los handlers MSW por defecto devuelven precondiciones satisfechas
 * y tipos de socio, asi que el wizard deberia renderizar el paso 1.
 */
async function renderRegistrationFlow(auth?: Partial<AuthContextValue>) {
  const user = userEvent.setup();

  renderWithDataRouter(auth);

  // Esperar a que precondiciones y tipos de socio carguen (skeleton desaparece)
  await waitFor(() => {
    expect(screen.getByText('Alta de Socio')).toBeInTheDocument();
  });

  // Esperar a que el formulario del paso 1 (Datos Personales) sea visible
  await waitFor(() => {
    expect(screen.getByPlaceholderText('12345678Z o X1234567L')).toBeInTheDocument();
  });

  return { user };
}

/**
 * Rellena el paso 1 (Datos Personales) con datos validos.
 * El DNI 12345678Z es valido segun el algoritmo mod 23.
 */
async function fillPersonalData(
  user: ReturnType<typeof userEvent.setup>,
  overrides: {
    dni?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  } = {},
) {
  const dni = overrides.dni ?? VALID_DNI;
  const firstName = overrides.firstName ?? 'Maria';
  const lastName = overrides.lastName ?? 'Garcia Lopez';
  const email = overrides.email ?? 'maria.garcia@ejemplo.com';

  // Rellenar DNI (placeholder: "12345678Z o X1234567L")
  const dniInput = screen.getByPlaceholderText('12345678Z o X1234567L');
  await user.clear(dniInput);
  await user.type(dniInput, dni);

  // Rellenar nombre (placeholder: "Nombre del aspirante")
  const nameInput = screen.getByPlaceholderText('Nombre del aspirante');
  await user.clear(nameInput);
  await user.type(nameInput, firstName);

  // Rellenar apellidos (placeholder: "Apellidos del aspirante")
  const lastNameInput = screen.getByPlaceholderText('Apellidos del aspirante');
  await user.clear(lastNameInput);
  await user.type(lastNameInput, lastName);

  // Rellenar fecha de nacimiento con fireEvent.change + blur.
  // NO usar user.type() aqui: escribe caracter a caracter y cada uno
  // dispara el parseo de Mantine DateInput + popover + floating-ui,
  // causando un bucle infinito en jsdom.
  const birthDateInput = screen.getByPlaceholderText('dd/mm/aaaa');
  fireEvent.change(birthDateInput, { target: { value: '15/06/1990' } });
  fireEvent.blur(birthDateInput);

  // Rellenar email (placeholder: "correo@ejemplo.com")
  const emailInput = screen.getByPlaceholderText('correo@ejemplo.com');
  await user.clear(emailInput);
  await user.type(emailInput, email);
}

/**
 * Avanza al siguiente paso haciendo click en "Siguiente".
 */
async function clickNext(user: ReturnType<typeof userEvent.setup>) {
  const nextButton = screen.getByRole('button', { name: /siguiente/i });
  await user.click(nextButton);
}

// === Setup ===

beforeEach(() => {
  resetMemberCounters();
  // Limpiar notificaciones residuales de tests anteriores.
  // Mantine Notifications usa un store global que no se limpia con cleanup() de RTL.
  notifications.clean();
});

// === Tests ===

describe('Flujo de Alta de Socio (Integracion)', () => {
  // -----------------------------------------------
  // 1. Precondiciones no cumplidas — wizard bloqueado
  // -----------------------------------------------
  describe('precondiciones no cumplidas', () => {
    it('debe mostrar alerta de bloqueo cuando no hay ejercicio fiscal abierto', async () => {
      // Arrange — precondiciones con errores
      server.use(
        http.get('*/v1/members/preconditions', () => {
          return HttpResponse.json(
            apiResponse({
              hasFiscalYear: false,
              hasMemberTypes: true,
              hasRegistrationPlan: true,
              registrationPlan: null,
              errors: ['No existe un ejercicio fiscal abierto'],
            }),
          );
        }),
      );

      renderWithDataRouter();

      // Assert — alerta de precondiciones no cumplidas
      await waitFor(() => {
        expect(screen.getByText('Precondiciones no cumplidas')).toBeInTheDocument();
      });
      expect(screen.getByText('No existe un ejercicio fiscal abierto')).toBeInTheDocument();

      // El boton "Volver al listado" esta presente
      expect(screen.getByRole('button', { name: /volver al listado/i })).toBeInTheDocument();

      // El formulario del wizard NO esta presente
      expect(screen.queryByPlaceholderText('12345678Z o X1234567L')).not.toBeInTheDocument();
    });

    it('debe navegar al listado al pulsar "Volver al listado"', async () => {
      // Arrange — precondiciones fallidas
      server.use(
        http.get('*/v1/members/preconditions', () => {
          return HttpResponse.json(
            apiResponse({
              hasFiscalYear: false,
              hasMemberTypes: false,
              hasRegistrationPlan: false,
              registrationPlan: null,
              errors: [
                'No existe un ejercicio fiscal abierto',
                'No hay tipos de socio configurados',
              ],
            }),
          );
        }),
      );

      const user = userEvent.setup();
      renderWithDataRouter();

      await waitFor(() => {
        expect(screen.getByText('Precondiciones no cumplidas')).toBeInTheDocument();
      });

      // Act — click en "Volver al listado"
      await user.click(screen.getByRole('button', { name: /volver al listado/i }));

      // Assert — navego al listado
      await waitFor(() => {
        expect(screen.getByText('Listado de Socios')).toBeInTheDocument();
      });
    });
  });

  // -----------------------------------------------
  // 2. Error al cargar precondiciones
  // -----------------------------------------------
  describe('error al cargar precondiciones', () => {
    it('debe mostrar alerta de error cuando la API de precondiciones falla', async () => {
      // Arrange — API devuelve error 500.
      // Nota: HttpResponse.error() causa que peticiones concurrentes queden
      // colgadas en Node.js con MSW 2.x + Axios. Usamos HTTP 500 en su lugar.
      server.use(
        http.get('*/v1/members/preconditions', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Server error', details: null } },
            { status: 500 },
          );
        }),
      );

      renderWithDataRouter();

      // Assert — alerta de error
      await waitFor(
        () => {
          expect(screen.getByText('Error al verificar precondiciones')).toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  });

  // -----------------------------------------------
  // 3. Paso 1: Datos Personales — validacion
  // -----------------------------------------------
  describe('paso 1: datos personales', () => {
    it('debe deshabilitar "Siguiente" hasta que los datos requeridos sean validos', async () => {
      // Arrange
      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(apiResponse(DEFAULT_PRECONDITIONS)),
        ),
      );

      const { user } = await renderRegistrationFlow();

      // Assert — boton "Siguiente" deshabilitado inicialmente
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      expect(nextButton).toBeDisabled();

      // Act — rellenar todos los datos validos
      await fillPersonalData(user);

      // Esperar a que la verificacion de unicidad de DNI responda (debounce + API)
      await waitFor(
        () => {
          const btn = screen.getByRole('button', { name: /siguiente/i });
          expect(btn).not.toBeDisabled();
        },
        { timeout: 3000 },
      );
    });
  });

  // -----------------------------------------------
  // 4. Flujo completo: alta exitosa
  // -----------------------------------------------
  describe('flujo completo de alta', () => {
    it('debe completar el wizard de 3 pasos y mostrar modal de exito', async () => {
      // Arrange — tipo de socio con rango de edad compatible (30 anios)
      const memberType: MemberType = buildMemberType({
        id: 'aaaaaaaa-0000-4000-8000-000000000001',
        name: 'Socio Numerario',
        ageRangeMin: 18,
        ageRangeMax: 65,
        votingRight: true,
        eligibleForOffice: true,
      });

      const registrationResult: RegistrationResponse = buildRegistrationResponse({
        memberNumber: 'SOC-0042',
        memberTypeName: 'Socio Numerario',
        registrationCharge: {
          chargeId: 'bbbbbbbb-0000-4000-8000-000000000001',
          amount: 5000,
          description: 'Cuota de Alta',
          status: 'PENDING',
        },
      });

      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(apiResponse(DEFAULT_PRECONDITIONS)),
        ),
        http.get('*/v1/member-types', () => HttpResponse.json(apiResponse([memberType]))),
        http.get('*/v1/members/check-dni/:docType/:dni', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.get('*/v1/members/check-email/:email', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.post('*/v1/members/simple-registration', () =>
          HttpResponse.json(apiResponse(registrationResult), { status: 201 }),
        ),
      );

      // Act — Paso 1: Datos Personales
      const { user } = await renderRegistrationFlow();
      await fillPersonalData(user);

      // Esperar a que el boton "Siguiente" se habilite
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
        },
        { timeout: 3000 },
      );

      await clickNext(user);

      // Act — Paso 2: Tipo de Socio
      // Esperar a que las tarjetas de tipo de socio sean visibles
      await waitFor(() => {
        expect(screen.getByText('Socio Numerario')).toBeInTheDocument();
      });

      // Seleccionar el tipo de socio haciendo click en la tarjeta
      await user.click(screen.getByText('Socio Numerario'));

      // Verificar que se muestra "Edad compatible" (30 anios, rango 18-65)
      await waitFor(() => {
        expect(screen.getByText('Edad compatible')).toBeInTheDocument();
      });

      // "Siguiente" debe estar habilitado
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
      });

      await clickNext(user);

      // Act — Paso 3: Confirmacion
      // Verificar que se muestran los datos del resumen
      await waitFor(() => {
        expect(screen.getByText('Datos del aspirante')).toBeInTheDocument();
      });

      // Verificar datos personales en el resumen
      expect(screen.getByText('Maria Garcia Lopez')).toBeInTheDocument();
      expect(screen.getByText(VALID_DNI)).toBeInTheDocument();
      expect(screen.getByText('maria.garcia@ejemplo.com')).toBeInTheDocument();

      // Verificar tipo de socio en resumen
      // "Socio Numerario" aparece tanto en el tipo seleccionado como en el resumen
      const socioNumerarioTexts = screen.getAllByText('Socio Numerario');
      expect(socioNumerarioTexts.length).toBeGreaterThanOrEqual(1);

      // Verificar que el boton "Confirmar Alta" esta presente
      const confirmButton = screen.getByRole('button', { name: /confirmar alta/i });
      expect(confirmButton).toBeInTheDocument();
      expect(confirmButton).not.toBeDisabled();

      // Act — Confirmar alta
      await user.click(confirmButton);

      // Assert — Modal de exito con numero de socio
      // "Socio dado de alta" aparece en la notificacion Y en el modal,
      // asi que verificamos con getAllByText y el contenido unico del modal.
      await waitFor(() => {
        const matches = screen.getAllByText('Socio dado de alta');
        expect(matches.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('#SOC-0042')).toBeInTheDocument();
      });

      // Verificar botones del modal de exito
      expect(screen.getByRole('button', { name: /dar de alta otro/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ver ficha/i })).toBeInTheDocument();
    });

    it('debe navegar a la ficha del socio al pulsar "Ver ficha" en el modal de exito', async () => {
      // Arrange
      const memberType: MemberType = buildMemberType({
        id: 'aaaaaaaa-0000-4000-8000-000000000002',
        name: 'Socio Juvenil',
        ageRangeMin: null,
        ageRangeMax: null,
        votingRight: false,
        eligibleForOffice: false,
      });

      const memberId = 'cccccccc-0000-4000-8000-000000000001';
      const registrationResult: RegistrationResponse = buildRegistrationResponse({
        memberId,
        memberNumber: 'SOC-0099',
        memberTypeName: 'Socio Juvenil',
      });

      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(apiResponse(DEFAULT_PRECONDITIONS)),
        ),
        http.get('*/v1/member-types', () => HttpResponse.json(apiResponse([memberType]))),
        http.get('*/v1/members/check-dni/:docType/:dni', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.get('*/v1/members/check-email/:email', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.post('*/v1/members/simple-registration', () =>
          HttpResponse.json(apiResponse(registrationResult), { status: 201 }),
        ),
      );

      // Act — completar wizard entero
      const { user } = await renderRegistrationFlow();
      await fillPersonalData(user, { firstName: 'Pedro', lastName: 'Martinez' });

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
        },
        { timeout: 3000 },
      );
      await clickNext(user);

      await waitFor(() => {
        expect(screen.getByText('Socio Juvenil')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Socio Juvenil'));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
      });
      await clickNext(user);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirmar alta/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /confirmar alta/i }));

      // Esperar modal de exito — usar contenido unico del modal (#SOC-0099)
      // en lugar de "Socio dado de alta" que tambien aparece en la notificacion
      await waitFor(() => {
        expect(screen.getByText('#SOC-0099')).toBeInTheDocument();
      });

      // Act — click "Ver ficha"
      await user.click(screen.getByRole('button', { name: /ver ficha/i }));

      // Assert — navego a la ficha del socio
      await waitFor(() => {
        expect(screen.getByText('Ficha del Socio')).toBeInTheDocument();
      });
    });

    it('debe resetear el wizard al pulsar "Dar de alta otro" en el modal de exito', async () => {
      // Arrange
      const memberType: MemberType = buildMemberType({
        id: 'aaaaaaaa-0000-4000-8000-000000000003',
        name: 'Socio Honorario',
        ageRangeMin: null,
        ageRangeMax: null,
        votingRight: true,
        eligibleForOffice: false,
      });

      const registrationResult: RegistrationResponse = buildRegistrationResponse({
        memberNumber: 'SOC-0100',
        memberTypeName: 'Socio Honorario',
      });

      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(apiResponse(DEFAULT_PRECONDITIONS)),
        ),
        http.get('*/v1/member-types', () => HttpResponse.json(apiResponse([memberType]))),
        http.get('*/v1/members/check-dni/:docType/:dni', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.get('*/v1/members/check-email/:email', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.post('*/v1/members/simple-registration', () =>
          HttpResponse.json(apiResponse(registrationResult), { status: 201 }),
        ),
      );

      // Act — completar wizard
      const { user } = await renderRegistrationFlow();
      await fillPersonalData(user);

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
        },
        { timeout: 3000 },
      );
      await clickNext(user);

      await waitFor(() => {
        expect(screen.getByText('Socio Honorario')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Socio Honorario'));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
      });
      await clickNext(user);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirmar alta/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /confirmar alta/i }));

      // Esperar modal de exito — usar contenido unico del modal (#SOC-0100)
      await waitFor(() => {
        expect(screen.getByText('#SOC-0100')).toBeInTheDocument();
      });

      // Act — click "Dar de alta otro"
      await user.click(screen.getByRole('button', { name: /dar de alta otro/i }));

      // Assert — wizard reiniciado en paso 1 con campos vacios
      await waitFor(() => {
        const dniInput = screen.getByPlaceholderText('12345678Z o X1234567L') as HTMLInputElement;
        expect(dniInput.value).toBe('');
      });

      // El modal de exito ya no esta visible
      expect(screen.queryByText('#SOC-0100')).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------
  // 5. Error en el registro (409 — DNI duplicado)
  // -----------------------------------------------
  describe('error en el registro', () => {
    it('debe mostrar notificacion de error cuando la API devuelve 409 (DNI duplicado)', async () => {
      // Arrange
      const memberType: MemberType = buildMemberType({
        id: 'aaaaaaaa-0000-4000-8000-000000000004',
        name: 'Socio Activo',
        ageRangeMin: null,
        ageRangeMax: null,
        votingRight: true,
        eligibleForOffice: false,
      });

      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(apiResponse(DEFAULT_PRECONDITIONS)),
        ),
        http.get('*/v1/member-types', () => HttpResponse.json(apiResponse([memberType]))),
        http.get('*/v1/members/check-dni/:docType/:dni', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.get('*/v1/members/check-email/:email', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.post('*/v1/members/simple-registration', () =>
          HttpResponse.json(
            {
              error: {
                code: 'MEMBER_ALREADY_EXISTS',
                message: 'Ya existe un socio con ese DNI',
                details: null,
              },
            },
            { status: 409 },
          ),
        ),
      );

      // Act — completar wizard hasta confirmar
      const { user } = await renderRegistrationFlow();
      await fillPersonalData(user);

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
        },
        { timeout: 3000 },
      );
      await clickNext(user);

      await waitFor(() => {
        expect(screen.getByText('Socio Activo')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Socio Activo'));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
      });
      await clickNext(user);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /confirmar alta/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /confirmar alta/i }));

      // Assert — notificacion de DNI duplicado (Mantine Notifications)
      await waitFor(() => {
        expect(screen.getByText('DNI duplicado')).toBeInTheDocument();
      });

      // El modal de exito NO aparece — verificar que no hay numero de socio visible
      // (no usar "Socio dado de alta" porque puede haber notificaciones residuales)
      expect(screen.queryByRole('button', { name: /ver ficha/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /dar de alta otro/i })).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------
  // 6. Tipo de socio incompatible por edad
  // -----------------------------------------------
  describe('validacion de edad en paso 2', () => {
    it('debe mostrar alerta de edad incompatible cuando el aspirante no cumple el rango', async () => {
      // Arrange — tipo con rango 0-17 (juvenil), aspirante tiene ~35 anios (nacio 1990)
      const juvenilType: MemberType = buildMemberType({
        id: 'aaaaaaaa-0000-4000-8000-000000000005',
        name: 'Socio Juvenil',
        ageRangeMin: 0,
        ageRangeMax: 17,
        votingRight: false,
        eligibleForOffice: false,
      });
      const adultoType: MemberType = buildMemberType({
        id: 'aaaaaaaa-0000-4000-8000-000000000006',
        name: 'Socio Adulto',
        ageRangeMin: 18,
        ageRangeMax: 99,
        votingRight: true,
        eligibleForOffice: true,
      });

      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(apiResponse(DEFAULT_PRECONDITIONS)),
        ),
        http.get('*/v1/member-types', () =>
          HttpResponse.json(apiResponse([juvenilType, adultoType])),
        ),
        http.get('*/v1/members/check-dni/:docType/:dni', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.get('*/v1/members/check-email/:email', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
      );

      // Act — paso 1
      const { user } = await renderRegistrationFlow();
      await fillPersonalData(user);

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
        },
        { timeout: 3000 },
      );
      await clickNext(user);

      // Esperar paso 2
      await waitFor(() => {
        expect(screen.getByText('Socio Juvenil')).toBeInTheDocument();
      });

      // Act — seleccionar tipo incompatible (juvenil, 0-17 anios)
      await user.click(screen.getByText('Socio Juvenil'));

      // Assert — alerta de edad incompatible
      await waitFor(() => {
        expect(screen.getByText('Edad incompatible')).toBeInTheDocument();
      });

      // "Siguiente" debe estar deshabilitado porque la edad no es compatible
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      expect(nextButton).toBeDisabled();

      // Act — seleccionar tipo compatible (adulto, 18-99 anios)
      await user.click(screen.getByText('Socio Adulto'));

      // Assert — edad compatible, boton habilitado
      await waitFor(() => {
        expect(screen.getByText('Edad compatible')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
    });
  });

  // -----------------------------------------------
  // 7. DNI duplicado detectado en paso 1
  // -----------------------------------------------
  describe('verificacion de unicidad de DNI en paso 1', () => {
    it('debe mostrar alerta y deshabilitar "Siguiente" cuando el DNI ya existe', async () => {
      // Arrange — check-dni devuelve que SI existe
      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(apiResponse(DEFAULT_PRECONDITIONS)),
        ),
        http.get('*/v1/member-types', () => HttpResponse.json(apiResponse([buildMemberType()]))),
        http.get('*/v1/members/check-dni/:docType/:dni', () =>
          HttpResponse.json(
            apiResponse({
              exists: true,
              memberName: 'Juan Perez',
              memberNumber: 'SOC-0001',
            }),
          ),
        ),
        http.get('*/v1/members/check-email/:email', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
      );

      // Act
      const { user } = await renderRegistrationFlow();
      await fillPersonalData(user);

      // Assert — alerta de DNI duplicado
      await waitFor(
        () => {
          expect(screen.getByText(/DNI duplicado/i)).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // El nombre y numero del socio existente se muestran
      expect(screen.getByText(/Juan Perez/)).toBeInTheDocument();
      expect(screen.getByText(/SOC-0001/)).toBeInTheDocument();

      // "Siguiente" permanece deshabilitado
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      expect(nextButton).toBeDisabled();
    });
  });

  // -----------------------------------------------
  // 8. Navegacion entre pasos
  // -----------------------------------------------
  describe('navegacion entre pasos', () => {
    it('debe deshabilitar "Anterior" en el paso 1', async () => {
      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(apiResponse(DEFAULT_PRECONDITIONS)),
        ),
      );

      await renderRegistrationFlow();

      const prevButton = screen.getByRole('button', { name: /anterior/i });
      expect(prevButton).toBeDisabled();
    });

    it('debe permitir volver al paso anterior con datos preservados', async () => {
      // Arrange
      const memberType: MemberType = buildMemberType({
        id: 'aaaaaaaa-0000-4000-8000-000000000007',
        name: 'Socio Pleno',
        ageRangeMin: null,
        ageRangeMax: null,
        votingRight: true,
        eligibleForOffice: true,
      });

      server.use(
        http.get('*/v1/members/preconditions', () =>
          HttpResponse.json(apiResponse(DEFAULT_PRECONDITIONS)),
        ),
        http.get('*/v1/member-types', () => HttpResponse.json(apiResponse([memberType]))),
        http.get('*/v1/members/check-dni/:docType/:dni', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
        http.get('*/v1/members/check-email/:email', () =>
          HttpResponse.json(apiResponse({ exists: false })),
        ),
      );

      // Act — paso 1: rellenar datos
      const { user } = await renderRegistrationFlow();
      await fillPersonalData(user);

      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
        },
        { timeout: 3000 },
      );
      await clickNext(user);

      // Paso 2: seleccionar tipo
      await waitFor(() => {
        expect(screen.getByText('Socio Pleno')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Socio Pleno'));

      // Act — volver al paso 1
      const prevButton = screen.getByRole('button', { name: /anterior/i });
      await user.click(prevButton);

      // Assert — los datos del paso 1 se preservan
      await waitFor(() => {
        const dniInput = screen.getByPlaceholderText('12345678Z o X1234567L') as HTMLInputElement;
        expect(dniInput.value).toBe(VALID_DNI);
      });

      const nameInput = screen.getByPlaceholderText('Nombre del aspirante') as HTMLInputElement;
      expect(nameInput.value).toBe('Maria');
    });
  });
});
