import { useMemo } from 'react';
import { Button, Card, Divider, Group, List, Stack, Text, Title } from '@mantine/core';

import { formatDateLong } from '@/shared/utils/format-date';
import { formatMoney } from '@/shared/utils/format-money';

import { calculateAge } from '../utils/dni-validator';
import type { PersonalData, MemberType } from '../schemas/member-registration.schemas';

// === Tipos ===

interface RegistrationPlanInfo {
  feePlanId: string;
  name: string;
  amount: number;
}

interface ConfirmationStepProps {
  personalData: PersonalData;
  memberTypeId: string;
  memberTypes: MemberType[];
  /** Informacion del plan de alta activo (importe real). */
  registrationPlan?: RegistrationPlanInfo | null;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

// === Componente ===

/**
 * Paso 3 del wizard de alta de socio.
 * Muestra un resumen de los datos del aspirante, el tipo de socio seleccionado,
 * los cargos que se generaran y un boton de confirmacion con proteccion contra doble clic.
 */
export function ConfirmationStep({
  personalData,
  memberTypeId,
  memberTypes,
  registrationPlan,
  onConfirm,
  isSubmitting,
}: ConfirmationStepProps) {
  // Tipo de socio seleccionado
  const selectedType = useMemo(
    () => memberTypes.find((t) => t.id === memberTypeId) ?? null,
    [memberTypes, memberTypeId],
  );

  // Edad calculada
  const age = useMemo(() => calculateAge(personalData.birthDate), [personalData.birthDate]);

  // Fecha de nacimiento formateada
  const birthDateFormatted = useMemo(
    () => formatDateLong(new Date(personalData.birthDate)),
    [personalData.birthDate],
  );

  // Fecha de hoy formateada
  const todayFormatted = useMemo(() => formatDateLong(new Date()), []);

  return (
    <Stack gap="lg">
      {/* Tarjeta de resumen del aspirante */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={4}>Datos del aspirante</Title>

          <SummaryRow
            label="Nombre completo"
            value={`${personalData.firstName} ${personalData.lastName}`}
          />
          <SummaryRow label="DNI/NIE" value={personalData.dni} />
          <SummaryRow
            label="Fecha de nacimiento"
            value={`${birthDateFormatted} (${age} ${age === 1 ? 'año' : 'años'})`}
          />
          <SummaryRow label="Email" value={personalData.email} />
          {personalData.phone && <SummaryRow label="Telefono" value={personalData.phone} />}
          {personalData.address && <SummaryRow label="Direccion" value={personalData.address} />}
          {personalData.postalCode && (
            <SummaryRow label="Codigo postal" value={personalData.postalCode} />
          )}
          {personalData.city && <SummaryRow label="Ciudad" value={personalData.city} />}

          <Divider />

          <SummaryRow label="Tipo de socio" value={selectedType?.name ?? 'Desconocido'} />
          <SummaryRow label="Fecha de alta" value={todayFormatted} />
        </Stack>
      </Card>

      {/* Seccion: Cargos a generar — Issue P1-3: importe real con formatMoney */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={4}>Cargos a generar</Title>

          <Group justify="space-between" align="center">
            <Text size="sm">
              {registrationPlan ? registrationPlan.name : 'Cuota de inscripcion'}
            </Text>
            <Text size="sm" fw={600}>
              {registrationPlan
                ? formatMoney(registrationPlan.amount)
                : 'Determinada por el plan vigente'}
            </Text>
          </Group>

          <Text size="xs" c="dimmed">
            El cargo de inscripcion se generara automaticamente al confirmar el alta.
          </Text>
        </Stack>
      </Card>

      {/* Seccion: Al confirmar */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={4}>Al confirmar</Title>

          <List size="sm" spacing="xs">
            <List.Item>Se creara el socio en estado Activo</List.Item>
            <List.Item>Se generara cargo de inscripcion</List.Item>
            <List.Item>Se asignará número de socio automáticamente</List.Item>
          </List>
        </Stack>
      </Card>

      {/* Boton de confirmacion */}
      <Group justify="flex-end">
        <Button
          color="brand"
          size="md"
          loading={isSubmitting}
          disabled={isSubmitting}
          onClick={onConfirm}
        >
          Confirmar Alta
        </Button>
      </Group>
    </Stack>
  );
}

// === Componentes auxiliares ===

interface SummaryRowProps {
  label: string;
  value: string;
}

/** Fila de resumen con etiqueta y valor. */
function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <Group justify="space-between" align="baseline">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </Group>
  );
}
