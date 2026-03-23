import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Menu,
  Skeleton,
  Stack,
  Switch,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';

import { usePermissions } from '@/features/auth/context/use-permissions';
import { formatMoney } from '@/shared/utils/format-money';

import type { FeePlan } from '../schemas/fee-plan.schemas';
import { useFeePlans } from '../hooks/use-fee-plans';
import { useFeePlan } from '../hooks/use-fee-plan';
import { useActivateFeePlan } from '../hooks/use-activate-fee-plan';
import { FeePlanCreateModal } from '../components/fee-plan-create-modal';
import { FeePlanEditModal } from '../components/fee-plan-edit-modal';
import { DeactivateFeePlanModal } from '../components/deactivate-fee-plan-modal';
import { LinkMemberTypesModal } from '../components/link-member-types-modal';
import { ImportTemplateModal } from '../components/import-template-modal';

// === Constantes ===

/** Estilo reutilizable para cabeceras de tabla. */
const HEADER_STYLE = {
  textTransform: 'uppercase' as const,
  fontSize: 'var(--mantine-font-size-xs)',
  fontWeight: 600,
  color: 'var(--mantine-color-dimmed)',
};

// === Componente ===

/**
 * Página principal de listado de planes de cuota.
 * Muestra tabla con filtros, acciones CRUD y estados de carga/vacío/error.
 */
