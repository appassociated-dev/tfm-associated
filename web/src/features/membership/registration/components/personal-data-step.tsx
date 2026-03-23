import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Grid, Group, Loader, Stack, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';

import { useCheckDni } from '../hooks/use-check-dni';
import { useCheckEmail } from '../hooks/use-check-email';
import { validateIdentityDocument, calculateAge } from '../utils/dni-validator';
import type { PersonalData } from '../schemas/member-registration.schemas';
import { personalDataFormSchema } from '../schemas/member-registration.schemas';
import type { PersonalDataFormValues } from '../schemas/member-registration.schemas';

// === Tipos ===

interface PersonalDataStepProps {
  initialValues?: PersonalData;
  onValidChange: (data: PersonalData | null) => void;
}

// === Constantes ===

/** Fecha maxima seleccionable: hoy. */
function getToday(): Date {
  return new Date();
}

// === Componente ===

/**
 * Paso 1 del wizard de alta de socio.
 * Formulario de datos personales con validacion de DNI/NIE en tiempo real
 * (formato client-side + unicidad API debounced).
 */
export function PersonalDataStep({ initialValues, onValidChange }: PersonalDataStepProps) {
  const { t } = useTranslation('membership');
  const { register, control, watch, trigger, formState } = useForm<PersonalDataFormValues>({
    resolver: zodResolver(personalDataFormSchema),
    mode: 'onBlur',
    defaultValues: {
      dni: initialValues?.dni ?? '',
      firstName: initialValues?.firstName ?? '',
      lastName: initialValues?.lastName ?? '',
      birthDate: initialValues?.birthDate ?? null,
      email: initialValues?.email ?? '',
      phone: initialValues?.phone ?? '',
      address: initialValues?.address ?? '',
      postalCode: initialValues?.postalCode ?? '',
      city: initialValues?.city ?? '',
    },
  });

  // CRITICO: destructurar formState ANTES del useEffect para que el Proxy de RHF registre la subscription
  const { errors } = formState;

  // Consulta debounced de unicidad de DNI
  const currentDni = watch('dni');
  const { data: dniCheck, isFetching: isDniChecking } = useCheckDni(currentDni);

  // Consulta debounced de unicidad de email (Issue P2-8)
  const currentEmail = watch('email');
  const { data: emailCheck, isFetching: isEmailChecking } = useCheckEmail(currentEmail);

  // Validacion client-side del DNI (para el icono inline)
  const dniClientValidation = useMemo(() => {
    const value = currentDni.trim();
    if (!value) return null;
    return validateIdentityDocument(value);
  }, [currentDni]);

  // Edad calculada a partir de la fecha de nacimiento
  const currentBirthDate = watch('birthDate');
  const computedAge = useMemo(() => {
    if (!currentBirthDate) return null;
    // Mantine 8 DateInput devuelve string "YYYY-MM-DD" en onChange
    const dateStr = typeof currentBirthDate === 'string' ? currentBirthDate : '';
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const isoStr = date.toISOString().split('T')[0];
    const age = calculateAge(isoStr);
    return age >= 0 ? age : null;
  }, [currentBirthDate]);

  // Indicador visual del campo DNI (derecha del input)
  const dniRightSection = useMemo(() => {
    const value = currentDni.trim();
    if (!value) return undefined;

    // Si el formato es invalido, no mostrar nada extra (el error ya lo indica el form)
    if (!dniClientValidation?.valid) return undefined;

    // Si esta consultando la API
    if (isDniChecking) {
      return <Loader size="xs" color="brand" />;
    }

    // Si la API confirmo que existe
    if (dniCheck?.exists) {
      return (
        <Text c="red" size="xs" fw={600}>
          &#10007;
        </Text>
      );
    }

    // Si la API confirmo que no existe (disponible)
    if (dniCheck && !dniCheck.exists) {
      return (
        <Text c="green" size="xs" fw={600}>
          &#10003;
        </Text>
      );
    }

    return undefined;
  }, [currentDni, dniClientValidation, isDniChecking, dniCheck]);

  // Indicador visual del campo email (derecha del input) — Issue P2-8
  const emailRightSection = useMemo(() => {
    const value = currentEmail.trim();
    if (!value || !/^\S+@\S+\.\S+$/.test(value)) return undefined;

    if (isEmailChecking) {
      return <Loader size="xs" color="brand" />;
    }

    if (emailCheck?.exists) {
      return (
        <Text c="orange" size="xs" fw={600}>
          ⚠
        </Text>
      );
    }

    return undefined;
  }, [currentEmail, isEmailChecking, emailCheck]);

  // Notificar al padre cada vez que cambia la validez del formulario
  const watchedDni = watch('dni');
  const watchedFirstName = watch('firstName');
  const watchedLastName = watch('lastName');
  const watchedBirthDate = watch('birthDate');
  const watchedEmail = watch('email');
  const watchedPhone = watch('phone');
  const watchedAddress = watch('address');
  const watchedPostalCode = watch('postalCode');
  const watchedCity = watch('city');

  useEffect(() => {
    const hasRequiredFields =
      watchedDni.trim() !== '' &&
      watchedFirstName.trim() !== '' &&
      watchedLastName.trim() !== '' &&
      watchedBirthDate !== null &&
      watchedBirthDate !== '' &&
      watchedEmail.trim() !== '';

    const hasNoFormErrors = Object.keys(errors).length === 0;

    const dniIsValid = dniClientValidation?.valid === true;

    const dniNotDuplicate = dniCheck ? !dniCheck.exists : false;

    const emailValid = /^\S+@\S+\.\S+$/.test(watchedEmail);

    const postalCodeValid = !watchedPostalCode || /^\d{5}$/.test(watchedPostalCode);

    if (
      hasRequiredFields &&
      hasNoFormErrors &&
      dniIsValid &&
      dniNotDuplicate &&
      emailValid &&
      postalCodeValid
    ) {
      const birthDateIso = watchedBirthDate ?? '';
      const personalData: PersonalData = {
        dni: watchedDni.trim(),
        firstName: watchedFirstName.trim(),
        lastName: watchedLastName.trim(),
        birthDate: birthDateIso,
        email: watchedEmail.trim(),
        phone: watchedPhone.trim() || null,
        address: watchedAddress.trim() || null,
        postalCode: watchedPostalCode.trim() || null,
        city: watchedCity.trim() || null,
      };
      onValidChange(personalData);
    } else {
      onValidChange(null);
    }
  }, [
    watchedDni,
    watchedFirstName,
    watchedLastName,
    watchedBirthDate,
    watchedEmail,
    watchedPhone,
    watchedAddress,
    watchedPostalCode,
    watchedCity,
    errors,
    dniClientValidation?.valid,
    dniCheck,
    onValidChange,
  ]);

  return (
    <Stack gap="md">
      {/* Alerta de DNI duplicado */}
      {dniCheck?.exists && (
        <Alert color="red" title={t('registration.personalDataStep.dniDuplicateTitle')}>
          {t('registration.personalDataStep.dniDuplicateText', {
            dni: currentDni,
            name: dniCheck.memberName,
            number: dniCheck.memberNumber,
          })}
        </Alert>
      )}

      {/* DNI/NIE */}
      <TextInput
        label={t('registration.personalDataStep.dniLabel')}
        placeholder={t('registration.personalDataStep.dniPlaceholder')}
        required
        rightSection={dniRightSection}
        {...register('dni', {
          onBlur: () => trigger('dni'),
        })}
        error={errors.dni?.message}
      />

      {/* Nombre y apellidos */}
      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label={t('registration.personalDataStep.firstNameLabel')}
            placeholder={t('registration.personalDataStep.firstNamePlaceholder')}
            required
            {...register('firstName')}
            error={errors.firstName?.message}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label={t('registration.personalDataStep.lastNameLabel')}
            placeholder={t('registration.personalDataStep.lastNamePlaceholder')}
            required
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </Grid.Col>
      </Grid>

      {/* Fecha de nacimiento con edad calculada — Issue P1-1: DateInput nativo de Mantine */}
      <Group align="flex-end" gap="sm">
        <Controller
          name="birthDate"
          control={control}
          render={({ field, fieldState }) => (
            <DateInput
              label={t('registration.personalDataStep.birthDateLabel')}
              placeholder={t('registration.personalDataStep.birthDatePlaceholder')}
              required
              valueFormat="DD/MM/YYYY"
              locale="es"
              maxDate={getToday()}
              clearable
              style={{ flex: 1 }}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        {computedAge !== null && (
          <Text size="sm" c="dimmed" pb={8}>
            ({computedAge}{' '}
            {computedAge === 1
              ? t('registration.personalDataStep.ageYearSingular')
              : t('registration.personalDataStep.ageYearPlural')}
            )
          </Text>
        )}
      </Group>

      {/* Email — Issue P2-8: consulta de unicidad */}
      <TextInput
        type="email"
        label={t('registration.personalDataStep.emailLabel')}
        placeholder={t('registration.personalDataStep.emailPlaceholder')}
        required
        rightSection={emailRightSection}
        {...register('email')}
        error={errors.email?.message}
      />
      {emailCheck?.exists && (
        <Alert color="yellow" variant="light">
          {t('registration.personalDataStep.emailDuplicateWarning')}
        </Alert>
      )}

      {/* Telefono */}
      <TextInput
        label={t('registration.personalDataStep.phoneLabel')}
        placeholder={t('registration.personalDataStep.optionalPlaceholder')}
        {...register('phone')}
        error={errors.phone?.message}
      />

      {/* Direccion */}
      <TextInput
        label={t('registration.personalDataStep.addressLabel')}
        placeholder={t('registration.personalDataStep.optionalPlaceholder')}
        {...register('address')}
        error={errors.address?.message}
      />

      {/* Codigo postal y ciudad */}
      <Grid>
        <Grid.Col span={4}>
          <TextInput
            label={t('registration.personalDataStep.postalCodeLabel')}
            placeholder={t('registration.personalDataStep.postalCodePlaceholder')}
            {...register('postalCode')}
            error={errors.postalCode?.message}
          />
        </Grid.Col>
        <Grid.Col span={8}>
          <TextInput
            label={t('registration.personalDataStep.cityLabel')}
            placeholder={t('registration.personalDataStep.optionalPlaceholder')}
            {...register('city')}
            error={errors.city?.message}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
