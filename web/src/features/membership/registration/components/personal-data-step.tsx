import { useEffect, useMemo } from 'react';
import { Alert, Grid, Group, Loader, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

import { useCheckDni } from '../hooks/use-check-dni';
import { validateIdentityDocument, calculateAge } from '../utils/dni-validator';
import type { PersonalData } from '../schemas/member-registration.schemas';

// === Tipos ===

interface PersonalDataStepProps {
  initialValues?: PersonalData;
  onValidChange: (data: PersonalData | null) => void;
}

// === Constantes ===

/** Fecha maxima seleccionable: hoy en formato yyyy-MM-dd. */
function getTodayIso(): string {
  return new Date().toISOString().split('T')[0];
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
      birthDate: initialValues?.birthDate ?? '',
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
        if (isNaN(Date.parse(value))) return 'Fecha invalida';
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
    const age = calculateAge(currentBirthDate);
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

  // Notificar al padre cada vez que cambia la validez del formulario
  const values = form.getValues();
  const errors = form.errors;

  useEffect(() => {
    // Validar todos los campos requeridos
    const hasRequiredFields =
      values.dni.trim() !== '' &&
      values.firstName.trim() !== '' &&
      values.lastName.trim() !== '' &&
      values.birthDate !== '' &&
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
      const personalData: PersonalData = {
        dni: values.dni.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        birthDate: values.birthDate,
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

      {/* Fecha de nacimiento con edad calculada */}
      <Group align="flex-end" gap="sm">
        <TextInput
          type="date"
          label="Fecha de nacimiento"
          required
          max={getTodayIso()}
          style={{ flex: 1 }}
          key={form.key('birthDate')}
          {...form.getInputProps('birthDate')}
        />
        {computedAge !== null && (
          <Text size="sm" c="dimmed" pb={8}>
            ({computedAge} {computedAge === 1 ? 'ano' : 'anos'})
          </Text>
        )}
      </Group>

      {/* Email */}
      <TextInput
        type="email"
        label="Email"
        placeholder="correo@ejemplo.com"
        required
        key={form.key('email')}
        {...form.getInputProps('email')}
      />

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
