import { useState } from 'react';
import { Alert, Badge, Button, Group, Modal, Select, Stack, Table, Text } from '@mantine/core';
import { formatMoney } from '@/shared/utils/format-money';
import { useFeePlanTemplates, useImportTemplate } from '../hooks/use-fee-plan-templates';
import { useFeePlans } from '../hooks/use-fee-plans';

// === Constantes ===

const COLLECTIVITY_OPTIONS = [
  { value: 'pena', label: 'Peña' },
  { value: 'cofradia', label: 'Cofradía' },
  { value: 'club_deportivo', label: 'Club Deportivo' },
  { value: 'asociacion_cultural', label: 'Asociación Cultural' },
] as const;

/** Mapeo de frecuencia interna a etiqueta legible. */
const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  BIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  CUSTOM: 'Personalizado',
};

/** Mapeo de tipo de plan a etiqueta legible. */
const TYPE_LABELS: Record<string, string> = {
  ONE_TIME: 'Única',
  RECURRING: 'Periódico',
};

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
  const [selectedType, setSelectedType] = useState<string>('');

  const { data: templateData, isLoading: loadingTemplates } = useFeePlanTemplates(selectedType);
  const { data: existingPlans } = useFeePlans();
  const importMutation = useImportTemplate();

  const templates = templateData?.templates ?? [];
  const hasExistingPlans = !!existingPlans && existingPlans.length > 0;

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

  return (
    <Modal opened={opened} onClose={handleClose} title="Importar Plantilla de Planes" size="lg">
      <Stack gap="md">
        {/* Selector de tipo de colectividad */}
        <Select
          label="Tipo de colectividad"
          placeholder="Seleccione un tipo"
          data={[...COLLECTIVITY_OPTIONS]}
          value={selectedType || null}
          onChange={(val) => setSelectedType(val ?? '')}
          clearable
        />

        {/* Advertencia si ya existen planes */}
        {hasExistingPlans && selectedType && (
          <Alert color="yellow">
            Ya hay planes configurados. Los nuevos se añadirán a los existentes.
          </Alert>
        )}

        {/* Tabla de preview de plantillas */}
        {selectedType && templates.length > 0 && (
          <>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th
                    style={{ textTransform: 'uppercase', fontSize: 'var(--mantine-font-size-xs)' }}
                    fw={600}
                    c="dimmed"
                  >
                    Nombre del plan
                  </Table.Th>
                  <Table.Th
                    style={{ textTransform: 'uppercase', fontSize: 'var(--mantine-font-size-xs)' }}
                    fw={600}
                    c="dimmed"
                  >
                    Tipo
                  </Table.Th>
                  <Table.Th
                    style={{
                      textTransform: 'uppercase',
                      fontSize: 'var(--mantine-font-size-xs)',
                      textAlign: 'right',
                    }}
                    fw={600}
                    c="dimmed"
                  >
                    Importe
                  </Table.Th>
                  <Table.Th
                    style={{ textTransform: 'uppercase', fontSize: 'var(--mantine-font-size-xs)' }}
                    fw={600}
                    c="dimmed"
                  >
                    Periodicidad
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {templates.map((tpl) => (
                  <Table.Tr key={tpl.code}>
                    <Table.Td>{tpl.name}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" radius="sm" color={TYPE_COLORS[tpl.type] ?? 'gray'}>
                        {TYPE_LABELS[tpl.type] ?? tpl.type}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(tpl.amount)}
                    </Table.Td>
                    <Table.Td>
                      {tpl.frequency ? (FREQUENCY_LABELS[tpl.frequency] ?? tpl.frequency) : '—'}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {/* Texto informativo */}
            <Text size="sm" c="dimmed">
              Se crearán {templates.length} planes de cuota con la configuración estándar para{' '}
              {COLLECTIVITY_OPTIONS.find((o) => o.value === selectedType)?.label ?? selectedType}.
            </Text>
          </>
        )}

        {/* Estado de carga de plantillas */}
        {selectedType && loadingTemplates && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            Cargando plantillas…
          </Text>
        )}

        {/* Sin plantillas para el tipo seleccionado */}
        {selectedType && !loadingTemplates && templates.length === 0 && templateData && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No hay plantillas disponibles para este tipo de colectividad.
          </Text>
        )}

        {/* Botones de acción */}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            color="brand"
            loading={importMutation.isPending}
            disabled={!selectedType || templates.length === 0}
            onClick={handleImport}
          >
            Importar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
