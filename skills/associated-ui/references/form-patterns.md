# Patrones de Formularios — Associated

Lee este archivo al crear cualquier formulario en Associated. Los formularios son el punto de contacto más frecuente entre el usuario (voluntario) y el sistema. Cada clic innecesario o error confuso es tiempo robado a esa persona.

---

## 1. Stack de formularios

Toda la lógica de formularios usa este stack:

| Librería                  | Rol                                                                            |
| ------------------------- | ------------------------------------------------------------------------------ |
| `react-hook-form` 7.x     | Gestión de estado del form, submit, dirty state                                |
| `zod` 4.x                 | Definición y validación de schemas                                             |
| `@hookform/resolvers/zod` | Conecta Zod con RHF                                                            |
| `react-hook-form-mantine` | Wrappers que conectan componentes Mantine con `control` de RHF automáticamente |

No escribir formularios manualmente con `useState` por campo. No usar `class-validator` en el frontend.

---

## 2. Patrón base

```typescript
import { useForm } from 'react-hook-form';
import { TextInput, Select, NumberInput } from 'react-hook-form-mantine';
import { Button, Group, Stack } from '@mantine/core';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

const memberSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  email: z.string().email('validation.invalidEmail'),
  memberTypeId: z.string().min(1, 'validation.required'),
});

type MemberFormData = z.infer<typeof memberSchema>;

export function MemberForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: '', email: '', memberTypeId: '' },
    mode: 'onBlur', // Validación al perder foco
  });

  const mutation = useMutation({
    mutationFn: createMember,
    onSuccess: () => {
      notifications.show({
        title: t('common.success'),
        message: t('members.created'),
        color: 'teal',
        autoClose: 3000,
      });
      onSuccess();
    },
    onError: () => {
      notifications.show({
        title: t('common.errorOccurred'),
        message: t('members.createError'),
        color: 'red',
      });
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <Stack>
        <TextInput
          name="name"
          control={control}
          label={t('members.name')}
          placeholder={t('members.namePlaceholder')}
          withAsterisk
        />
        <TextInput
          name="email"
          control={control}
          label={t('members.email')}
          placeholder="email@ejemplo.com"
          withAsterisk
        />
        <Select
          name="memberTypeId"
          control={control}
          label={t('members.memberType')}
          placeholder={t('members.selectType')}
          data={memberTypes}
          withAsterisk
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>{t('common.cancel')}</Button>
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            {t('common.save')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
```

---

## 3. Reglas de validación

### 3.1 Modo de validación

Siempre `mode: 'onBlur'` — los errores aparecen al perder foco, no al escribir. Evita frustrar al usuario mientras escribe.

### 3.2 Mensajes de error

- Todos los mensajes de validación pasan por `react-i18next`.
- Los mensajes son descriptivos y accionables: "El email no tiene un formato válido" — no "Error de validación".
- El componente de error nativo de cada input Mantine los muestra automáticamente en rojo bajo el campo.

### 3.3 Schemas compartidos

Cuando el schema de validación del frontend coincide con el del backend, se comparte desde un paquete común o se documenta la equivalencia:

```typescript
// Schema compartido (o duplicado documentado)
const memberSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  dni: z.string().regex(/^\d{8}[A-Z]$/, 'validation.invalidDni'),
  iban: z
    .string()
    .regex(/^ES\d{22}$/, 'validation.invalidIban')
    .optional(),
});
```

### 3.4 Validaciones específicas del dominio

| Campo            | Validación       | Regex/Lógica            |
| ---------------- | ---------------- | ----------------------- |
| DNI español      | Formato + letra  | `^\d{8}[A-Z]$` + mod 23 |
| NIE              | Formato          | `^[XYZ]\d{7}[A-Z]$`     |
| IBAN español     | Formato          | `^ES\d{22}$`            |
| Email            | Formato estándar | `z.string().email()`    |
| Teléfono español | 9 dígitos        | `^\d{9}$`               |
| Código postal    | 5 dígitos        | `^\d{5}$`               |

---

## 4. Campos obligatorios y labels

- Todo campo obligatorio lleva `withAsterisk`.
- Todo input tiene `label` visible. No se usa `placeholder` como sustituto de label.
- Placeholders solo como ejemplo de formato: "email@ejemplo.com", "12345678A".
- Labels usan el tamaño por defecto de Mantine (`sm`).

---

## 5. Formularios multi-paso (wizard)

Para procesos complejos como alta de socio (datos personales → datos de contacto → cuota y pago):

```typescript
// Estado del wizard en Context
const WizardContext = createContext<WizardState>(null!);

// Cada paso valida antes de avanzar
const handleNext = async () => {
  const isValid = await trigger(); // trigger() de RHF valida el paso actual
  if (isValid) setStep(step + 1);
};
```

### Elementos obligatorios del wizard

1. **Barra de progreso:** "Paso 1 de 3" o `Stepper` de Mantine.
2. **Validación por paso:** no se avanza si el paso actual tiene errores.
3. **Botones Anterior/Siguiente:** siempre visibles. "Anterior" como `variant="default"`, "Siguiente" como `variant="filled"`.
4. **Resumen final:** último paso muestra resumen de todos los datos antes de confirmar.
5. **Submit solo en el último paso.**

---

## 6. Formularios de edición

Para editar una entidad existente:

```typescript
const { data: member } = useQuery({ queryKey: ['member', id], queryFn: () => fetchMember(id) });

const { control, handleSubmit, reset } = useForm<MemberFormData>({
  resolver: zodResolver(memberSchema),
  defaultValues: { name: '', email: '' },
});

// Rellenar con datos del servidor cuando lleguen
useEffect(() => {
  if (member) reset(member);
}, [member, reset]);
```

---

## 7. Acciones destructivas

Toda acción destructiva (eliminar socio, anular pago, cancelar inscripción) requiere confirmación modal:

```typescript
<ConfirmDeleteModal
  opened={deleteModalOpened}
  onClose={closeDeleteModal}
  onConfirm={() => deleteMutation.mutate(memberId)}
  entityName={member.fullName}
  loading={deleteMutation.isPending}
/>
```

El botón de eliminación siempre usa `color="red"`. El texto del modal es preciso: "¿Eliminar a Juan García López?" — no "¿Estás seguro?".

---

## 8. Formularios en modal vs drawer

| Criterio | Modal                 | Drawer                 |
| -------- | --------------------- | ---------------------- |
| Campos   | 3-5 campos simples    | 6+ campos o con tabs   |
| Ejemplo  | Cambiar tipo de socio | Alta completa de socio |
| Posición | Centrado              | Derecha, anchura `lg`  |

---

## 9. Formateo de inputs

### Importes

El backend trabaja en centavos. El input muestra euros con decimales. La conversión se hace al enviar y al recibir:

```typescript
// Al enviar: euros → centavos
const amountCents = Math.round(formData.amount * 100);

// Al recibir: centavos → euros
reset({ amount: data.amountCents / 100 });
```

### Fechas

Los `DateInput` de Mantine usan `YYYY-MM-DD` internamente. El formateo visual a español se hace en la capa de presentación, no en el valor del input.

---

## 10. Accesibilidad en formularios

- `aria-describedby` para mensajes de error (Mantine lo gestiona automáticamente).
- Validación en tiempo real con feedback visual y sonoro (screen readers).
- `htmlFor` en labels (Mantine lo gestiona con la prop `label`).
- Focus management: al mostrar un error de validación, el focus va al primer campo con error.
- Tab order lógico: los campos se recorren en orden visual.
