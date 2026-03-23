import { describe, it, expect } from 'vitest';
import { formatDateLong, formatDateCompact } from './format-date';

describe('formatDateLong', () => {
  // Formato largo español: "8 de marzo de 2026"

  it('deberia formatear 2026-03-08 con marzo y 2026', () => {
    const result = formatDateLong(new Date('2026-03-08'));

    expect(result).toContain('marzo');
    expect(result).toContain('2026');
    expect(result).toContain('8');
  });

  it('deberia formatear 2026-01-01 con enero y 2026', () => {
    const result = formatDateLong(new Date('2026-01-01'));

    expect(result).toContain('enero');
    expect(result).toContain('2026');
  });
});

describe('formatDateCompact', () => {
  // Formato compacto español: "dd/MM/yyyy"

  it('deberia formatear 2026-03-08 como 08/03/2026', () => {
    const result = formatDateCompact(new Date('2026-03-08'));

    expect(result).toContain('08');
    expect(result).toContain('03');
    expect(result).toContain('2026');
  });

  it('deberia formatear 2026-12-25 como 25/12/2026', () => {
    const result = formatDateCompact(new Date('2026-12-25'));

    expect(result).toContain('25');
    expect(result).toContain('12');
    expect(result).toContain('2026');
  });
});
