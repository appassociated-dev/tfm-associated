import { useEffect } from 'react';
import {
  Button,
  Chip,
  Group,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useForm } from '@mantine/form';

import type { CreateFeePlanInput, Frequency, PlanType } from '../schemas/fee-plan.schemas';

// === Constantes ===

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const FREQUENCY_OPTIONS = [
  { label: 'Mensual', value: 'MONTHLY' },
  { label: 'Trimestral', value: 'QUARTERLY' },
  { label: 'Semestral', value: 'BIANNUAL' },
  { label: 'Anual', value: 'ANNUAL' },
  { label: 'Personalizada', value: 'CUSTOM' },
];

/** Meses preseleccionados según frecuencia. */
const FREQUENCY_MONTHS: Record<string, number[]> = {
  MONTHLY: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  QUARTERLY: [1, 4, 7, 10],
  BIANNUAL: [1, 7],
  ANNUAL: [1],
};

// === Tipos ===

interface FeePlanFormProps {
  initialValues?: Partial<CreateFeePlanInput>;
  onSubmit: (values: CreateFeePlanInput) => Promise<void>;
  isSubmitting: boolean;
  /** Si true, el campo código es de solo lectura. */
  isEditing?: boolean;
}

/** Valores internos del formulario (importe en euros, no centavos). */
interface FormValues {
  code: string;
  name: string;
  description: string;
  type: PlanType;
  /** Importe en euros (con decimales). */
  amountEuros: number;
  frequency: Frequency | '';
  billingMonths: number[];
}

// === Componente ===

/**
 * Formulario reutilizable para crear y editar planes de cuota.
 * El importe se maneja internamente en euros; la conversión a centavos
 * ocurre al momento de enviar los datos.
 */
export function FeePlanForm({
  initialValues,
  onSubmit,
  isSubmitting,
  isEditing = false,
}: FeePlanFormProps) {
  const form = useForm<FormValues>({
    initialValues: {
      code: initialValues?.code ?? '',
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      type: initialValues?.type ?? 'RECURRING',
      // Conversión centavos → euros al cargar valores iniciales
      amountEuros: initialValues?.amount != null ? initialValues.amount / 100 : 0,
      frequency: initialValues?.frequency ?? 'MONTHLY',
      billingMonths: initialValues?.billingMonths ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    validate: {
      code: (value) => {
        if (!value.trim()) return 'El código es obligatorio';
        if (value.length > 20) return 'Máximo 20 caracteres';
        if (!/^[a-zA-Z0-9]+$/.test(value)) return 'Solo caracteres alfanuméricos';
        return null;
      },
      name: (value) => {
        if (!value.trim()) return 'El nombre es obligatorio';
        if (value.length > 100) return 'Máximo 100 caracteres';
        return null;
      },
      description: (value) => {
        if (value && value.length > 500) return 'Máximo 500 caracteres';
        return null;
      },
      amountEuros: (value) => {
        if (value < 0) return 'El importe no puede ser negativo';
        return null;
      },
      billingMonths: (value, values) => {
        if (values.type === 'RECURRING' && value.length === 0) {
          return 'Seleccione al menos un mes de facturación';
        }
        return null;
      },
    },
  });

  // Preseleccionar meses cuando cambia la frecuencia
  const currentFrequency = form.getValues().frequency;
  const currentType = form.getValues().type;

  useEffect(() => {
    if (currentType !== 'RECURRING') return;
    if (currentFrequency === 'CUSTOM' || currentFrequency === '') return;

    const preselected = FREQUENCY_MONTHS[currentFrequency];
    if (preselected) {
      form.setFieldValue('billingMonths', preselected);
    }
    // Solo reaccionar a cambios en frecuencia
  }, [currentFrequency]);

  /** Envía el formulario convirtiendo euros a centavos. */
  async function handleSubmit(values: FormValues) {
    const input: CreateFeePlanInput = {
      code: values.code.toUpperCase(),
      name: values.name,
      description: values.description || null,
      type: values.type,
      amount: Math.round(values.amountEuros * 100),
      frequency:
        values.type === 'RECURRING' && values.frequency ? (values.frequency as Frequency) : null,
      billingMonths: values.type === 'RECURRING' ? values.billingMonths : [],
    };

    await onSubmit(input);
  }

  const isRecurring = form.getValues().type === 'RECURRING';
  const selectedMonthsCount = form.getValues().billingMonths.length;

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {/* Código */}
        <TextInput
          label="Código"
          placeholder="Ej: CUOTA-ANUAL"
          readOnly={isEditing}
          description={isEditing ? 'El código no se puede modificar' : undefined}
          key={form.key('code')}
          {...form.getInputProps('code')}
          onChange={(e) => form.setFieldValue('code', e.currentTarget.value.toUpperCase())}
        />

        {/* Nombre */}
        <TextInput
          label="Nombre"
          placeholder="Ej: Cuota anual de socio"
          key={form.key('name')}
          {...form.getInputProps('name')}
        />

        {/* Descripción */}
        <Textarea
          label="Descripción"
          placeholder="Descripción opcional del plan"
          autosize
          minRows={2}
          maxRows={4}
          key={form.key('description')}
          {...form.getInputProps('description')}
        />

        {/* Tipo */}
        <div>
          <Text size="sm" fw={500} mb={4}>
            Tipo de plan
          </Text>
          <SegmentedControl
            data={[
              { label: 'Periódico', value: 'RECURRING' },
              { label: 'Cuota Única', value: 'ONE_TIME' },
            ]}
            key={form.key('type')}
            {...form.getInputProps('type')}
          />
        </div>

        {/* Importe */}
        <NumberInput
          label="Importe"
          placeholder="0,00"
          min={0}
          decimalScale={2}
          suffix=" €"
          step={0.01}
          key={form.key('amountEuros')}
          {...form.getInputProps('amountEuros')}
        />

        {/* Sección condicional: campos de periodicidad */}
        {isRecurring && (
          <>
            {/* Frecuencia */}
            <Select
              label="Periodicidad"
              data={FREQUENCY_OPTIONS}
              key={form.key('frequency')}
              {...form.getInputProps('frequency')}
            />

            {/* Meses de facturación */}
            <div>
              <Text size="sm" fw={500} mb={4}>
                Meses de facturación
              </Text>
              <Chip.Group
                multiple
                value={form.getValues().billingMonths.map(String)}
                onChange={(selected: string[]) =>
                  form.setFieldValue(
                    'billingMonths',
                    selected.map(Number).sort((a, b) => a - b),
                  )
                }
              >
                <Group gap="xs">
                  {MONTH_LABELS.map((label, index) => (
                    <Chip key={index + 1} value={String(index + 1)} variant="light">
                      {label}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
              {form.errors.billingMonths && (
                <Text c="red" size="xs" mt={4}>
                  {form.errors.billingMonths}
                </Text>
              )}
              <Text c="dimmed" size="xs" mt={4}>
                Se generarán {selectedMonthsCount} cargo{selectedMonthsCount !== 1 ? 's' : ''} al
                año
              </Text>
            </div>
          </>
        )}

        {/* Botón de envío */}
        <Group justify="flex-end" mt="md">
          <Button type="submit" color="brand" loading={isSubmitting}>
            Guardar
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
