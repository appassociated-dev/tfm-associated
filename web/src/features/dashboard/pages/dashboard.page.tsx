import { Card, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/use-auth';

const CARD_KEYS = [
  'cards.activeMembers',
  'cards.pendingFees',
  'cards.monthlyIncome',
  'cards.upcomingEvents',
] as const;

export function DashboardPage() {
  const { tenant } = useAuth();
  const { t } = useTranslation('dashboard');

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t('title')}</Title>
        <Text c="dimmed" size="sm">
          {tenant?.name ?? t('collectivityFallback')}
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {CARD_KEYS.map((key) => (
          <Card key={key} withBorder shadow="sm" padding="lg">
            <Text c="dimmed" size="sm" fw={500}>
              {t(key)}
            </Text>
            <Title order={3} mt="xs">
              —
            </Title>
            <Text c="dimmed" size="xs" mt={4}>
              {t('comingSoon')}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
