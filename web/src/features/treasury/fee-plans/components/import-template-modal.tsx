import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Group, Modal, Select, Stack, Table, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/shared/utils/format-money';
import { useFeePlanTemplates, useImportTemplate } from '../hooks/use-fee-plan-templates';
import { useFeePlans } from '../hooks/use-fee-plans';

// === Constantes ===

/** Color del badge según tipo de plan. */
const TYPE_COLORS: Record<string, string> = {
  ONE_TIME: 'gray',
  RECURRING: 'brand',
};

// === Tipos ===

export interface ImportTemplateModalProps {
  opened: boolean;
  onClose: () => void;
}

// === Componente ===

/**
 * Modal para importar plantillas predefinidas de planes de cuota.
 *
 * Permite seleccionar un tipo de colectividad, previsualizar los
 * planes que se crearán e importarlos al sistema.
 */
export function ImportTemplateModal({ opened, onClose }: ImportTemplateModalProps) {
  const { t } = useTranslation('treasury');
  const [selectedType, setSelectedType] = useState<string>('');

  const { data: templateData, isLoading: loadingTemplates } = useFeePlanTemplates(selectedType);
  const { data: existingPlans } = useFeePlans();
  const importMutation = useImportTemplate();

  const templates = templateData?.templates ?? [];
  const hasExistingPlans = !!existingPlans && existingPlans.length > 0;

  const collectivityOptions = useMemo(
    () => [
      { value: 'pena', label: t('collectivityType.pena') },
      { value: 'cofradia', label: t('collectivityType.cofradia') },
      { value: 'club_deportivo', label: t('collectivityType.clubDeportivo') },
      { value: 'asociacion_cultural', label: t('collectivityType.asociacionCultural') },
    ],
    [t],
  );

  /** Devuelve la etiqueta traducida del tipo de plan. */
  function getTypeLabel(type: string): string {
    switch (type) {
      case 'ONE_TIME':
        return t('planType.oneTime');
      case 'RECURRING':
        return t('planType.recurring');
      default:
        return type;
    }
  }

  /** Devuelve la etiqueta traducida de la frecuencia. */
  function getFrequencyLabel(frequency: string | null): string {
    switch (frequency) {
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
        return '\u2014';
    }
  }

  /** Importa las plantillas del tipo seleccionado. */
  async function handleImport(): Promise<void> {
    if (!selectedType) return;
    await importMutation.mutateAsync(selectedType);
    setSelectedType('');
    onClose();
  }

  /** Limpia el estado al cerrar. */
  function handleClose(): void {
    setSelectedType('');
    onClose();
  }

  /** Estilo reutilizable para cabeceras de tabla. */
  const headerStyle = {
    textTransform: 'uppercase' as const,
    fontSize: 'var(--mantine-font-size-xs)',
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={t('feePlans.importModal.title')} size="lg">
      <Stack gap="md">
        {/* Selector de tipo de colectividad */}
        <Select
          label={t('feePlans.importModal.collectivityType')}
          placeholder={t('feePlans.importModal.collectivityPlaceholder')}
          data={collectivityOptions}
          value={selectedType || null}
          onChange={(val) => setSelectedType(val ?? '')}
          clearable
        />

        {/* Advertencia si ya existen planes */}
        {hasExistingPlans && selectedType && (
          <Alert color="yellow">{t('feePlans.importModal.existingPlansWarning')}</Alert>
        )}

        {/* Tabla de preview de plantillas */}
        {selectedType && templates.length > 0 && (
          <>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={headerStyle} fw={600} c="dimmed">
                    {t('feePlans.importModal.table.name')}
                  </Table.Th>
                  <Table.Th style={headerStyle} fw={600} c="dimmed">
                    {t('feePlans.importModal.table.type')}
                  </Table.Th>
                  <Table.Th style={{ ...headerStyle, textAlign: 'right' }} fw={600} c="dimmed">
                    {t('feePlans.importModal.table.amount')}
                  </Table.Th>
                  <Table.Th style={headerStyle} fw={600} c="dimmed">
                    {t('feePlans.importModal.table.frequency')}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {templates.map((tpl) => (
                  <Table.Tr key={tpl.code}>
                    <Table.Td>{tpl.name}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" radius="sm" color={TYPE_COLORS[tpl.type] ?? 'gray'}>
                        {getTypeLabel(tpl.type)}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(tpl.amount)}
                    </Table.Td>
                    <Table.Td>{getFrequencyLabel(tpl.frequency)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {/* Texto informativo */}
            <Text size="sm" c="dimmed">
              {t('feePlans.importModal.templateCount', {
                count: templates.length,
                collectivity:
                  collectivityOptions.find((o) => o.value === selectedType)?.label ?? selectedType,
              })}
            </Text>
          </>
        )}

        {/* Estado de carga de plantillas */}
        {selectedType && loadingTemplates && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            {t('feePlans.importModal.loadingTemplates')}
          </Text>
        )}

        {/* Sin plantillas para el tipo seleccionado */}
        {selectedType && !loadingTemplates && templates.length === 0 && templateData && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            {t('feePlans.importModal.noTemplates')}
          </Text>
        )}

        {/* Botones de acción */}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose}>
            {t('feePlans.importModal.cancel')}
          </Button>
          <Button
            color="brand"
            loading={importMutation.isPending}
            disabled={!selectedType || templates.length === 0}
            onClick={handleImport}
          >
            {t('feePlans.importModal.import')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
