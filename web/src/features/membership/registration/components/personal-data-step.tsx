import { useEffect, useMemo } from 'react';
import { Alert, Grid, Group, Loader, Stack, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';

import { useCheckDni } from '../hooks/use-check-dni';
import { useCheckEmail } from '../hooks/use-check-email';
import { validateIdentityDocument, calculateAge } from '../utils/dni-validator';
import type { PersonalData } from '../schemas/member-registration.schemas';

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
  const form = useForm({
    initialValues: {
      dni: initialValues?.dni ?? '',
      firstName: initialValues?.firstName ?? '',
      lastName: initialValues?.lastName ?? '',
      birthDate: initialValues?.birthDate
        ? new Date(initialValues.birthDate)
        : (null as Date | null),
      email: initialValues?.email ?? '',
      phone: initialValues?.phone ?? '',
      address: initialValues?.address ?? '',
      postalCode: initialValues?.postalCode ?? '',
      city: initialValues?.city ?? '',
    },
    validate: {
      dni: (value) => {
        if (!value.trim()) return 'DNI/NIE es obligatorio';
        const result = validateIdentityDocument(value);
        if (!result.valid) return result.error ?? 'Documento invalido';
        return null;
      },
      firstName: (value) => {
        if (!value.trim()) return 'Nombre es obligatorio';
        if (value.length > 100) return 'Maximo 100 caracteres';
        return null;
      },
      lastName: (value) => {
        if (!value.trim()) return 'Apellidos es obligatorio';
        if (value.length > 200) return 'Maximo 200 caracteres';
        return null;
      },
      birthDate: (value) => {
        if (!value) return 'Fecha de nacimiento es obligatoria';
        if (isNaN(value.getTime())) return 'Fecha invalida';
        return null;
      },
      email: (value) => {
        if (!value.trim()) return 'Email es obligatorio';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Email invalido';
        return null;
      },
      postalCode: (value) => {
        if (value && !/^\d{5}$/.test(value)) return 'Debe ser 5 digitos';
        return null;
      },
    },
  });

  // Consulta debounced de unicidad de DNI
  const currentDni = form.getValues().dni;
  const { data: dniCheck, isFetching: isDniChecking } = useCheckDni(currentDni);

  // Consulta debounced de unicidad de email (Issue P2-8)
  const currentEmail = form.getValues().email;
  const { data: emailCheck, isFetching: isEmailChecking } = useCheckEmail(currentEmail);

  // Validacion client-side del DNI (para el icono inline)
  const dniClientValidation = useMemo(() => {
    const value = currentDni.trim();
    if (!value) return null;
    return validateIdentityDocument(value);
  }, [currentDni]);

  // Edad calculada a partir de la fecha de nacimiento
  const currentBirthDate = form.getValues().birthDate;
  const computedAge = useMemo(() => {
    if (!currentBirthDate) return null;
    const date = currentBirthDate instanceof Date ? currentBirthDate : new Date(currentBirthDate);
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
  const values = form.getValues();
  const errors = form.errors;

  useEffect(() => {
    // Validar todos los campos requeridos
    const hasRequiredFields =
      values.dni.trim() !== '' &&
      values.firstName.trim() !== '' &&
      values.lastName.trim() !== '' &&
      values.birthDate !== null &&
      values.email.trim() !== '';

    // Validar que no hay errores activos del formulario
    const hasNoFormErrors = Object.keys(errors).length === 0;

    // Validar DNI client-side
    const dniIsValid = dniClientValidation?.valid === true;

    // Validar que el DNI no esta duplicado
    const dniNotDuplicate = dniCheck ? !dniCheck.exists : false;

    // Validar email basico
    const emailValid = /^\S+@\S+\.\S+$/.test(values.email);

    // Validar codigo postal si presente
    const postalCodeValid = !values.postalCode || /^\d{5}$/.test(values.postalCode);

    if (
      hasRequiredFields &&
      hasNoFormErrors &&
      dniIsValid &&
      dniNotDuplicate &&
      emailValid &&
      postalCodeValid
    ) {
      const bd = values.birthDate instanceof Date ? values.birthDate : new Date(values.birthDate);
      const birthDateIso = !isNaN(bd.getTime()) ? bd.toISOString().split('T')[0] : '';
      const personalData: PersonalData = {
        dni: values.dni.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        birthDate: birthDateIso,
        email: values.email.trim(),
        phone: values.phone.trim() || null,
        address: values.address.trim() || null,
        postalCode: values.postalCode.trim() || null,
        city: values.city.trim() || null,
      };
      onValidChange(personalData);
    } else {
      onValidChange(null);
    }
  }, [
    values.dni,
    values.firstName,
    values.lastName,
    values.birthDate,
    values.email,
    values.phone,
    values.address,
    values.postalCode,
    values.city,
    errors,
    dniClientValidation?.valid,
    dniCheck,
    onValidChange,
  ]);

  return (
    <Stack gap="md">
      {/* Alerta de DNI duplicado */}
      {dniCheck?.exists && (
        <Alert color="red" title="DNI duplicado">
          Ya existe socio con DNI {currentDni} ({dniCheck.memberName}, #{dniCheck.memberNumber})
        </Alert>
      )}

      {/* DNI/NIE */}
      <TextInput
        label="DNI/NIE"
        placeholder="12345678Z o X1234567L"
        required
        rightSection={dniRightSection}
        key={form.key('dni')}
        {...form.getInputProps('dni')}
        onBlur={() => {
          form.validateField('dni');
        }}
      />

      {/* Nombre y apellidos */}
      <Grid>
        <Grid.Col span={6}>
          <TextInput
            label="Nombre"
            placeholder="Nombre del aspirante"
            required
            key={form.key('firstName')}
            {...form.getInputProps('firstName')}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <TextInput
            label="Apellidos"
            placeholder="Apellidos del aspirante"
            required
            key={form.key('lastName')}
            {...form.getInputProps('lastName')}
          />
        </Grid.Col>
      </Grid>

      {/* Fecha de nacimiento con edad calculada — Issue P1-1: DateInput nativo de Mantine */}
      <Group align="flex-end" gap="sm">
        <DateInput
          label="Fecha de nacimiento"
          placeholder="dd/mm/aaaa"
          required
          valueFormat="DD/MM/YYYY"
          locale="es"
          maxDate={getToday()}
          clearable
          style={{ flex: 1 }}
          key={form.key('birthDate')}
          {...form.getInputProps('birthDate')}
        />
        {computedAge !== null && (
          <Text size="sm" c="dimmed" pb={8}>
            ({computedAge} {computedAge === 1 ? 'año' : 'años'})
          </Text>
        )}
      </Group>

      {/* Email — Issue P2-8: consulta de unicidad */}
      <TextInput
        type="email"
        label="Email"
        placeholder="correo@ejemplo.com"
        required
        rightSection={emailRightSection}
        key={form.key('email')}
        {...form.getInputProps('email')}
      />
      {emailCheck?.exists && (
        <Alert color="yellow" variant="light">
          Este email ya esta registrado en otro socio. El alta continuara, pero se recomienda
          verificar que no se trata de un duplicado.
        </Alert>
      )}

      {/* Telefono */}
      <TextInput
        label="Telefono"
        placeholder="Opcional"
        key={form.key('phone')}
        {...form.getInputProps('phone')}
      />

      {/* Direccion */}
      <TextInput
        label="Direccion"
        placeholder="Opcional"
        key={form.key('address')}
        {...form.getInputProps('address')}
      />

      {/* Codigo postal y ciudad */}
      <Grid>
        <Grid.Col span={4}>
          <TextInput
            label="Codigo postal"
            placeholder="28001"
            key={form.key('postalCode')}
            {...form.getInputProps('postalCode')}
          />
        </Grid.Col>
        <Grid.Col span={8}>
          <TextInput
            label="Ciudad"
            placeholder="Opcional"
            key={form.key('city')}
            {...form.getInputProps('city')}
          />
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
