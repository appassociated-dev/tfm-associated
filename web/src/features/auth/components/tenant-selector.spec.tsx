import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { TenantSelector, type TenantSelectorProps } from './tenant-selector';

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

function TestWrapper({ children }: { children: React.ReactNode }) {
  return createElement(MantineProvider, null, children);
}

function renderTenantSelector(overrides: Partial<TenantSelectorProps> = {}) {
  const defaultProps: TenantSelectorProps = {
    tenants: mockTenants,
    onSelect: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return {
    ...render(createElement(TenantSelector, defaultProps), {
      wrapper: TestWrapper,
    }),
    props: defaultProps,
  };
}

// === Tests ===

describe('TenantSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('deberia renderizar el titulo y descripcion', () => {
    renderTenantSelector();

    expect(screen.getByText('Selecciona una colectividad')).toBeInTheDocument();
    expect(
      screen.getByText('Perteneces a varias colectividades. Elige a cuál quieres acceder.'),
    ).toBeInTheDocument();
  });

  it('deberia renderizar cards con nombre, slug y badge de rol', () => {
    renderTenantSelector();

    // Primer tenant
    expect(screen.getByText('Club Deportivo Espanol')).toBeInTheDocument();
    expect(screen.getByText('club-deportivo')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();

    // Segundo tenant
    expect(screen.getByText('Asociacion Cultural Gallega')).toBeInTheDocument();
    expect(screen.getByText('asociacion-gallega')).toBeInTheDocument();
    expect(screen.getByText('member')).toBeInTheDocument();
  });

  it('deberia llamar a onSelect con el tenantId correcto al hacer click', () => {
    const onSelect = vi.fn().mockResolvedValue(undefined);
    renderTenantSelector({ onSelect });

    fireEvent.click(screen.getByText('Club Deportivo Espanol'));

    expect(onSelect).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('deberia mostrar badge "Ultima sesion" para el ultimo tenant seleccionado', () => {
    // Simular que previamente se selecciono el primer tenant
    localStorage.setItem('associated_last_tenant', '550e8400-e29b-41d4-a716-446655440000');

    renderTenantSelector();

    expect(screen.getByText('Última sesión')).toBeInTheDocument();
  });
});
