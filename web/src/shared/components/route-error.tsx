import { useRouteError, useNavigate } from 'react-router';
import { Button, Container, Stack, Text, Title } from '@mantine/core';

/**
 * Componente de error para rutas de React Router.
 * Muestra una pagina amigable cuando un componente de ruta crashea,
 * en vez del stack trace crudo del framework.
 */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message = error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.';

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg" mih="50vh" justify="center">
        <Title order={2}>Algo salio mal</Title>
        <Text c="dimmed" ta="center">
          {message}
        </Text>
        <Button color="brand" onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </Stack>
    </Container>
  );
}
