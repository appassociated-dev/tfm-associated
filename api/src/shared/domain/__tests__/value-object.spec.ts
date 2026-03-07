import { describe, it, expect } from 'vitest';
import { ValueObject } from '../value-object.base';

// Implementación concreta para testing
type MoneyProps = {
  amount: number;
  currency: string;
  [key: string]: unknown;
};

class Money extends ValueObject<MoneyProps> {
  get amount(): number {
    return this.props.amount as number;
  }

  get currency(): string {
    return this.props.currency as string;
  }
}

// Implementación con propiedades anidadas
type AddressProps = {
  street: string;
  city: string;
  coordinates: { lat: number; lng: number };
  [key: string]: unknown;
};

class Address extends ValueObject<AddressProps> {}

describe('ValueObject', () => {
  // --- Igualdad ---

  it('debería ser igual a otro VO con las mismas propiedades', () => {
    const money1 = new Money({ amount: 100, currency: 'EUR' });
    const money2 = new Money({ amount: 100, currency: 'EUR' });

    expect(money1.equals(money2)).toBe(true);
  });

  it('debería ser diferente a otro VO con propiedades distintas', () => {
    const money1 = new Money({ amount: 100, currency: 'EUR' });
    const money2 = new Money({ amount: 200, currency: 'EUR' });

    expect(money1.equals(money2)).toBe(false);
  });

  it('debería ser diferente cuando cambia solo una propiedad', () => {
    const money1 = new Money({ amount: 100, currency: 'EUR' });
    const money2 = new Money({ amount: 100, currency: 'USD' });

    expect(money1.equals(money2)).toBe(false);
  });

  it('debería devolver false al comparar con undefined', () => {
    const money = new Money({ amount: 100, currency: 'EUR' });

    expect(money.equals(undefined)).toBe(false);
  });

  // --- Inmutabilidad ---

  it('debería congelar las propiedades (inmutabilidad)', () => {
    const money = new Money({ amount: 100, currency: 'EUR' });

    // Intentar mutar las propiedades debería fallar silenciosamente (Object.freeze)
    expect(() => {
      (money as unknown as { props: MoneyProps }).props.amount = 999;
    }).toThrow();

    expect(money.amount).toBe(100);
  });

  it('no debería permitir añadir nuevas propiedades al objeto congelado', () => {
    const money = new Money({ amount: 100, currency: 'EUR' });

    expect(() => {
      (money as unknown as { props: Record<string, unknown> }).props.extra =
        'hack';
    }).toThrow();
  });

  // --- Comparación profunda ---

  it('debería comparar propiedades anidadas por valor', () => {
    const addr1 = new Address({
      street: 'Calle Mayor 1',
      city: 'Madrid',
      coordinates: { lat: 40.4168, lng: -3.7038 },
    });
    const addr2 = new Address({
      street: 'Calle Mayor 1',
      city: 'Madrid',
      coordinates: { lat: 40.4168, lng: -3.7038 },
    });

    expect(addr1.equals(addr2)).toBe(true);
  });

  it('debería detectar diferencias en propiedades anidadas', () => {
    const addr1 = new Address({
      street: 'Calle Mayor 1',
      city: 'Madrid',
      coordinates: { lat: 40.4168, lng: -3.7038 },
    });
    const addr2 = new Address({
      street: 'Calle Mayor 1',
      city: 'Madrid',
      coordinates: { lat: 41.3851, lng: 2.1734 },
    });

    expect(addr1.equals(addr2)).toBe(false);
  });

  // --- Acceso a propiedades ---

  it('debería exponer propiedades a través de getters', () => {
    const money = new Money({ amount: 50.5, currency: 'EUR' });

    expect(money.amount).toBe(50.5);
    expect(money.currency).toBe('EUR');
  });
});
