/**
 * Formatea centavos (enteros) a formato de moneda española.
 * Backend envía importes como enteros en centavos.
 * @example formatMoney(34500) → "345,00 €"
 */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
