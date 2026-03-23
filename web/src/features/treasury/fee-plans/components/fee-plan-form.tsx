import { useEffect, useMemo, useRef } from 'react';
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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import {
  feePlanFormSchema,
  type CreateFeePlanInput,
  type FeePlanFormValues,
  type Frequency,
} from '../schemas/fee-plan.schemas';

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
  const { t } = useTranslation('treasury');

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FeePlanFormValues>({
    resolver: zodResolver(feePlanFormSchema),
    defaultValues: {
      code: initialValues?.code ?? '',
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      type: initialValues?.type ?? 'RECURRING',
      // Conversión centavos → euros al cargar valores iniciales
      amountEuros: initialValues?.amount != null ? initialValues.amount / 100 : 0,
      frequency: initialValues?.frequency ?? 'MONTHLY',
      billingMonths: initialValues?.billingMonths ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
  });

  // Preseleccionar meses cuando cambia la frecuencia o el tipo vuelve a RECURRING
  const currentFrequency = watch('frequency');
  const currentType = watch('type');

  const prevFrequencyRef = useRef(currentFrequency);
  const prevTypeRef = useRef(currentType);

  useEffect(() => {
    const freqChanged = prevFrequencyRef.current !== currentFrequency;
    const typeChanged = prevTypeRef.current !== currentType;
    prevFrequencyRef.current = currentFrequency;
    prevTypeRef.current = currentType;

    // Solo actuar si hubo un cambio real en frecuencia o tipo
    if (!freqChanged && !typeChanged) return;
    if (currentType !== 'RECURRING') return;
    if (currentFrequency === 'CUSTOM' || currentFrequency === '') return;

    const preselected = FREQUENCY_MONTHS[currentFrequency];
    if (preselected) {
      setValue('billingMonths', preselected);
    }
  }, [currentFrequency, currentType, setValue]);

  /** Envía el formulario convirtiendo euros a centavos. */
  async function handleSubmit(values: FeePlanFormValues) {
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

  const isRecurring = currentType === 'RECURRING';
  const selectedMonthsCount = watch('billingMonths').length;

  const monthLabels = useMemo(
    () => [
      t('months.jan'),
      t('months.feb'),
      t('months.mar'),
      t('months.apr'),
      t('months.may'),
      t('months.jun'),
      t('months.jul'),
      t('months.aug'),
      t('months.sep'),
      t('months.oct'),
      t('months.nov'),
      t('months.dec'),
    ],
    [t],
  );

  const frequencyOptions = useMemo(
    () => [
      { label: t('frequency.monthly'), value: 'MONTHLY' },
      { label: t('frequency.quarterly'), value: 'QUARTERLY' },
      { label: t('frequency.biannual'), value: 'BIANNUAL' },
      { label: t('frequency.annual'), value: 'ANNUAL' },
      { label: t('frequency.custom'), value: 'CUSTOM' },
    ],
    [t],
  );

  return (
    <form onSubmit={rhfHandleSubmit(handleSubmit)}>
      <Stack gap="md">
        {/* Código */}
        <Controller
          name="code"
          control={control}
          render={({ field, fieldState }) => (
            <TextInput
              label={t('feePlans.form.code')}
              placeholder={t('feePlans.form.codePlaceholder')}
              readOnly={isEditing}
              description={isEditing ? t('feePlans.form.codeReadonly') : undefined}
              value={field.value}
              onChange={(e) => field.onChange(e.currentTarget.value.toUpperCase())}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        {/* Nombre */}
        <TextInput
          label={t('feePlans.form.name')}
          placeholder={t('feePlans.form.namePlaceholder')}
          {...register('name')}
          error={errors.name?.message}
        />

        {/* Descripción */}
        <Textarea
          label={t('feePlans.form.description')}
          placeholder={t('feePlans.form.descriptionPlaceholder')}
          autosize
          minRows={2}
          maxRows={4}
          {...register('description')}
          error={errors.description?.message}
        />

        {/* Tipo */}
        <div>
          <Text size="sm" fw={500} mb={4}>
            {t('feePlans.form.planType')}
          </Text>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <SegmentedControl
                data={[
                  { label: t('feePlans.form.typeRecurring'), value: 'RECURRING' },
                  { label: t('feePlans.form.typeOneTime'), value: 'ONE_TIME' },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Importe */}
        <Controller
          name="amountEuros"
          control={control}
          render={({ field, fieldState }) => (
            <NumberInput
              label={t('feePlans.form.amount')}
              placeholder={t('feePlans.form.amountPlaceholder')}
              min={0.01}
              decimalScale={2}
              suffix=" €"
              step={0.01}
              value={field.value}
              onChange={(val) => field.onChange(typeof val === 'number' ? val : 0)}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />

        {/* Sección condicional: campos de periodicidad */}
        {isRecurring && (
          <>
            {/* Frecuencia */}
            <Controller
              name="frequency"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label={t('feePlans.form.frequency')}
                  data={frequencyOptions}
                  value={field.value}
                  onChange={(val) => field.onChange(val ?? '')}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />

            {/* Meses de facturación */}
            <div>
              <Text size="sm" fw={500} mb={4}>
                {t('feePlans.form.billingMonths')}
              </Text>
              <Controller
                name="billingMonths"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Chip.Group
                      multiple
                      value={field.value.map(String)}
                      onChange={(selected: string[]) =>
                        field.onChange(selected.map(Number).sort((a, b) => a - b))
                      }
                    >
                      <Group gap="xs">
                        {monthLabels.map((label, index) => (
                          <Chip key={index + 1} value={String(index + 1)} variant="light">
                            {label}
                          </Chip>
                        ))}
                      </Group>
                    </Chip.Group>
                    {fieldState.error && (
                      <Text c="red" size="xs" mt={4}>
                        {fieldState.error.message}
                      </Text>
                    )}
                  </>
                )}
              />
              <Text c="dimmed" size="xs" mt={4}>
                {t('feePlans.form.chargesPerYear', { count: selectedMonthsCount })}
              </Text>
            </div>
          </>
        )}

        {/* Botón de envío */}
        <Group justify="flex-end" mt="md">
          <Button type="submit" color="brand" loading={isSubmitting} miw={120}>
            {t('feePlans.form.save')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
