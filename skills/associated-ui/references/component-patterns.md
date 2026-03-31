# Patrones de Componentes — Associated

Guía de patrones recurrentes para interfaces consistentes. Lee este archivo al construir tablas, modales, dashboards, navegación, estados vacíos o cualquier patrón complejo.

---

## 1. Tablas de datos

Componente más frecuente en Associated (socios, cuotas, cargos, cobros, eventos). Patrón obligatorio:

### 1.1 Estructura base

```typescript
import { Table, TextInput, Group, Pagination, Skeleton, Stack, Text } from '@mantine/core';
import { useDebouncedValue, useMediaQuery } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';

export function DataTable() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 48em)');

  const page = Number(searchParams.get('page') || '1');
  const search = searchParams.get('q') || '';
  const [debouncedSearch] = useDebouncedValue(search, 300);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['members', { page, search: debouncedSearch }],
    queryFn: () => fetchMembers({ page, search: debouncedSearch }),
  });

  if (isLoading) return <DataTableSkeleton rows={10} cols={5} />;
  if (error) return <ErrorState message={t('members.loadError')} onRetry={refetch} />;
  if (!data?.items.length) return <EmptyState entity="members" />;

  // En móvil: cards apiladas
  if (isMobile) return <MobileCardList items={data.items} />;

  return (
    <Stack>
      <Group>
        <TextInput
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearchParams({ q: e.target.value, page: '1' })}
        />
      </Group>

      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th fz="xs" fw={600} c="dimmed" tt="uppercase">
              {t('members.name')}
            </Table.Th>
            {/* Importes alineados a la derecha */}
            <Table.Th fz="xs" fw={600} c="dimmed" tt="uppercase" style={{ textAlign: 'right' }}>
              {t('members.balance')}
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.items.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>{item.name}</Table.Td>
              <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(item.balanceCents)}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {t('common.showing', { from: data.from, to: data.to, total: data.total })}
        </Text>
        <Pagination
          total={data.totalPages}
          value={page}
          onChange={(p) => setSearchParams((prev) => ({ ...Object.fromEntries(prev), page: String(p) }))}
        />
      </Group>
    </Stack>
  );
}
```

### 1.2 Skeleton de tabla

```typescript
export function DataTableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          {Array.from({ length: cols }).map((_, i) => (
            <Table.Th key={i}><Skeleton height={14} width={`${60 + Math.random() * 40}%`} /></Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <Table.Tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <Table.Td key={c}><Skeleton height={14} width={`${50 + Math.random() * 50}%`} /></Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
```

---

## 2. Estados vacíos

Sin ilustraciones decorativas — texto directo que explica qué irá aquí y cómo empezar. Coherente con el valor de funcionalidad de la marca.

```typescript
import { Stack, Text, Button, ThemeIcon } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function EmptyState({ entity, onCreate }: { entity: string; onCreate?: () => void }) {
  const { t } = useTranslation();

  return (
    <Stack align="center" justify="center" py="xl" gap="md">
      <ThemeIcon size={64} radius="xl" variant="light" color="gray">
        {/* Icono apropiado para la entidad — siempre outline, 32px */}
      </ThemeIcon>
      <Text size="lg" fw={500}>{t(`${entity}.empty.title`)}</Text>
      <Text size="sm" c="dimmed" ta="center" maw={400}>
        {t(`${entity}.empty.description`)}
      </Text>
      {onCreate && (
        <Button onClick={onCreate}>{t(`${entity}.empty.action`)}</Button>
      )}
    </Stack>
  );
}
```

---

## 3. Estados de error

```typescript
import { Alert, Button, Group } from '@mantine/core';
import { AlertCircle } from 'lucide-react'; // o IconAlertCircle de @tabler/icons-react
import { useTranslation } from 'react-i18next';

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();

  return (
    <Alert icon={<AlertCircle size={16} />} title={t('common.errorOccurred')} color="red" variant="light">
      {message}
      {onRetry && (
        <Group mt="sm">
          <Button size="xs" variant="outline" color="red" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        </Group>
      )}
    </Alert>
  );
}
```

---

## 4. Notificaciones

Usa `@mantine/notifications`. Tono funcional, sin exclamaciones, sin emojis.

```typescript
import { notifications } from '@mantine/notifications';

// Acción completada
notifications.show({
  title: t('common.success'),
  message: t('treasury.remittanceGenerated', { count: 47 }),
  color: 'teal',
  autoClose: 3000,
});

// Operación en curso → resultado
const id = notifications.show({
  loading: true,
  title: t('common.processing'),
  message: t('treasury.generatingRemittance'),
  autoClose: false,
  withCloseButton: false,
});

notifications.update({
  id,
  loading: false,
  title: t('common.success'),
  message: t('treasury.remittanceGenerated', { count: 47 }),
  color: 'teal',
  autoClose: 3000,
});

// Error
notifications.show({
  title: t('common.errorOccurred'),
  message: t('treasury.remittanceError', { excluded: 3, reason: t('errors.invalidIban') }),
  color: 'red',
  autoClose: false,
});
```