export function FeePlansListPage() {
  const { t } = useTranslation('treasury');
  const { hasPermission } = usePermissions();

  // Estado de filtros
  const [showInactive, setShowInactive] = useState(false);

  // Modales
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);
  const [deactivateOpened, { open: openDeactivate, close: closeDeactivate }] = useDisclosure(false);
  const [linkOpened, { open: openLink, close: closeLink }] = useDisclosure(false);
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);

  // Plan seleccionado para editar/vincular/desactivar
  const [selectedPlan, setSelectedPlan] = useState<FeePlan | null>(null);

  // Detalle del plan seleccionado (para obtener vinculaciones existentes)
  const { data: planDetail } = useFeePlan(selectedPlan?.id ?? '');

  // Mutación de activación
  const activateFeePlanMutation = useActivateFeePlan();

  // Datos: sin filtro (todos) cuando showInactive está activo, solo activos en caso contrario
  const {
    data: plans,
    isLoading,
    isError,
    refetch,
  } = useFeePlans(showInactive ? undefined : { active: true });

  const canCreate = hasPermission('treasury:fee-plans:create');
  const canEdit = hasPermission('treasury:fee-plans:update');
  const canDeactivate = hasPermission('treasury:fee-plans:deactivate');

  /** Abre el modal de edición con el plan seleccionado. */
  function handleEdit(plan: FeePlan): void {
    setSelectedPlan(plan);
    openEdit();
  }

  /** Abre el modal de vinculación con el plan seleccionado. */
  function handleLink(plan: FeePlan): void {
    setSelectedPlan(plan);
    openLink();
  }

  /** Abre el modal de inactivación con el plan seleccionado. */
  function handleDeactivate(plan: FeePlan): void {
    setSelectedPlan(plan);
    openDeactivate();
  }

  /** Devuelve la etiqueta de periodicidad según el tipo y frecuencia del plan. */
  function getFrequencyLabel(plan: FeePlan): string {
    if (plan.type === 'ONE_TIME') return '\u2014';
    switch (plan.frequency) {
      case 'MONTHLY':
        return t('frequency.monthly');
      case 'QUARTERLY':
        return t('frequency.quarterly');
      case 'BIANNUAL':
        return t('frequency.biannual');
      case 'ANNUAL':
        return t('frequency.annual');
      case 'CUSTOM':
        return t('frequency.custom');
      default:
        return plan.frequency ?? '\u2014';
    }
  }

  return (
    <>
      <Stack gap="lg">
        {/* Cabecera */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Title order={2}>{t('feePlans.title')}</Title>
            {plans && (
              <Badge variant="light" radius="sm">
                {plans.length}
              </Badge>
            )}
          </Group>

          <Group gap="sm">
            {/* Botón de importar plantilla: solo visible si no hay planes */}
            {canCreate && plans && plans.length === 0 && (
              <Button color="brand" variant="outline" onClick={openImport}>
                {t('feePlans.importTemplate')}
              </Button>
            )}

            {/* Botón de crear */}
            {canCreate && (
              <Button color="brand" onClick={openCreate}>
                {t('feePlans.newPlan')}
              </Button>
            )}
          </Group>
        </Group>

        {/* Filtros */}
        <Group>
          <Switch
            label={t('feePlans.showInactive')}
            checked={showInactive}
            onChange={(event) => setShowInactive(event.currentTarget.checked)}
          />
        </Group>

        {/* Estado de carga */}
        {isLoading && <LoadingSkeleton />}

        {/* Estado de error */}
        {isError && (
          <Alert color="red" title={t('feePlans.errorLoading.title')}>
            {t('feePlans.errorLoading.message')}
            <Button variant="subtle" color="red" size="xs" mt="xs" onClick={() => refetch()}>
              {t('feePlans.errorLoading.retry')}
            </Button>
          </Alert>
        )}

        {/* Estado vacío */}
        {plans && plans.length === 0 && !isLoading && (
          <Stack align="center" gap="md" py="xl">
            <Text c="dimmed">{t('feePlans.emptyState')}</Text>
            {canCreate && (
              <Button color="brand" onClick={openCreate}>
                {t('feePlans.createFirstPlan')}
              </Button>
            )}
          </Stack>
        )}

        {/* Tabla de planes */}
        {plans && plans.length > 0 && (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={HEADER_STYLE}>{t('feePlans.table.code')}</Table.Th>
                <Table.Th style={HEADER_STYLE}>{t('feePlans.table.name')}</Table.Th>
                <Table.Th style={HEADER_STYLE}>{t('feePlans.table.type')}</Table.Th>
                <Table.Th style={{ ...HEADER_STYLE, textAlign: 'right' }}>
                  {t('feePlans.table.amount')}
                </Table.Th>
                <Table.Th style={HEADER_STYLE}>{t('feePlans.table.frequency')}</Table.Th>
                <Table.Th style={HEADER_STYLE}>{t('feePlans.table.status')}</Table.Th>
                <Table.Th style={HEADER_STYLE}>{t('feePlans.table.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {plans.map((plan) => (
                <Table.Tr key={plan.id}>
                  {/* Código */}
                  <Table.Td>
                    <Badge variant="light" radius="sm" ff="monospace">
                      {plan.code}
                    </Badge>
                  </Table.Td>

                  {/* Nombre */}
                  <Table.Td>
                    <Text size="sm">{plan.name}</Text>
                  </Table.Td>

                  {/* Tipo */}
                  <Table.Td>
                    <Badge
                      variant="light"
                      radius="sm"
                      color={plan.type === 'RECURRING' ? 'green' : 'blue'}
                    >
                      {plan.type === 'RECURRING' ? t('planType.recurring') : t('planType.oneTime')}
                    </Badge>
                  </Table.Td>

                  {/* Importe */}
                  <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    <Text size="sm">{formatMoney(plan.amount)}</Text>
                  </Table.Td>

                  {/* Periodicidad */}
                  <Table.Td>
                    <Text size="sm">{getFrequencyLabel(plan)}</Text>
                  </Table.Td>

                  {/* Estado */}
                  <Table.Td>
                    <Badge variant="light" radius="sm" color={plan.active ? 'green' : 'gray'}>
                      {plan.active ? t('feePlans.status.active') : t('feePlans.status.inactive')}
                    </Badge>
                  </Table.Td>

                  {/* Acciones */}
                  <Table.Td>
                    <Menu shadow="sm" position="bottom-end">
                      <Menu.Target>
                        <Button variant="subtle" size="xs">
                          {t('feePlans.menu.actions')}
                        </Button>
                      </Menu.Target>
                      <Menu.Dropdown>
                        {canEdit && (
                          <Menu.Item onClick={() => handleEdit(plan)}>
                            {t('feePlans.menu.edit')}
                          </Menu.Item>
                        )}
                        <Menu.Item onClick={() => handleLink(plan)}>
                          {t('feePlans.menu.viewLinks')}
                        </Menu.Item>
                        {canEdit && !plan.active && (
                          <Menu.Item
                            color="green"
                            onClick={() => activateFeePlanMutation.mutate(plan.id)}
                          >
                            {t('feePlans.menu.activate')}
                          </Menu.Item>
                        )}
                        {canDeactivate && plan.active && (
                          <Menu.Item color="red" onClick={() => handleDeactivate(plan)}>
                            {t('feePlans.menu.deactivate')}
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

      {/* Modales */}
      <FeePlanCreateModal opened={createOpened} onClose={closeCreate} />
      <FeePlanEditModal opened={editOpened} onClose={closeEdit} plan={selectedPlan} />
      <DeactivateFeePlanModal
        opened={deactivateOpened}
        onClose={closeDeactivate}
        plan={selectedPlan}
      />
      {selectedPlan && (
        <LinkMemberTypesModal
          opened={linkOpened}
          onClose={closeLink}
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          currentLinks={planDetail?.linkedMemberTypes ?? []}
        />
      )}
      <ImportTemplateModal opened={importOpened} onClose={closeImport} />
    </>
  );
}

// === Componentes internos ===

/** Skeleton de carga que simula 5 filas de tabla. */
function LoadingSkeleton() {
  return (
    <Stack gap="xs">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} height={40} />
      ))}
    </Stack>
  );
}
