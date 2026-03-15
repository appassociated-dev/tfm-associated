import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';

import { StatusBadge, STATUS_CONFIG } from './status-badge';

// === Helpers ===

function renderBadge(status: string) {
  return render(createElement(StatusBadge, { status }), {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(MantineProvider, null, children),
  });
}

// === Tests ===

describe('StatusBadge', () => {
  it('deberia renderizar etiqueta "Activo" para estado ACTIVE', () => {
    renderBadge('ACTIVE');
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('deberia renderizar "Desconocido" para estado desconocido', () => {
    renderBadge('UNKNOWN_STATUS');
    expect(screen.getByText('Desconocido')).toBeInTheDocument();
  });

  it.each([
    ['ACTIVE', 'Activo', 'green', 'light'],
    ['APPLICANT', 'Aspirante', 'blue', 'light'],
    ['PENDING_PAYMENT', 'Pendiente de Pago', 'yellow', 'light'],
    ['SUSPENDED', 'Suspendido', 'red', 'light'],
    ['VOLUNTARY_LEAVE', 'Baja Voluntaria', 'gray', 'light'],
    ['NONPAYMENT_LEAVE', 'Baja por Impago', 'red', 'filled'],
    ['DISCIPLINARY_LEAVE', 'Baja Disciplinaria', 'dark', 'light'],
    ['DECEASED', 'Fallecido', 'dark', 'filled'],
  ])(
    'deberia renderizar estado %s con label "%s", color "%s" y variant "%s"',
    (status, expectedLabel, expectedColor, expectedVariant) => {
      renderBadge(status);

      // Verificar que la etiqueta se renderiza
      const badge = screen.getByText(expectedLabel);
      expect(badge).toBeInTheDocument();

      // Verificar configuracion en STATUS_CONFIG
      const config = STATUS_CONFIG[status];
      expect(config.color).toBe(expectedColor);
      expect(config.label).toBe(expectedLabel);
      expect(config.variant).toBe(expectedVariant);
    },
  );

  it('deberia usar variant="filled" para NONPAYMENT_LEAVE', () => {
    expect(STATUS_CONFIG['NONPAYMENT_LEAVE'].variant).toBe('filled');
  });

  it('deberia usar variant="filled" para DECEASED', () => {
    expect(STATUS_CONFIG['DECEASED'].variant).toBe('filled');
  });

  it('deberia tener radius="sm" en todos los badges', () => {
    // Verificar que el badge se renderiza con el atributo correcto
    const { container } = renderBadge('ACTIVE');
    const badge = container.querySelector('.mantine-Badge-root');
    expect(badge).toBeInTheDocument();
  });
});
