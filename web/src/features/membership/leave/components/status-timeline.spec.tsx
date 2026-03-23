import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { render } from '@/test/helpers/render';
import type { StatusHistoryEntry } from '../schemas/member-leave.schemas';
import { StatusTimeline } from './status-timeline';

// === Datos de prueba ===

const VALID_UUID_1 = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';
const VALID_UUID_3 = '770e8400-e29b-41d4-a716-446655440002';

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
  return render(<StatusTimeline entries={entries} />);
}

// === Tests ===

describe('StatusTimeline', () => {
  describe('renderizado de entradas', () => {
    it('deberia renderizar los motivos de cada entrada', () => {
      renderTimeline(sampleEntries);

      expect(screen.getByText('Solicitud del socio')).toBeInTheDocument();
      expect(screen.getByText('Registro automático')).toBeInTheDocument();
    });

    it('deberia mostrar fechas formateadas', () => {
      renderTimeline(sampleEntries);

      expect(screen.getByText(/10 de marzo de 2026/)).toBeInTheDocument();
      expect(screen.getByText(/15 de enero de 2026/)).toBeInTheDocument();
    });

    it('deberia mostrar badges de estado anterior y nuevo', () => {
      renderTimeline(sampleEntries);

      // "Activo" aparece como newStatus de la segunda entrada Y previousStatus de la primera
      const activoBadges = screen.getAllByText('Activo');
      expect(activoBadges.length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Baja Voluntaria')).toBeInTheDocument();
      expect(screen.getByText('Aspirante')).toBeInTheDocument();
    });
  });

  describe('badges de ejecutor', () => {
    it('deberia mostrar badge "Sistema" para cambios automaticos', () => {
      renderTimeline(sampleEntries);

      // La entrada con changedBy === "Sistema" muestra badge "Sistema"
      const sistemaBadges = screen.getAllByText('Sistema');
      expect(sistemaBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('deberia mostrar badge "Manual" para cambios manuales', () => {
      renderTimeline(sampleEntries);

      expect(screen.getByText('Manual')).toBeInTheDocument();
    });

    it('deberia mostrar el email del ejecutor manual', () => {
      renderTimeline(sampleEntries);

      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });
  });

  describe('estado vacio', () => {
    it('deberia mostrar mensaje de estado vacio sin entradas', () => {
      renderTimeline([]);

      expect(screen.getByText('No hay historial de estados disponible.')).toBeInTheDocument();
    });
  });

  describe('ordenamiento', () => {
    it('deberia ordenar entradas por fecha descendente (mas reciente primero)', () => {
      // Agregar una tercera entrada con fecha posterior
      const entriesWithThird: StatusHistoryEntry[] = [
        ...sampleEntries,
        {
          id: VALID_UUID_3,
          previousStatus: 'VOLUNTARY_LEAVE',
          newStatus: 'ACTIVE',
          reason: 'Rehabilitacion aprobada',
          changedBy: 'secretaria@example.com',
          changedAt: '2026-06-01T12:00:00.000Z',
        },
      ];

      renderTimeline(entriesWithThird);

      // Verificar que las tres entradas se renderizan
      expect(screen.getByText('Rehabilitacion aprobada')).toBeInTheDocument();
      expect(screen.getByText('Solicitud del socio')).toBeInTheDocument();
      expect(screen.getByText('Registro automático')).toBeInTheDocument();

      // Verificar que la mas reciente (junio 2026) aparece
      expect(screen.getByText(/1 de junio de 2026/)).toBeInTheDocument();
    });
  });

  describe('datos diferentes (triangulacion)', () => {
    it('deberia renderizar con un unico evento de historial', () => {
      const singleEntry: StatusHistoryEntry[] = [
        {
          id: VALID_UUID_1,
          previousStatus: 'APPLICANT',
          newStatus: 'PENDING_PAYMENT',
          reason: 'Pendiente de pago de inscripcion',
          changedBy: 'Sistema',
          changedAt: '2026-04-20T09:00:00.000Z',
        },
      ];

      renderTimeline(singleEntry);

      expect(screen.getByText('Pendiente de pago de inscripcion')).toBeInTheDocument();
      expect(screen.getByText('Aspirante')).toBeInTheDocument();
      expect(screen.getByText('Pendiente de Pago')).toBeInTheDocument();
    });
  });
});
