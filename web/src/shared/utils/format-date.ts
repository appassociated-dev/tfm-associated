/**
 * Formatea fecha en formato largo español.
 * @example formatDateLong(new Date('2026-03-08')) → "8 de marzo de 2026"
 */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Formatea fecha en formato compacto español (dd/MM/yyyy).
 * @example formatDateCompact(new Date('2026-03-08')) → "08/03/2026"
 */
export function formatDateCompact(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
