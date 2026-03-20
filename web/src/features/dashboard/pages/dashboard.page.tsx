import { Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useAuth } from '@/features/auth/context/use-auth';

export function DashboardPage() {
  const { tenant } = useAuth();

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Dashboard</Title>
        <Text c="dimmed" size="sm">
          {tenant?.name ?? 'Colectividad'}
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {['Socios activos', 'Cuotas pendientes', 'Ingresos del mes', 'Eventos próximos'].map(
          (label) => (
            <Card key={label} withBorder shadow="sm" padding="lg">
              <Text c="dimmed" size="sm" fw={500}>
                {label}
              </Text>
              <Title order={3} mt="xs">
                —
              </Title>
              <Text c="dimmed" size="xs" mt={4}>
                Próximamente
              </Text>
            </Card>
          ),
        )}
      </SimpleGrid>
    </Stack>
  );
}