---

## 5. Modales y confirmaciones

### 5.1 Confirmación destructiva

```typescript
import { Modal, Button, Group, Text } from '@mantine/core';

export function ConfirmDeleteModal({ opened, onClose, onConfirm, entityName, loading }: Props) {
  const { t } = useTranslation();

  return (
    <Modal opened={opened} onClose={onClose} title={t('common.confirmDelete')} centered>
      <Text size="sm">{t('common.confirmDeleteMessage', { entity: entityName })}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>{t('common.cancel')}</Button>
        <Button color="red" onClick={onConfirm} loading={loading}>{t('common.delete')}</Button>
      </Group>
    </Modal>
  );
}
```

### 5.2 Regla de complejidad

- Formularios simples (3-5 campos): `Modal` centrado.
- Formularios complejos (6+ campos o con tabs): `Drawer` desde la derecha, anchura `lg`.

---

## 6. Badges de estado

```typescript
const statusColors: Record<string, string> = {
  ACTIVE: 'green',    PAID: 'green',     COLLECTED: 'green',
  PENDING: 'yellow',  PROCESSING: 'yellow',
  SUSPENDED: 'red',   RETURNED: 'red',   EXPELLED: 'red',    OVERDUE: 'red',
  INACTIVE: 'gray',   VOLUNTARILY_LEFT: 'gray',  FINISHED: 'gray',
  OPEN: 'blue',       SENT: 'blue',      INFO: 'blue',
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  return (
    <Badge color={statusColors[status] || 'gray'} variant="light">
      {t(`status.${status.toLowerCase()}`)}
    </Badge>
  );
}
```

---

## 7. Navegación sidebar

Organizada por bounded context:

```
📊 Dashboard
── Socios
   ├── Listado
   ├── Tipos de socio
   └── Lista de espera
── Tesorería
   ├── Cuotas
   ├── Cobros
   └── Remesas SEPA
── Eventos
   ├── Calendario
   └── Inscripciones
── Comunicación
── Documentos
── Configuración
```

**Active state:** fondo `--mantine-color-brand-light`, texto `--mantine-color-brand-filled`. Iconos consistentes, misma librería, tamaño 20px. Secciones colapsables con transición suave. Headers de sección ocultos en modo colapsado (reemplazados por `Divider`).

---

## 8. Dashboard — KPI widgets

Cada widget independiente: fetch propio, skeleton propio, error propio. Errores aislados — si un widget falla, los demás renderizan.

```typescript
export function KpiCard({ title, queryKey, queryFn, format }: Props) {
  const { data, isLoading, error } = useQuery({ queryKey, queryFn });

  if (isLoading) return <KpiCardSkeleton />;
  if (error) return <KpiCardError />;

  return (
    <Card withBorder>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{title}</Text>
      <Text size="xl" fw={600} mt="xs">{format(data.value)}</Text>
      {data.trend !== undefined && (
        <Text size="sm" c={data.trend > 0 ? 'teal' : 'red'}>
          {data.trend > 0 ? '+' : ''}{data.trend}%
        </Text>
      )}
    </Card>
  );
}
```

### Caché por volatilidad

| Dato           | staleTime | gcTime   | Invalidación |
| -------------- | --------- | -------- | ------------ |
| KPIs dashboard | 5 min     | 30 min   | Mutation     |
| Listado socios | 5 min     | 30 min   | Mutation     |
| Detalle socio  | 10 min    | 60 min   | Mutation     |
| Tipos de cuota | 1 hora    | 24 horas | Manual       |
| Config tenant  | 1 hora    | 24 horas | Manual       |

---

## 9. Búsqueda global

Accesible con `Ctrl+K` / `Cmd+K` usando `Spotlight` de Mantine. Acciones por entidad: buscar socios, cuotas, eventos, documentos.

---

## 10. Prefetch y lazy loading

```typescript
// Prefetch en hover
<Table.Tr onMouseEnter={() => queryClient.prefetchQuery({
  queryKey: ['member', member.id],
  queryFn: () => fetchMember(member.id),
})}>

// Lazy loading de rutas
const MembersPage = lazy(() => import('@/features/membership/pages/MembersPage'));

<Route path="/members" element={
  <Suspense fallback={<PageSkeleton />}>
    <MembersPage />
  </Suspense>
} />
```

`PageSkeleton` muestra sidebar + skeleton del contenido para evitar layout shift.

---

## 11. Formateo de datos

```typescript
// Importes (backend envía centavos)
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
// 34500 → "345,00 €"

// Números
new Intl.NumberFormat('es-ES').format(1247); // "1.247"

// Fechas
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
format(date, 'dd/MM/yyyy'); // "08/03/2026"
format(date, "d 'de' MMMM 'de' yyyy", { locale: es }); // "8 de marzo de 2026"
```
