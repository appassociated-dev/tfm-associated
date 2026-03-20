import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';

import type { StatusHistoryEntry } from '../schemas/member-leave.schemas';
import { StatusTimeline } from './status-timeline';

// === Datos de prueba ===

const VALID_UUID_1 = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';

const sampleEntries: StatusHistoryEntry[] = [
  {
    id: VALID_UUID_1,
    previousStatus: 'ACTIVE',
    newStatus: 'VOLUNTARY_LEAVE',
    reason: 'Solicitud del socio',
    changedBy: 'admin@example.com',
    changedAt: '2026-03-10T10:00:00.000Z',
  },
  {
    id: VALID_UUID_2,
    previousStatus: 'APPLICANT',
    newStatus: 'ACTIVE',
    reason: 'Registro automático',
    changedBy: 'Sistema',
    changedAt: '2026-01-15T08:30:00.000Z',
  },
];

// === Helpers ===

function renderTimeline(entries: StatusHistoryEntry[]) {
  return render(createElement(StatusTimeline, { entries }), {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      createElement(MantineProvider, null, children),
  });
}

// === Tests ===

describe('StatusTimeline', () => {
  it('deberia renderizar las entradas del historial', () => {
    renderTimeline(sampleEntries);

    // Verificar que se muestran los motivos de cada entrada
    expect(screen.getByText('Solicitud del socio')).toBeInTheDocument();
    expect(screen.getByText('Registro automático')).toBeInTheDocument();
  });

  it('deberia mostrar fechas formateadas', () => {
    renderTimeline(sampleEntries);

    // formatDateLong produce formato "10 de marzo de 2026"
    expect(screen.getByText(/10 de marzo de 2026/)).toBeInTheDocument();
    expect(screen.getByText(/15 de enero de 2026/)).toBeInTheDocument();
  });

  it('deberia mostrar badge "Sistema" para cambios del sistema', () => {
    renderTimeline(sampleEntries);

    // La entrada con changedBy === "Sistema" muestra badge "Sistema"
    const sistemaBadges = screen.getAllByText('Sistema');
    // Se renderiza el badge y ademas el texto del changedBy
    expect(sistemaBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('deberia mostrar badge "Manual" para cambios manuales', () => {
    renderTimeline(sampleEntries);

    // La entrada con changedBy !== "Sistema" muestra badge "Manual"
    expect(screen.getByText('Manual')).toBeInTheDocument();
  });

  it('deberia mostrar mensaje de estado vacio sin entradas', () => {
    renderTimeline([]);

    expect(screen.getByText('No hay historial de estados disponible.')).toBeInTheDocument();
  });

  it('deberia mostrar badges de estado anterior y nuevo', () => {
    renderTimeline(sampleEntries);

    // "Activo" aparece como newStatus de la segunda entrada Y previousStatus de la primera
    // por lo que hay multiples coincidencias → usamos getAllByText
    const activoBadges = screen.getAllByText('Activo');
    expect(activoBadges.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Baja Voluntaria')).toBeInTheDocument();
    expect(screen.getByText('Aspirante')).toBeInTheDocument();
  });
});
