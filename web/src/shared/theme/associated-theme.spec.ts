import { describe, it, expect } from 'vitest';
import { associatedTheme } from './associated-theme';

describe('associatedTheme', () => {
  // Smoke tests para verificar la estructura del tema de Mantine

  it('deberia exportar associatedTheme como objeto definido', () => {
    expect(associatedTheme).toBeDefined();
  });

  it('deberia usar brand como color primario', () => {
    expect(associatedTheme.primaryColor).toBe('brand');
  });

  it('deberia configurar primaryShade con light: 7, dark: 5', () => {
    expect(associatedTheme.primaryShade).toEqual({ light: 7, dark: 5 });
  });

  it('deberia definir brandDark en other como #27343E', () => {
    expect(associatedTheme.other?.brandDark).toBe('#27343E');
  });

  it('deberia definir paleta brand con 10 shades', () => {
    expect(associatedTheme.colors?.brand).toHaveLength(10);
  });

  it('deberia incluir Inter en fontFamily', () => {
    expect(associatedTheme.fontFamily).toContain('Inter');
  });

  it('deberia definir spacing con claves xs, sm, md, lg, xl', () => {
    const spacing = associatedTheme.spacing;

    expect(spacing).toHaveProperty('xs');
    expect(spacing).toHaveProperty('sm');
    expect(spacing).toHaveProperty('md');
    expect(spacing).toHaveProperty('lg');
    expect(spacing).toHaveProperty('xl');
  });

  it('deberia definir al menos 11 componentes con defaults', () => {
    const components = associatedTheme.components;
    const expectedComponents = [
      'Button',
      'Paper',
      'Card',
      'Badge',
      'TextInput',
      'Select',
      'Table',
      'Notification',
      'Modal',
      'SegmentedControl',
      'Skeleton',
    ];

    expectedComponents.forEach((name) => {
      expect(components).toHaveProperty(name);
    });

    expect(Object.keys(components!).length).toBeGreaterThanOrEqual(11);
  });

  it('deberia tener autoContrast activado', () => {
    expect(associatedTheme.autoContrast).toBe(true);
  });

  it('deberia usar cursor tipo pointer', () => {
    expect(associatedTheme.cursorType).toBe('pointer');
  });
});
