import { useCallback, useState } from 'react';
import { useBlocker, useNavigate } from 'react-router';
import { Button, Group, Modal, Skeleton, Stack, Stepper, Text, Title } from '@mantine/core';

import { useMemberTypes } from '../hooks/use-member-types';
import { useSimpleRegistration } from '../hooks/use-simple-registration';
import type { PersonalData, RegistrationResponse } from '../schemas/member-registration.schemas';
import { PersonalDataStep } from '../components/personal-data-step';
import { MemberTypeStep } from '../components/member-type-step';
import { ConfirmationStep } from '../components/confirmation-step';

// === Tipos internos ===

interface WizardData {
  personalData: PersonalData | null;
  memberTypeId: string | null;
}

// === Componente ===

/**
 * Pagina del wizard de alta simple de socio (UC-011).
 * Stepper de 3 pasos: Datos Personales, Tipo de Socio, Confirmacion.
 * Mantiene estado del wizard en el componente padre y comunica validez
 * via callbacks de los componentes hijo.
 */
export function SimpleRegistrationPage() {
  const navigate = useNavigate();

  // Estado del wizard
  const [activeStep, setActiveStep] = useState(0);
  const [wizardData, setWizardData] = useState<WizardData>({
    personalData: null,
    memberTypeId: null,
  });
  const [stepValidity, setStepValidity] = useState({
    step0: false,
    step1: false,
  });

  // Resultado del alta exitosa (para el modal de exito)
  const [registrationResult, setRegistrationResult] = useState<RegistrationResponse | null>(null);

  // Datos de tipos de socio (necesarios para el paso 3 y precondicion)
  const { data: memberTypes, isLoading: isLoadingTypes } = useMemberTypes();

  // Mutacion de alta
  const registration = useSimpleRegistration();

  // Determinar si el wizard tiene datos (para useBlocker)
  const hasWizardData = wizardData.personalData !== null || wizardData.memberTypeId !== null;

  // Bloquear navegacion accidental cuando el wizard tiene datos
  useBlocker(
    useCallback(() => {
      if (hasWizardData && !registrationResult) {
        return !window.confirm('Tiene datos sin guardar en el formulario de alta. ¿Desea salir?');
      }
      return false;
    }, [hasWizardData, registrationResult]),
  );

  // === Callbacks de validez de pasos ===

  /** Callback del paso 1: datos personales validos o null. */
  function handleStep0ValidChange(data: PersonalData | null) {
    setWizardData((prev) => ({ ...prev, personalData: data }));
    setStepValidity((prev) => ({ ...prev, step0: data !== null }));
  }

  /** Callback del paso 2: tipo de socio seleccionado o null. */
  function handleStep1ValidChange(memberTypeId: string | null) {
    setWizardData((prev) => ({ ...prev, memberTypeId }));
    setStepValidity((prev) => ({ ...prev, step1: memberTypeId !== null }));
  }

  // === Navegacion del stepper ===

  function handleNext() {
    if (activeStep < 2) {
      setActiveStep((prev) => prev + 1);
    }
  }

  function handlePrevious() {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  }

  // === Confirmacion del alta ===

  async function handleConfirm() {
    if (!wizardData.personalData || !wizardData.memberTypeId) return;

    registration.mutate(
      {
        ...wizardData.personalData,
        memberTypeId: wizardData.memberTypeId,
      },
      {
        onSuccess: (data) => {
          setRegistrationResult(data);
        },
      },
    );
  }

  // === Reset del wizard (para "Dar de alta otro") ===

  function handleResetWizard() {
    setActiveStep(0);
    setWizardData({ personalData: null, memberTypeId: null });
    setStepValidity({ step0: false, step1: false });
    setRegistrationResult(null);
  }

  // === Determinar si el boton "Siguiente" esta habilitado ===

  function isNextDisabled(): boolean {
    if (activeStep === 0) return !stepValidity.step0;
    if (activeStep === 1) return !stepValidity.step1;
    return false;
  }

  // === Estado de carga de precondiciones ===

  if (isLoadingTypes) {
    return (
      <Stack gap="lg">
        <Skeleton height={30} width={200} />
        <Skeleton height={40} />
        <Skeleton height={300} radius="md" />
      </Stack>
    );
  }

  return (
    <>
      <Stack gap="lg">
        {/* Titulo */}
        <Title order={2}>Alta de Socio</Title>

        {/* Stepper */}
        <Stepper active={activeStep}>
          <Stepper.Step label="Datos Personales" description="Informacion del aspirante">
            <PersonalDataStep
              initialValues={wizardData.personalData ?? undefined}
              onValidChange={handleStep0ValidChange}
            />
          </Stepper.Step>

          <Stepper.Step label="Tipo de Socio" description="Seleccion de categoria">
            {wizardData.personalData && (
              <MemberTypeStep
                birthDate={wizardData.personalData.birthDate}
                onValidChange={handleStep1ValidChange}
              />
            )}
          </Stepper.Step>

          <Stepper.Step label="Confirmacion" description="Revision y alta">
            {wizardData.personalData && wizardData.memberTypeId && memberTypes && (
              <ConfirmationStep
                personalData={wizardData.personalData}
                memberTypeId={wizardData.memberTypeId}
                memberTypes={memberTypes}
                onConfirm={handleConfirm}
                isSubmitting={registration.isPending}
              />
            )}
          </Stepper.Step>
        </Stepper>

        {/* Botones de navegacion */}
        <Group justify="space-between">
          <Button variant="default" onClick={handlePrevious} disabled={activeStep === 0}>
            Anterior
          </Button>

          {activeStep < 2 && (
            <Button color="brand" onClick={handleNext} disabled={isNextDisabled()}>
              Siguiente
            </Button>
          )}
        </Group>
      </Stack>

      {/* Modal de exito */}
      <Modal
        opened={registrationResult !== null}
        onClose={() => {
          /* No cerrar con click fuera — forzar accion explicita */
        }}
        closeOnClickOutside={false}
        closeOnEscape={false}
        withCloseButton={false}
        title="Socio dado de alta"
        centered
      >
        {registrationResult && (
          <Stack gap="md">
            <Text size="lg" fw={600} ta="center">
              #{registrationResult.memberNumber}
            </Text>
            <Text size="sm" ta="center" c="dimmed">
              El socio ha sido registrado correctamente como{' '}
              <Text span fw={500}>
                {registrationResult.memberTypeName}
              </Text>
              .
            </Text>

            {registrationResult.registrationCharge && (
              <Text size="sm" ta="center" c="dimmed">
                Cargo de inscripcion generado ({registrationResult.registrationCharge.status}).
              </Text>
            )}

            <Group justify="center" gap="md" mt="md">
              <Button color="brand" variant="outline" onClick={handleResetWizard}>
                Dar de alta otro
              </Button>
              <Button
                color="brand"
                onClick={() => navigate(`/members/${registrationResult.memberId}`)}
              >
                Ver ficha
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
