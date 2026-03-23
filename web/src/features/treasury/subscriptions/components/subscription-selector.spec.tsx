import { describe, it, expect, vi, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@/test/helpers/render';
import { server } from '@/test/msw/server';
import { buildFeePlan, resetFeePlanCounters } from '@/test/factories';
import { apiResponse } from '@/test/msw/utils';

import { SubscriptionSelector } from './subscription-selector';

// === Helpers ===

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const samplePlans = [
  buildFeePlan({
    id: VALID_UUID,
    code: 'CUOTA-ANUAL',
    name: 'Cuota Anual',
    type: 'RECURRING',
    amount: 12000,
  }),
  buildFeePlan({
    id: '660e8400-e29b-41d4-a716-446655440001',
    code: 'INSCRIPCION',
    name: 'Inscripcion',
    type: 'ONE_TIME',
    amount: 5000,
  }),
];

function renderSelector(props: Partial<Parameters<typeof SubscriptionSelector>[0]> = {}) {
  const defaultProps = {
    memberTypeId: VALID_UUID,
    typeDiscount: null,
    onSelect: vi.fn(),
    ...props,
  };

  return render(<SubscriptionSelector {...defaultProps} />);
}

// === Tests ===

describe('SubscriptionSelector', () => {
  beforeEach(() => {
    resetFeePlanCounters();
    // Handler por defecto: devolver planes activos
    server.use(
      http.get('*/v1/treasury/fee-plans', () => {
        return HttpResponse.json(apiResponse(samplePlans));
      }),
    );
  });

  // --- Estado de carga ---

  describe('estado de carga', () => {
    it('deberia mostrar skeletons de carga cuando los planes estan cargando', () => {
      // Arrange: handler que nunca resuelve
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return new Promise(() => {});
        }),
      );

      // Act
      renderSelector();

      // Assert
      expect(screen.queryByText('Cuota Anual')).not.toBeInTheDocument();
      expect(screen.queryByText('Confirmar selección')).not.toBeInTheDocument();
    });
  });

  // --- Renderizado de tarjetas ---

  describe('renderizado de tarjetas de planes', () => {
    it('deberia mostrar tarjetas de planes cuando los datos estan disponibles', async () => {
      // Act
      renderSelector();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });
      expect(screen.getByText('Inscripcion')).toBeInTheDocument();
      expect(screen.getByText('Periódico')).toBeInTheDocument();
      expect(screen.getByText('Única')).toBeInTheDocument();
    });

    it('deberia mostrar importe con descuento por tipo en las tarjetas', async () => {
      // Act: renderizar con descuento por tipo del 30%
      renderSelector({ typeDiscount: 0.3 });

      // Assert
      await waitFor(() => {
        const discountLabels = screen.getAllByText(/Con dto\. tipo \(30%\)/);
        expect(discountLabels.length).toBeGreaterThan(0);
      });
    });

    it('deberia mostrar importe con descuento por tipo del 50% (triangulacion)', async () => {
      // Act
      renderSelector({ typeDiscount: 0.5 });

      // Assert
      await waitFor(() => {
        const discountLabels = screen.getAllByText(/Con dto\. tipo \(50%\)/);
        expect(discountLabels.length).toBeGreaterThan(0);
      });
    });

    it('deberia NO mostrar descuento cuando typeDiscount es null', async () => {
      // Act
      renderSelector({ typeDiscount: null });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Con dto\. tipo/)).not.toBeInTheDocument();
    });
  });

  // --- Seleccion de plan ---

  describe('seleccion de plan', () => {
    it('deberia mostrar el boton de confirmar deshabilitado cuando no hay plan seleccionado', async () => {
      // Act
      renderSelector();

      // Assert
      await waitFor(() => {
        const confirmButton = screen.getByText('Confirmar selección').closest('button')!;
        expect(confirmButton).toBeDisabled();
      });
    });

    it('deberia habilitar boton de confirmar al seleccionar un plan', async () => {
      // Act
      const { user } = renderSelector();

      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });

      // Act: click en la tarjeta del plan
      await user.click(screen.getByText('Cuota Anual'));

      // Assert
      const confirmButton = screen.getByText('Confirmar selección').closest('button')!;
      expect(confirmButton).not.toBeDisabled();
    });

    it('deberia mostrar badge "Seleccionado" tras hacer click en plan', async () => {
      // Act
      const { user } = renderSelector();

      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cuota Anual'));

      // Assert
      expect(screen.getByText('Seleccionado')).toBeInTheDocument();
    });

    it('deberia mostrar seccion de descuento personalizado al seleccionar plan', async () => {
      // Act
      const { user } = renderSelector();

      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Cuota Anual'));

      // Assert
      expect(screen.getByText('Descuento personalizado')).toBeInTheDocument();
      expect(screen.getByText('Porcentaje de descuento')).toBeInTheDocument();
    });

    it('deberia llamar onSelect con datos correctos al confirmar', async () => {
      // Arrange
      const mockOnSelect = vi.fn();
      const { user } = renderSelector({ onSelect: mockOnSelect });

      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });

      // Act: seleccionar plan y confirmar
      await user.click(screen.getByText('Cuota Anual'));
      await user.click(screen.getByText('Confirmar selección'));

      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          feePlanId: VALID_UUID,
          personalDiscount: null,
          personalDiscountReason: null,
        }),
      );
    });

    it('deberia llamar onSelect con descuento personalizado cuando se ingresa un porcentaje', async () => {
      // Arrange
      const mockOnSelect = vi.fn();
      const { user } = renderSelector({ onSelect: mockOnSelect });

      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });

      // Act: seleccionar plan
      await user.click(screen.getByText('Cuota Anual'));

      // Ingresar descuento personalizado
      const discountInput = screen.getByRole('textbox', { name: /porcentaje de descuento/i });
      await user.clear(discountInput);
      await user.type(discountInput, '15');

      // Ingresar motivo (requerido cuando hay descuento)
      await waitFor(() => {
        expect(screen.getByText('Motivo del descuento')).toBeInTheDocument();
      });
      const reasonInput = screen.getByPlaceholderText(/indique el motivo del descuento/i);
      await user.type(reasonInput, 'Descuento familiar');

      await user.click(screen.getByText('Confirmar selección'));

      // Assert
      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          feePlanId: VALID_UUID,
          personalDiscount: 0.15,
          personalDiscountReason: 'Descuento familiar',
        }),
      );
    });
  });

  // --- Estado de error ---

  describe('estado de error', () => {
    it('deberia mostrar alerta de error cuando falla la carga', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json({ message: 'Error' }, { status: 500 });
        }),
      );

      // Act
      renderSelector();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error al cargar planes')).toBeInTheDocument();
      });
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });

    it('deberia reintentar la carga al hacer click en Reintentar', async () => {
      // Arrange
      let callCount = 0;
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          callCount++;
          if (callCount === 1) {
            return HttpResponse.json({ message: 'Error' }, { status: 500 });
          }
          return HttpResponse.json(apiResponse(samplePlans));
        }),
      );

      // Act
      const { user } = renderSelector();

      await waitFor(() => {
        expect(screen.getByText('Error al cargar planes')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Reintentar'));

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });
    });

    it('deberia mostrar alerta de error con 503 (triangulacion)', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 });
        }),
      );

      // Act
      renderSelector();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Error al cargar planes')).toBeInTheDocument();
      });
    });
  });

  // --- Sin planes ---

  describe('sin planes disponibles', () => {
    it('deberia mostrar alerta cuando no hay planes disponibles', async () => {
      // Arrange
      server.use(
        http.get('*/v1/treasury/fee-plans', () => {
          return HttpResponse.json(apiResponse([]));
        }),
      );

      // Act
      renderSelector();

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Sin planes disponibles')).toBeInTheDocument();
      });
    });
  });

  // --- Validacion de descuento ---

  describe('validacion de descuento', () => {
    it('deberia mostrar error de motivo minimo cuando el motivo tiene menos de 3 caracteres', async () => {
      // Arrange
      const { user } = renderSelector();

      await waitFor(() => {
        expect(screen.getByText('Cuota Anual')).toBeInTheDocument();
      });

      // Act: seleccionar plan e ingresar descuento
      await user.click(screen.getByText('Cuota Anual'));
      const discountInput = screen.getByRole('textbox', { name: /porcentaje de descuento/i });
      await user.clear(discountInput);
      await user.type(discountInput, '10');

      // Motivo demasiado corto
      await waitFor(() => {
        expect(screen.getByText('Motivo del descuento')).toBeInTheDocument();
      });
      const reasonInput = screen.getByPlaceholderText(/indique el motivo del descuento/i);
      await user.type(reasonInput, 'ab');

      // Assert
      expect(screen.getByText('Mínimo 3 caracteres')).toBeInTheDocument();

      // Confirmar sigue deshabilitado
      const confirmButton = screen.getByText('Confirmar selección').closest('button')!;
      expect(confirmButton).toBeDisabled();
    });
  });
});
