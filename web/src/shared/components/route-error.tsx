import { useRouteError, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button, Container, Stack, Text, Title } from '@mantine/core';

/**
 * Componente de error para rutas de React Router.
 * Muestra una pagina amigable cuando un componente de ruta crashea,
 * en vez del stack trace crudo del framework.
 */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();
  const navigate = useNavigate();

  const message = error instanceof Error ? error.message : t('errors.unexpected');

  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="lg" mih="50vh" justify="center">
        <Title order={2}>{t('errors.somethingWentWrong')}</Title>
        <Text c="dimmed" ta="center">
          {message}
        </Text>
        <Button color="brand" onClick={() => navigate('/dashboard')}>
          {t('errors.backToDashboard')}
        </Button>
      </Stack>
    </Container>
  );
}
