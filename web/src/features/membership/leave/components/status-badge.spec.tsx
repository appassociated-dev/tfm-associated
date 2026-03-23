import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/test/helpers/render';
import { StatusBadge, STATUS_CONFIG } from './status-badge';

// === Helpers ===

function renderBadge(status: string) {
  return render(<StatusBadge status={status} />);
}

// === Tests ===

describe('StatusBadge', () => {
  describe('renderizado de etiquetas por estado', () => {
    it.each([
      ['ACTIVE', 'Activo'],
      ['APPLICANT', 'Aspirante'],
      ['PENDING_PAYMENT', 'Pendiente de Pago'],
      ['SUSPENDED', 'Suspendido'],
      ['VOLUNTARY_LEAVE', 'Baja Voluntaria'],
      ['NONPAYMENT_LEAVE', 'Baja por Impago'],
      ['DISCIPLINARY_LEAVE', 'Baja Disciplinaria'],
      ['DECEASED', 'Fallecido'],
    ])('deberia renderizar etiqueta "%s" como "%s"', (status, expectedLabel) => {
      renderBadge(status);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });

    it('deberia renderizar "Desconocido" para estado desconocido', () => {
      renderBadge('UNKNOWN_STATUS');
      expect(screen.getByText('Desconocido')).toBeInTheDocument();
    });

    it('deberia renderizar "Desconocido" para un segundo estado desconocido (triangulacion)', () => {
      renderBadge('INVENTED_STATE');
      expect(screen.getByText('Desconocido')).toBeInTheDocument();
    });
  });

  describe('configuracion visual (STATUS_CONFIG)', () => {
    it.each([
      ['ACTIVE', 'green', 'light'],
      ['APPLICANT', 'blue', 'light'],
      ['PENDING_PAYMENT', 'yellow', 'light'],
      ['SUSPENDED', 'red', 'light'],
      ['VOLUNTARY_LEAVE', 'gray', 'light'],
      ['NONPAYMENT_LEAVE', 'red', 'filled'],
      ['DISCIPLINARY_LEAVE', 'dark', 'light'],
      ['DECEASED', 'dark', 'filled'],
    ])(
      'deberia tener color "%s" y variant "%s" para estado %s',
      (status, expectedColor, expectedVariant) => {
        const config = STATUS_CONFIG[status];
        expect(config.color).toBe(expectedColor);
        expect(config.variant).toBe(expectedVariant);
      },
    );
  });

  describe('renderizado del badge de Mantine', () => {
    it('deberia renderizar un badge de Mantine con clase correcta', () => {
      const { container } = renderBadge('ACTIVE');
      const badge = container.querySelector('.mantine-Badge-root');
      expect(badge).toBeInTheDocument();
    });

    it('deberia renderizar el contenido de texto dentro del badge', () => {
      renderBadge('VOLUNTARY_LEAVE');

      // Verificar que el texto esta dentro de un badge
      const badgeText = screen.getByText('Baja Voluntaria');
      expect(badgeText.closest('.mantine-Badge-root')).toBeTruthy();
    });
  });
});
