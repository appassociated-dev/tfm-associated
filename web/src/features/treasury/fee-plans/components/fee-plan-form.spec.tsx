import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';

import { FeePlanForm } from './fee-plan-form';

// === Helpers ===

function TestWrapper({ children }: { children: React.ReactNode }) {
  return createElement(MantineProvider, null, children);
}

/** Renderiza el formulario con las props indicadas. */
function renderForm(props: Partial<Parameters<typeof FeePlanForm>[0]> = {}) {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    ...props,
  };

  return render(createElement(FeePlanForm, defaultProps), { wrapper: TestWrapper });
}

/** Simula input nativo que dispara onChange del componente controlado. */
function setNativeInputValue(input: HTMLElement, value: string) {
  fireEvent.input(input, { target: { value } });
  fireEvent.change(input, { target: { value } });
}

// === Tests ===

describe('FeePlanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deberia renderizar todos los campos obligatorios', () => {
    renderForm();

    // Codigo
    expect(screen.getByPlaceholderText('Ej: CUOTA-ANUAL')).toBeInTheDocument();
    // Nombre
    expect(screen.getByPlaceholderText('Ej: Cuota anual de socio')).toBeInTheDocument();
    // Tipo de plan (SegmentedControl con opciones)
    expect(screen.getByText('Tipo de plan')).toBeInTheDocument();
    expect(screen.getByText('Periódico')).toBeInTheDocument();
    expect(screen.getByText('Cuota Única')).toBeInTheDocument();
    // Importe
    expect(screen.getByLabelText('Importe')).toBeInTheDocument();
    // Boton guardar
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });

  it('deberia mostrar campos de frecuencia y meses cuando el tipo es RECURRING', () => {
    renderForm();

    // Por defecto el tipo es RECURRING — debe mostrar periodicidad y meses
    // Mantine Select renderiza label + dropdown, usar getByText para la etiqueta
    expect(screen.getByText('Periodicidad')).toBeInTheDocument();
    expect(screen.getByText('Meses de facturación')).toBeInTheDocument();
  });

  it('deberia ocultar campos de frecuencia y meses cuando el tipo es ONE_TIME', () => {
    renderForm({
      initialValues: {
        type: 'ONE_TIME',
        code: 'INSCRIPCION',
        name: 'Inscripcion',
        amount: 5000,
      },
    });

    // No debe mostrar periodicidad ni meses
    expect(screen.queryByLabelText('Periodicidad')).not.toBeInTheDocument();
    expect(screen.queryByText('Meses de facturación')).not.toBeInTheDocument();
  });

  it('deberia mostrar texto informativo con cantidad de cargos segun meses seleccionados', () => {
    renderForm();

    // Por defecto RECURRING+MONTHLY = 12 meses → 12 cargos
    expect(screen.getByText(/Se generarán 12 cargos al año/)).toBeInTheDocument();
  });

  it('deberia tener el campo codigo como readOnly cuando isEditing es true', () => {
    renderForm({
      isEditing: true,
      initialValues: { code: 'CUOTA-01' },
    });

    const codeInput = screen.getByPlaceholderText('Ej: CUOTA-ANUAL');
    expect(codeInput).toHaveAttribute('readonly');
  });

  it('deberia mostrar descripcion de solo lectura cuando isEditing es true', () => {
    renderForm({
      isEditing: true,
      initialValues: { code: 'CUOTA-01' },
    });

    expect(screen.getByText('El código no se puede modificar')).toBeInTheDocument();
  });

  it('deberia mostrar estado de carga en el boton cuando isSubmitting es true', () => {
    renderForm({ isSubmitting: true });

    const button = screen.getByText('Guardar').closest('button')!;
    // Mantine pone data-loading en el boton cuando loading=true
    expect(button).toHaveAttribute('data-loading');
  });

  it('deberia convertir euros a centavos al enviar (15.00 → 1500)', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({ onSubmit: mockSubmit });

    // Rellenar codigo
    const codeInput = screen.getByPlaceholderText('Ej: CUOTA-ANUAL');
    setNativeInputValue(codeInput, 'TEST');

    // Rellenar nombre
    const nameInput = screen.getByPlaceholderText('Ej: Cuota anual de socio');
    setNativeInputValue(nameInput, 'Plan Test');

    // Rellenar importe: 15.00 euros
    const amountInput = screen.getByLabelText('Importe');
    setNativeInputValue(amountInput, '15');

    // Enviar formulario
    const form = codeInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      const submittedData = mockSubmit.mock.calls[0][0];
      // 15 euros * 100 = 1500 centavos
      expect(submittedData.amount).toBe(1500);
      // Codigo en mayusculas
      expect(submittedData.code).toBe('TEST');
    });
  });

  it('deberia renderizar la descripcion como campo opcional', () => {
    renderForm();

    expect(screen.getByPlaceholderText('Descripción opcional del plan')).toBeInTheDocument();
  });
});
