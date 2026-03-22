import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Center,
  PasswordInput,
  Stack,
  TextInput,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@/shared/api/api-error';
import logoStacked from '@/shared/assets/logo-stacked.svg';
import logoStackedWhite from '@/shared/assets/logo-stacked-white.svg';
import { useAuth } from '../context/use-auth';
import type { LoginRequest, TenantSelectorResponse } from '../schemas/auth.schemas';
import { isTenantSelectorResponse, loginRequestSchema } from '../schemas/auth.schemas';
import { TenantSelector } from '../components/tenant-selector';

/**
 * Página de inicio de sesión.
 *
 * Flujo:
 * 1. Usuario ingresa credenciales y envía el formulario.
 * 2. Si la respuesta es login directo (un solo tenant) → redirige a /dashboard.
 * 3. Si la respuesta requiere selección de tenant → muestra TenantSelector.
 */
export function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const colorScheme = useComputedColorScheme('light');
  const currentLogo = colorScheme === 'dark' ? logoStackedWhite : logoStacked;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantSelectionData, setTenantSelectionData] = useState<TenantSelectorResponse | null>(
    null,
  );

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /** Maneja el envío del formulario de login. */
  async function handleSubmit(values: LoginRequest) {
    setIsSubmitting(true);

    try {
      const response = await auth.login(values);

      if (isTenantSelectorResponse(response)) {
        // Multi-tenant: mostrar selector de colectividad
        setTenantSelectionData(response);
      } else {
        // Login directo: redirigir al dashboard
        navigate('/dashboard');
      }
    } catch (error: unknown) {
      handleLoginError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  /** Clasifica el error y muestra la notificación correspondiente. */
  function handleLoginError(error: unknown) {
    // Extraer status code si es un error de Axios
    const status = extractHttpStatus(error);

    if (status === 401) {
      notifications.show({
        color: 'red',
        title: 'Error',
        message: 'Credenciales incorrectas',
      });
      return;
    }

    if (status === 423) {
      notifications.show({
        color: 'yellow',
        title: 'Cuenta bloqueada',
        message: 'Cuenta bloqueada temporalmente. Reintente en unos minutos',
      });
      return;
    }

    // Error de red u otro error genérico
    notifications.show({
      color: 'red',
      title: 'Error de conexión',
      message: 'Verifique su conexión a internet',
    });
  }

  /** Callback para cuando el usuario selecciona un tenant. */
  async function handleTenantSelect(tenantId: string): Promise<void> {
    await auth.selectTenant(tenantId);
    navigate('/dashboard');
  }

  // --- Selección de tenant: ocultar formulario, mostrar selector ---

  if (tenantSelectionData) {
    return (
      <Center mih="100vh">
        <Box w="100%" maw={400}>
          <Stack align="center" gap="lg">
            <img src={currentLogo} alt="Associated" width={140} />
            <TenantSelector tenants={tenantSelectionData.tenants} onSelect={handleTenantSelect} />
          </Stack>
        </Box>
      </Center>
    );
  }

  // --- Formulario de login ---

  return (
    <Center mih="100vh">
      <Box w="100%" maw={400}>
        <form noValidate onSubmit={rhfHandleSubmit(handleSubmit)}>
          <Stack align="center" gap="lg">
            <img src={currentLogo} alt="Associated" width={140} />

            <Title order={3}>Iniciar sesión</Title>

            <Stack w="100%" gap="md">
              <TextInput
                type="email"
                label="Correo electrónico"
                placeholder="tu@email.com"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
              />

              <PasswordInput
                label="Contraseña"
                placeholder="Tu contraseña"
                autoComplete="current-password"
                {...register('password')}
                error={errors.password?.message}
              />

              <Button type="submit" color="brand" fullWidth loading={isSubmitting}>
                Acceder
              </Button>
            </Stack>
          </Stack>
        </form>
      </Box>
    </Center>
  );
}

// === Utilidades privadas ===

/**
 * Extrae el código HTTP de un error de la API.
 * Los interceptores de Axios transforman todo a ApiError,
 * por lo que verificamos esa clase primero.
 */
function extractHttpStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) {
    return error.status;
  }
  return undefined;
}
