import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../app';

// Mock de los proveedores pesados para aislar el test del componente App
vi.mock('../providers', () => ({
  AppProviders: () => <div data-testid="app-providers">App cargada</div>,
}));

describe('App', () => {
  it('debería renderizar sin errores', () => {
    render(<App />);

    expect(screen.getByTestId('app-providers')).toBeInTheDocument();
  });

  it('debería renderizar el componente AppProviders', () => {
    render(<App />);

    expect(screen.getByText('App cargada')).toBeInTheDocument();
  });
});
