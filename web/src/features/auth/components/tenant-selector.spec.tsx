import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { render } from '@/test/helpers/render';
import { TenantSelector, type TenantSelectorProps } from './tenant-selector';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

// === Datos de prueba ===

const mockTenants: TenantSelectorProps['tenants'] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Club Deportivo Espanol',
    slug: 'club-deportivo',
    role: 'admin',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: 'Asociacion Cultural Gallega',
    slug: 'asociacion-gallega',
    role: 'member',
  },
];

// === Helpers ===

function renderTenantSelector(overrides: Partial<TenantSelectorProps> = {}) {
  const defaultProps: TenantSelectorProps = {
    tenants: mockTenants,
    onSelect: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return {
    ...render(<TenantSelector {...defaultProps} />),
    props: defaultProps,
  };
}

// === Tests ===

describe('TenantSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('renderizado', () => {
    it('deberia renderizar el titulo y descripcion', () => {
      renderTenantSelector();

      expect(screen.getByText('Selecciona una colectividad')).toBeInTheDocument();
      expect(
        screen.getByText('Perteneces a varias colectividades. Elige a cuál quieres acceder.'),
      ).toBeInTheDocument();
    });

    it('deberia renderizar cards con nombre y badge de rol', () => {
      renderTenantSelector();

      // Primer tenant
      expect(screen.getByText('Club Deportivo Espanol')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();

      // Segundo tenant
      expect(screen.getByText('Asociacion Cultural Gallega')).toBeInTheDocument();
      expect(screen.getByText('member')).toBeInTheDocument();
    });
  });

  describe('seleccion de tenant', () => {
    it('deberia llamar a onSelect con el tenantId correcto al hacer click en el primer tenant', async () => {
      const onSelect = vi.fn().mockResolvedValue(undefined);
      const { user } = renderTenantSelector({ onSelect });

      // Act: click en el primer tenant
      await user.click(screen.getByText('Club Deportivo Espanol'));

      // Assert
      expect(onSelect).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(onSelect).toHaveBeenCalledTimes(1);
    });

    it('deberia llamar a onSelect con el tenantId del segundo tenant (triangulacion)', async () => {
      const onSelect = vi.fn().mockResolvedValue(undefined);
      const { user } = renderTenantSelector({ onSelect });

      // Act: click en el segundo tenant
      await user.click(screen.getByText('Asociacion Cultural Gallega'));

      // Assert
      expect(onSelect).toHaveBeenCalledWith('660e8400-e29b-41d4-a716-446655440001');
    });

    it('deberia mostrar loader durante la seleccion y evitar doble click', async () => {
      // Arrange: onSelect que no resuelve inmediatamente
      let resolveSelect: (() => void) | undefined;
      const onSelect = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveSelect = resolve;
          }),
      );
      const { user } = renderTenantSelector({ onSelect });

      // Act: click en el primer tenant
      await user.click(screen.getByText('Club Deportivo Espanol'));

      // Assert: loader visible (Mantine Loader)
      const loader = document.querySelector('.mantine-Loader-root');
      expect(loader).toBeInTheDocument();

      // Act: intentar click en el segundo tenant durante carga
      await user.click(screen.getByText('Asociacion Cultural Gallega'));

      // Assert: solo un onSelect se ejecuto (doble click prevenido)
      expect(onSelect).toHaveBeenCalledTimes(1);

      // Cleanup
      resolveSelect?.();
    });

    it('deberia permitir reintentar si onSelect falla', async () => {
      const onSelect = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      const { user } = renderTenantSelector({ onSelect });

      // Act: primer click falla
      await user.click(screen.getByText('Club Deportivo Espanol'));

      // Esperar que el error se procese y el estado se limpie
      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledTimes(1);
      });

      // Act: segundo click deberia funcionar (estado liberado tras error)
      await user.click(screen.getByText('Club Deportivo Espanol'));

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('ultimo tenant seleccionado', () => {
    it('deberia mostrar badge "Ultima sesion" para el ultimo tenant seleccionado', () => {
      // Arrange: simular que previamente se selecciono el primer tenant
      localStorage.setItem(STORAGE_KEYS.LAST_TENANT, '550e8400-e29b-41d4-a716-446655440000');

      renderTenantSelector();

      expect(screen.getByText('Última sesión')).toBeInTheDocument();
    });

    it('deberia NO mostrar badge "Ultima sesion" si no hay historial', () => {
      // localStorage esta limpio (beforeEach)
      renderTenantSelector();

      expect(screen.queryByText('Última sesión')).not.toBeInTheDocument();
    });

    it('deberia persistir la seleccion en localStorage tras seleccionar un tenant', async () => {
      const onSelect = vi.fn().mockResolvedValue(undefined);
      const { user } = renderTenantSelector({ onSelect });

      // Act
      await user.click(screen.getByText('Club Deportivo Espanol'));

      // Assert: localStorage actualizado
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.LAST_TENANT)).toBe(
          '550e8400-e29b-41d4-a716-446655440000',
        );
      });
    });
  });
});
