import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Badge, Button, Card, Group, Skeleton, Stack, Text } from '@mantine/core';

import { useMemberTypes } from '../hooks/use-member-types';
import { calculateAge } from '../utils/dni-validator';
import type { MemberType } from '../schemas/member-registration.schemas';

// === Tipos ===

interface MemberTypeStepProps {
  birthDate: string;
  onValidChange: (memberTypeId: string | null) => void;
}

// === Componente ===

/**
 * Paso 2 del wizard de alta de socio.
 * Selector de tipo de socio con validacion de compatibilidad de edad
 * y visualizacion de derechos (voto, elegibilidad para cargos).
 */
export function MemberTypeStep({ birthDate, onValidChange }: MemberTypeStepProps) {
  const { t } = useTranslation('membership');
  const { data: memberTypes, isLoading, isError, refetch } = useMemberTypes();
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  // Edad del aspirante calculada a partir del paso 1
  const applicantAge = useMemo(() => calculateAge(birthDate), [birthDate]);

  /** Verifica si la edad del aspirante es compatible con el tipo de socio. */
  function isAgeCompatible(type: MemberType): boolean {
    if (type.ageRangeMin !== null && applicantAge < type.ageRangeMin) return false;
    if (type.ageRangeMax !== null && applicantAge > type.ageRangeMax) return false;
    return true;
  }

  /** Genera la etiqueta descriptiva del rango de edad del tipo. */
  function getAgeRangeLabel(type: MemberType): string {
    if (type.ageRangeMin !== null && type.ageRangeMax !== null) {
      return t('registration.memberTypeStep.ageRange', {
        min: type.ageRangeMin,
        max: type.ageRangeMax,
      });
    }
    if (type.ageRangeMin !== null) {
      return t('registration.memberTypeStep.ageRangeMinOnly', { min: type.ageRangeMin });
    }
    if (type.ageRangeMax !== null) {
      return t('registration.memberTypeStep.ageRangeMaxOnly', { max: type.ageRangeMax });
    }
    return t('registration.memberTypeStep.noAgeRestriction');
  }

  /** Maneja la seleccion de un tipo de socio. */
  function handleSelect(typeId: string) {
    setSelectedTypeId(typeId);

    const type = memberTypes?.find((t) => t.id === typeId);
    if (type && isAgeCompatible(type)) {
      onValidChange(typeId);
    } else {
      onValidChange(null);
    }
  }

  // Tipo seleccionado actualmente
  const selectedType = memberTypes?.find((t) => t.id === selectedTypeId) ?? null;

  // === Estado de carga ===

  if (isLoading) {
    return (
      <Stack gap="md">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={120} radius="md" />
        ))}
      </Stack>
    );
  }

  // === Estado de error ===

  if (isError) {
    return (
      <Alert color="red" title={t('registration.memberTypeStep.loadErrorTitle')}>
        {t('registration.memberTypeStep.loadErrorText')}
        <Button variant="subtle" color="red" size="xs" mt="xs" onClick={() => refetch()}>
          {t('registration.memberTypeStep.retry')}
        </Button>
      </Alert>
    );
  }

  // === Sin tipos disponibles ===

  if (!memberTypes || memberTypes.length === 0) {
    return (
      <Alert color="yellow" title={t('registration.memberTypeStep.noTypesTitle')}>
        {t('registration.memberTypeStep.noTypesText')}
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      {/* Alerta de incompatibilidad de edad */}
      {selectedType && !isAgeCompatible(selectedType) && (
        <Alert color="yellow" title={t('registration.memberTypeStep.ageIncompatibleTitle')}>
          {t('registration.memberTypeStep.ageIncompatibleText', {
            age: applicantAge,
            typeName: selectedType.name,
            rangeLabel: getAgeRangeLabel(selectedType).toLowerCase(),
          })}
        </Alert>
      )}

      {/* Indicador de edad compatible */}
      {selectedType && isAgeCompatible(selectedType) && (
        <Text c="green" size="sm" fw={500}>
          {t('registration.memberTypeStep.ageCompatible')}
        </Text>
      )}

      {/* Tarjetas de tipo de socio */}
      {memberTypes.map((type) => {
        const compatible = isAgeCompatible(type);
        const isSelected = selectedTypeId === type.id;

        return (
          <Card
            key={type.id}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{
              cursor: 'pointer',
              borderColor: isSelected ? 'var(--mantine-color-brand-filled)' : undefined,
              borderWidth: isSelected ? 2 : undefined,
              opacity: compatible ? 1 : 0.6,
            }}
            onClick={() => handleSelect(type.id)}
          >
            <Stack gap="sm">
              {/* Nombre del tipo */}
              <Group justify="space-between" align="center">
                <Text fw={600} size="lg">
                  {type.name}
                </Text>
                {isSelected && (
                  <Badge color="brand" variant="light" radius="sm">
                    {t('registration.memberTypeStep.selected')}
                  </Badge>
                )}
              </Group>

              {/* Rango de edad */}
              <Text size="sm" c="dimmed">
                {getAgeRangeLabel(type)}
              </Text>

              {/* Derechos */}
              <Group gap="xs">
                {type.votingRight && (
                  <Badge color="green" variant="light" radius="sm">
                    {t('registration.memberTypeStep.votingRight')}
                  </Badge>
                )}
                {type.eligibleForOffice && (
                  <Badge color="blue" variant="light" radius="sm">
                    {t('registration.memberTypeStep.eligibleForOffice')}
                  </Badge>
                )}
              </Group>

              {/* Descripcion */}
              {type.description && (
                <Text size="sm" c="dimmed">
                  {type.description}
                </Text>
              )}

              {/* Indicador de compatibilidad inline */}
              {!compatible && (
                <Text size="xs" c="yellow">
                  {t('registration.memberTypeStep.notCompatible', { age: applicantAge })}
                </Text>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
