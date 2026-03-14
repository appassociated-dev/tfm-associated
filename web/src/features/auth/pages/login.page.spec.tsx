import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { LoginPage } from './login.page';

// === Mocks ===

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const mockLogin = vi.fn();
vi.mock('../context/use-auth', () => ({
  useAuth: () => ({
    login: mockLogin,
    selectTenant: vi.fn(),
  }),
}));

// Mock de @mantine/notifications para evitar errores de portal
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

// Mock del logo SVG para evitar errores de importacion
vi.mock('@/shared/assets/logo-stacked.svg', () => ({
  default: 'logo-stacked.svg',
}));

// === Helpers ===

function TestWrapper({ children }: { children: React.ReactNode }) {
  return createElement(MantineProvider, null, children);
}

function renderLoginPage() {
  return render(createElement(LoginPage), { wrapper: TestWrapper });
}

/** Simula input nativo que dispara onChange del componente controlado. */
function setNativeInputValue(input: HTMLElement, value: string) {
  // Mantine useForm escucha onChange — fireEvent.input + change lo activa
  fireEvent.input(input, { target: { value } });
  fireEvent.change(input, { target: { value } });
}

// === Tests ===

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia renderizar formulario con campos de email y contrasena', () => {
    renderLoginPage();

    expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu contraseña')).toBeInTheDocument();
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.getByText('Acceder')).toBeInTheDocument();
  });

  it('deberia mostrar error de validacion para email invalido al enviar', async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('tu@email.com');
    const passwordInput = screen.getByPlaceholderText('Tu contraseña');

    setNativeInputValue(emailInput, 'no-es-email');
    setNativeInputValue(passwordInput, 'password123');

    // Enviar el formulario directamente
    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Ingrese un correo electrónico válido')).toBeInTheDocument();
    });
  });

  it('deberia mostrar error de validacion para contrasena vacia al enviar', async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('tu@email.com');

    setNativeInputValue(emailInput, 'test@club.es');
    // No tocamos la contrasena — queda vacia

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
    });
  });

  it('deberia llamar a login y navegar a /dashboard en login directo', async () => {
    // Simular respuesta de login directo (un solo tenant)
    mockLogin.mockResolvedValue({
      tokens: { accessToken: 'at', refreshToken: 'rt', expiresIn: 3600 },
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@club.es',
        name: 'Test',
      },
      tenant: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Club',
        slug: 'club',
      },
      role: 'admin',
    });

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('tu@email.com');
    const passwordInput = screen.getByPlaceholderText('Tu contraseña');

    setNativeInputValue(emailInput, 'test@club.es');
    setNativeInputValue(passwordInput, 'password123');

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@club.es',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('deberia mostrar TenantSelector cuando la respuesta requiere seleccion', async () => {
    // Simular respuesta multi-tenant
    mockLogin.mockResolvedValue({
      requiresTenantSelection: true,
      tenants: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Club A',
          slug: 'club-a',
          role: 'admin',
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          name: 'Club B',
          slug: 'club-b',
          role: 'member',
        },
      ],
    });

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText('tu@email.com');
    const passwordInput = screen.getByPlaceholderText('Tu contraseña');

    setNativeInputValue(emailInput, 'test@club.es');
    setNativeInputValue(passwordInput, 'password123');

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Selecciona una colectividad')).toBeInTheDocument();
      expect(screen.getByText('Club A')).toBeInTheDocument();
      expect(screen.getByText('Club B')).toBeInTheDocument();
    });
  });
});
