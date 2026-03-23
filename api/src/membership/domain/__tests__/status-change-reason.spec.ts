import { describe, it, expect } from 'vitest';
import { StatusChangeReason } from '../value-objects/status-change-reason';

describe('StatusChangeReason', () => {
  // --- Creación válida ---

  it('debería crear un StatusChangeReason con un motivo válido', () => {
    const result = StatusChangeReason.create('Impago de cuota trimestral');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('Impago de cuota trimestral');
    }
  });

  it('debería aceptar un motivo con exactamente 3 caracteres', () => {
    const result = StatusChangeReason.create('abc');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe('abc');
    }
  });

  it('debería aceptar un motivo con exactamente 500 caracteres', () => {
    const reason = 'a'.repeat(500);
    const result = StatusChangeReason.create(reason);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe(reason);
    }
  });

  // --- Validación de invariantes ---

  it('debería rechazar un motivo vacío', () => {
    const result = StatusChangeReason.create('');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MEMBER.INVALID_REASON');
    }
  });

  it('debería rechazar un motivo con solo espacios', () => {
    const result = StatusChangeReason.create('   ');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MEMBER.INVALID_REASON');
    }
  });

  it('debería rechazar un motivo con menos de 3 caracteres', () => {
    const result = StatusChangeReason.create('ab');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MEMBER.INVALID_REASON');
    }
  });

  it('debería rechazar un motivo con más de 500 caracteres', () => {
    const reason = 'a'.repeat(501);
    const result = StatusChangeReason.create(reason);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MEMBER.INVALID_REASON');
    }
  });

  // --- Igualdad ---

  it('debería ser igual a otro StatusChangeReason con el mismo valor', () => {
    const r1 = StatusChangeReason.create('Motivo de prueba');
    const r2 = StatusChangeReason.create('Motivo de prueba');

    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      expect(r1.value.equals(r2.value)).toBe(true);
    }
  });
});
