import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/helpers/render';

import { FeePlanForm } from './fee-plan-form';

// === Helpers ===

/**
 * Simula input nativo compatible con Mantine useForm uncontrolled mode.
 * Mantine con key={form.key(...)} usa uncontrolled — requiere fireEvent, no userEvent.type.
 */
function setNativeInputValue(input: HTMLElement, value: string) {
  fireEvent.input(input, { target: { value } });
  fireEvent.change(input, { target: { value } });
}

function renderForm(props: Partial<Parameters<typeof FeePlanForm>[0]> = {}) {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    ...props,
  };

  return render(<FeePlanForm {...defaultProps} />);
}

/** Enviar formulario usando el elemento form. */
function submitForm() {
  const form = document.querySelector('form')!;
  fireEvent.submit(form);
}

// === Tests ===

describe('FeePlanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Renderizado inicial ---

  describe('renderizado inicial', () => {
    it('deberia renderizar todos los campos obligatorios', () => {
      // Act
      renderForm();

      // Assert
      expect(screen.getByPlaceholderText('Ej: CUOTA-ANUAL')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ej: Cuota anual de socio')).toBeInTheDocument();
      expect(screen.getByText('Tipo de plan')).toBeInTheDocument();
      expect(screen.getByLabelText('Importe')).toBeInTheDocument();
      expect(screen.getByText('Guardar')).toBeInTheDocument();
    });

    it('deberia renderizar la descripcion como campo opcional', () => {
      // Act
      renderForm();

      // Assert
      expect(screen.getByPlaceholderText('Descripción opcional del plan')).toBeInTheDocument();
    });

    it('deberia renderizar SegmentedControl con opciones Periodico y Cuota Unica', () => {
      // Act
      renderForm();

      // Assert
      expect(screen.getByText('Periódico')).toBeInTheDocument();
      expect(screen.getByText('Cuota Única')).toBeInTheDocument();
    });
  });

  // --- Campos condicionales segun tipo ---

  describe('campos condicionales segun tipo de plan', () => {
    it('deberia mostrar campos de frecuencia y meses cuando el tipo es RECURRING (por defecto)', () => {
      // Act
      renderForm();

      // Assert
      expect(screen.getByText('Periodicidad')).toBeInTheDocument();
      expect(screen.getByText('Meses de facturación')).toBeInTheDocument();
    });

    it('deberia ocultar campos de frecuencia y meses cuando el tipo es ONE_TIME', () => {
      // Arrange
      renderForm({
        initialValues: {
          type: 'ONE_TIME',
          code: 'INSCRIPCION',
          name: 'Inscripcion',
          amount: 5000,
        },
      });

      // Assert
      expect(screen.queryByLabelText('Periodicidad')).not.toBeInTheDocument();
      expect(screen.queryByText('Meses de facturación')).not.toBeInTheDocument();
    });

    it('deberia mostrar texto informativo con cantidad de cargos segun meses seleccionados', () => {
      // Act: por defecto RECURRING+MONTHLY = 12 meses
      renderForm();

      // Assert
      expect(screen.getByText(/Se generarán 12 cargos al año/)).toBeInTheDocument();
    });

    it('deberia mostrar texto con 1 cargo para frecuencia ANNUAL (triangulacion)', () => {
      // Arrange
      renderForm({
        initialValues: {
          type: 'RECURRING',
          code: 'ANUAL',
          name: 'Anual',
          amount: 12000,
          frequency: 'ANNUAL',
          billingMonths: [1],
        },
      });

      // Assert
      expect(screen.getByText(/Se generarán 1 cargo al año/)).toBeInTheDocument();
    });

    it('deberia mostrar chips de meses (Ene a Dic) en modo RECURRING', () => {
      // Act
      renderForm();

      // Assert
      expect(screen.getByText('Ene')).toBeInTheDocument();
      expect(screen.getByText('Feb')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
      expect(screen.getByText('Dic')).toBeInTheDocument();
    });
  });

  // --- Modo edicion ---

  describe('modo edicion', () => {
    it('deberia tener el campo codigo como readOnly cuando isEditing es true', () => {
      // Arrange
      renderForm({
        isEditing: true,
        initialValues: { code: 'CUOTA-01' },
      });

      // Assert
      const codeInput = screen.getByPlaceholderText('Ej: CUOTA-ANUAL');
      expect(codeInput).toHaveAttribute('readonly');
    });

    it('deberia mostrar descripcion de solo lectura cuando isEditing es true', () => {
      // Arrange
      renderForm({
        isEditing: true,
        initialValues: { code: 'CUOTA-01' },
      });

      // Assert
      expect(screen.getByText('El código no se puede modificar')).toBeInTheDocument();
    });

    it('deberia NO mostrar descripcion de solo lectura cuando isEditing es false', () => {
      // Act
      renderForm({ isEditing: false });

      // Assert
      expect(screen.queryByText('El código no se puede modificar')).not.toBeInTheDocument();
    });

    it('deberia cargar valores iniciales en los campos cuando se proporcionan', () => {
      // Arrange
      renderForm({
        isEditing: true,
        initialValues: {
          code: 'CUOTA-EDIT',
          name: 'Cuota Editada',
          amount: 25000, // 250.00 EUR en centavos
          description: 'Descripcion del plan',
        },
      });

      // Assert
      const codeInput = screen.getByPlaceholderText('Ej: CUOTA-ANUAL') as HTMLInputElement;
      expect(codeInput.value).toBe('CUOTA-EDIT');
    });
  });

  // --- Estado de carga del boton ---

  describe('estado de carga', () => {
    it('deberia mostrar estado de carga en el boton cuando isSubmitting es true', () => {
      // Act
      renderForm({ isSubmitting: true });

      // Assert
      const button = screen.getByText('Guardar').closest('button')!;
      expect(button).toHaveAttribute('data-loading');
    });

    it('deberia NO mostrar estado de carga cuando isSubmitting es false', () => {
      // Act
      renderForm({ isSubmitting: false });

      // Assert
      const button = screen.getByText('Guardar').closest('button')!;
      expect(button).not.toHaveAttribute('data-loading');
    });
  });

  // --- Conversion euros a centavos ---

  describe('conversion euros a centavos al enviar', () => {
    it('deberia convertir euros a centavos al enviar (15.00 -> 1500)', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      const codeInput = screen.getByPlaceholderText('Ej: CUOTA-ANUAL');
      setNativeInputValue(codeInput, 'TEST');
      const nameInput = screen.getByPlaceholderText('Ej: Cuota anual de socio');
      setNativeInputValue(nameInput, 'Plan Test');
      const amountInput = screen.getByLabelText('Importe');
      setNativeInputValue(amountInput, '15');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockSubmit.mock.calls[0][0];
        expect(submittedData.amount).toBe(1500);
        expect(submittedData.code).toBe('TEST');
      });
    });

    it('deberia convertir euros a centavos con triangulacion (250.50 -> 25050)', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'PLAN-B');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Plan B');
      setNativeInputValue(screen.getByLabelText('Importe'), '250.50');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const data = mockSubmit.mock.calls[0][0];
        expect(data.amount).toBe(25050);
      });
    });

    it('deberia convertir euros a centavos con segundo valor (0.99 -> 99)', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'MINIMO');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Minimo');
      setNativeInputValue(screen.getByLabelText('Importe'), '0.99');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const data = mockSubmit.mock.calls[0][0];
        expect(data.amount).toBe(99);
      });
    });
  });

  // --- Envio de datos ---

  describe('envio de datos', () => {
    it('deberia enviar codigo en mayusculas', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'minusculas');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Test');
      setNativeInputValue(screen.getByLabelText('Importe'), '10');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const data = mockSubmit.mock.calls[0][0];
        expect(data.code).toBe('MINUSCULAS');
      });
    });

    it('deberia enviar tipo RECURRING con frecuencia y meses', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'RECUR');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Recurrente');
      setNativeInputValue(screen.getByLabelText('Importe'), '100');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const data = mockSubmit.mock.calls[0][0];
        expect(data.type).toBe('RECURRING');
        expect(data.frequency).toBe('MONTHLY');
        expect(data.billingMonths).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      });
    });

    it('deberia enviar tipo ONE_TIME con frecuencia null y billingMonths vacio', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({
        onSubmit: mockSubmit,
        initialValues: {
          type: 'ONE_TIME',
          code: 'UNICA',
          name: 'Cuota Unica',
          amount: 5000,
        },
      });

      // Act
      submitForm();

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const data = mockSubmit.mock.calls[0][0];
        expect(data.type).toBe('ONE_TIME');
        expect(data.frequency).toBeNull();
        expect(data.billingMonths).toEqual([]);
      });
    });

    it('deberia enviar description como null cuando esta vacia', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'NODESC');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Sin desc');
      setNativeInputValue(screen.getByLabelText('Importe'), '50');
      // No escribimos nada en la descripcion
      submitForm();

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const data = mockSubmit.mock.calls[0][0];
        expect(data.description).toBeNull();
      });
    });
  });

  // --- Validacion de formulario ---

  describe('validacion de formulario', () => {
    it('deberia mostrar error de validacion cuando el codigo esta vacio', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act: enviar sin llenar codigo
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Plan');
      setNativeInputValue(screen.getByLabelText('Importe'), '10');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('El código es obligatorio')).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('deberia mostrar error de validacion cuando el nombre esta vacio', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act: enviar sin llenar nombre
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'TEST');
      setNativeInputValue(screen.getByLabelText('Importe'), '10');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('deberia mostrar error de validacion cuando el importe es 0', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'TEST');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Plan');
      // amountEuros por defecto es 0 => error
      submitForm();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('El importe mínimo es 0,01 €')).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('deberia mostrar error de codigo corto (1 caracter)', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'A');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Plan');
      setNativeInputValue(screen.getByLabelText('Importe'), '10');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Mínimo 2 caracteres')).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('deberia mostrar error de codigo con caracteres invalidos', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'PLAN @#$');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Plan');
      setNativeInputValue(screen.getByLabelText('Importe'), '10');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText('Solo caracteres alfanuméricos, guiones y guiones bajos'),
        ).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('deberia mostrar error de importe negativo', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'TEST');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Plan');
      setNativeInputValue(screen.getByLabelText('Importe'), '-5');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('El importe mínimo es 0,01 €')).toBeInTheDocument();
      });
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('deberia NO mostrar error cuando todos los campos son validos', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'PLAN-VALIDO');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Plan Valido');
      setNativeInputValue(screen.getByLabelText('Importe'), '25.50');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
      });
      expect(screen.queryByText('El código es obligatorio')).not.toBeInTheDocument();
      expect(screen.queryByText('El nombre es obligatorio')).not.toBeInTheDocument();
      expect(screen.queryByText('El importe mínimo es 0,01 €')).not.toBeInTheDocument();
    });
  });

  // --- Conversion centavos a euros al cargar ---

  describe('conversion centavos a euros al cargar valores iniciales', () => {
    it('deberia convertir centavos a euros en los valores iniciales (25000 centavos -> 250.00 EUR)', () => {
      // Arrange
      renderForm({
        isEditing: true,
        initialValues: {
          code: 'CUOTA-EDIT',
          name: 'Cuota Editada',
          amount: 25000,
        },
      });

      // Assert: el campo de importe deberia mostrar 250 (euros), no 25000 (centavos)
      const amountInput = screen.getByLabelText('Importe') as HTMLInputElement;
      expect(amountInput.value).toContain('250');
    });

    it('deberia convertir centavos a euros con decimales (9999 centavos -> 99.99 EUR)', () => {
      // Arrange
      renderForm({
        isEditing: true,
        initialValues: {
          code: 'CUOTA-DEC',
          name: 'Cuota Decimal',
          amount: 9999,
        },
      });

      // Assert
      const amountInput = screen.getByLabelText('Importe') as HTMLInputElement;
      expect(amountInput.value).toContain('99.99');
    });
  });

  // --- Envio con descripcion ---

  describe('envio con descripcion rellenada', () => {
    it('deberia enviar description cuando no esta vacia', async () => {
      // Arrange
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      renderForm({ onSubmit: mockSubmit });

      // Act
      setNativeInputValue(screen.getByPlaceholderText('Ej: CUOTA-ANUAL'), 'DESC');
      setNativeInputValue(screen.getByPlaceholderText('Ej: Cuota anual de socio'), 'Con Desc');
      setNativeInputValue(
        screen.getByPlaceholderText('Descripción opcional del plan'),
        'Esta es una descripcion',
      );
      setNativeInputValue(screen.getByLabelText('Importe'), '10');
      submitForm();

      // Assert
      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const data = mockSubmit.mock.calls[0][0];
        expect(data.description).toBe('Esta es una descripcion');
      });
    });
  });
});
