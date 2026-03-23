import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Center,
  Checkbox,
  Group,
  Loader,
  Modal,
  NumberInput,
  Radio,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { useMemberTypes } from '../hooks/use-member-types';
import { useLinkMemberTypes } from '../hooks/use-link-member-types';
import type {
  MemberTypeFeePlan,
  MemberTypeOption,
  LinkMemberTypeInput,
} from '../schemas/fee-plan.schemas';

// === Tipos ===

export interface LinkMemberTypesModalProps {
  opened: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  /** Vinculaciones existentes para pre-popular la tabla. */
  currentLinks?: MemberTypeFeePlan[];
}

/** Estado local de cada fila de tipo de socio. */
interface RowState {
  selected: boolean;
  isDefault: boolean;
  order: number;
}

// === Componente ===

/**
 * Modal para vincular un plan de cuota a tipos de socio.
 *
 * Presenta una tabla con checkbox de selección, radio de default y
 * orden de presentación. Pre-popula desde las vinculaciones existentes.
 */
export function LinkMemberTypesModal({
  opened,
  onClose,
  planId,
  planName,
  currentLinks = [],
}: LinkMemberTypesModalProps) {
  const { t } = useTranslation('treasury');
  const { data: memberTypes, isLoading: loadingTypes } = useMemberTypes();
  const linkMutation = useLinkMemberTypes();

  // Estado local: mapa de memberTypeId → RowState
  const [rows, setRows] = useState<Record<string, RowState>>({});

  // Inicializar estado cuando se abren los datos o cambian los links
  useEffect(() => {
    if (!memberTypes) return;

    const initial: Record<string, RowState> = {};

    for (const mt of memberTypes) {
      const existing = currentLinks.find((l) => l.memberTypeId === mt.id);
      initial[mt.id] = {
        selected: !!existing,
        isDefault: existing?.isDefault ?? false,
        order: existing?.order ?? 0,
      };
    }

    setRows(initial);
  }, [memberTypes, currentLinks]);

  // Tipos seleccionados actuales
  const selectedIds = useMemo(
    () =>
      Object.entries(rows)
        .filter(([, r]) => r.selected)
        .map(([id]) => id),
    [rows],
  );

  // Tipo marcado como default actual
  const defaultId = useMemo(
    () => Object.entries(rows).find(([, r]) => r.selected && r.isDefault)?.[0] ?? null,
    [rows],
  );

  // Detectar si algun tipo seleccionado ya tiene otro plan como default
  const defaultWarningName = useMemo(() => {
    if (!defaultId || !memberTypes) return null;

    const existingLink = currentLinks.find(
      (l) => l.memberTypeId === defaultId && l.isDefault && l.feePlanId !== planId,
    );
    if (!existingLink) return null;

    return memberTypes.find((mt) => mt.id === defaultId)?.name ?? null;
  }, [defaultId, memberTypes, currentLinks, planId]);

  /** Alterna la selección de un tipo de socio. */
  const toggleSelected = useCallback((memberTypeId: string) => {
    setRows((prev) => {
      const current = prev[memberTypeId];
      if (!current) return prev;

      const updated = { ...current, selected: !current.selected };

      // Si se deselecciona, quitar default
      if (!updated.selected) {
        updated.isDefault = false;
      }

      return { ...prev, [memberTypeId]: updated };
    });
  }, []);

  /** Establece un tipo como default (radio exclusivo). */
  const setDefault = useCallback((memberTypeId: string) => {
    setRows((prev) => {
      const next: Record<string, RowState> = {};

      for (const [id, row] of Object.entries(prev)) {
        next[id] = { ...row, isDefault: id === memberTypeId };
      }

      return next;
    });
  }, []);

  /** Actualiza el orden de un tipo de socio. */
  const setOrder = useCallback((memberTypeId: string, order: number) => {
    setRows((prev) => {
      const current = prev[memberTypeId];
      if (!current) return prev;
      return { ...prev, [memberTypeId]: { ...current, order } };
    });
  }, []);

  /** Envía las vinculaciones al backend. */
  async function handleSave(): Promise<void> {
    const links: LinkMemberTypeInput[] = selectedIds.map((id) => ({
      memberTypeId: id,
      isDefault: rows[id].isDefault,
      order: rows[id].order,
    }));

    await linkMutation.mutateAsync({ planId, links });
    onClose();
  }

  /** Estilo reutilizable para cabeceras de tabla. */
  const headerStyle = {
    textTransform: 'uppercase' as const,
    fontSize: 'var(--mantine-font-size-xs)',
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('feePlans.linkModal.title')} size="lg">
      <Stack gap="md">
        {/* Subtítulo con nombre del plan */}
        <Text size="sm" c="dimmed">
          {t('feePlans.linkModal.planLabel')}{' '}
          <Text span fw={600}>
            {planName}
          </Text>
        </Text>

        {/* Estado de carga */}
        {loadingTypes && (
          <Center py="xl">
            <Loader color="brand" size="md" />
          </Center>
        )}

        {/* Advertencia de cambio de default */}
        {defaultWarningName && (
          <Alert color="yellow">
            {t('feePlans.linkModal.defaultWarning', { name: defaultWarningName })}
          </Alert>
        )}

        {/* Tabla de tipos de socio */}
        {memberTypes && memberTypes.length > 0 && (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }} />
                <Table.Th style={headerStyle} fw={600} c="dimmed">
                  {t('feePlans.linkModal.table.code')}
                </Table.Th>
                <Table.Th style={headerStyle} fw={600} c="dimmed">
                  {t('feePlans.linkModal.table.name')}
                </Table.Th>
                <Table.Th style={headerStyle} fw={600} c="dimmed">
                  {t('feePlans.linkModal.table.isDefault')}
                </Table.Th>
                <Table.Th style={headerStyle} fw={600} c="dimmed">
                  {t('feePlans.linkModal.table.order')}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {memberTypes.map((mt: MemberTypeOption) => {
                const row = rows[mt.id];
                if (!row) return null;

                return (
                  <Table.Tr key={mt.id}>
                    <Table.Td>
                      <Checkbox
                        checked={row.selected}
                        onChange={() => toggleSelected(mt.id)}
                        aria-label={t('feePlans.linkModal.selectAriaLabel', { name: mt.name })}
                      />
                    </Table.Td>
                    <Table.Td>{mt.code}</Table.Td>
                    <Table.Td>{mt.name}</Table.Td>
                    <Table.Td>
                      <Radio
                        checked={row.isDefault}
                        onChange={() => setDefault(mt.id)}
                        disabled={!row.selected}
                        aria-label={t('feePlans.linkModal.defaultAriaLabel', { name: mt.name })}
                      />
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={row.order}
                        onChange={(val) => setOrder(mt.id, typeof val === 'number' ? val : 0)}
                        min={0}
                        disabled={!row.selected}
                        size="xs"
                        w={80}
                        aria-label={t('feePlans.linkModal.orderAriaLabel', { name: mt.name })}
                      />
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}

        {/* Sin tipos disponibles */}
        {memberTypes && memberTypes.length === 0 && (
          <Text c="dimmed" size="sm" ta="center" py="md">
            {t('feePlans.linkModal.noMemberTypes')}
          </Text>
        )}

        {/* Botones de acción */}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>
            {t('feePlans.linkModal.cancel')}
          </Button>
          <Button
            color="brand"
            loading={linkMutation.isPending}
            disabled={selectedIds.length === 0}
            onClick={handleSave}
          >
            {t('feePlans.linkModal.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
