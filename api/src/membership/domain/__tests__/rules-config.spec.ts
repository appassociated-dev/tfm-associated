import { describe, it, expect } from 'vitest';
import { RulesConfig } from '../value-objects/rules-config';
import { CollectivityType } from '../.././../identity/domain/value-objects/collectivity-type';

describe('RulesConfig', () => {
  // --- Creación válida ---

  it('debería crear un RulesConfig con objeto de configuración válido', () => {
    const config = { maxMembers: 100, allowGuests: true };
    const collectivityType = CollectivityType.pena();
    const result = RulesConfig.create(config, collectivityType);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getRaw()).toEqual(config);
    }
  });

  it('debería crear un RulesConfig con objeto vacío', () => {
    const config = {};
    const collectivityType = CollectivityType.clubDeportivo();
    const result = RulesConfig.create(config, collectivityType);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getRaw()).toEqual({});
    }
  });

  it('debería aceptar configuraciones complejas anidadas', () => {
    const config = {
      fees: { annual: 50, inscription: 20 },
      restrictions: { maxAge: 65 },
    };
    const collectivityType = CollectivityType.cofradia();
    const result = RulesConfig.create(config, collectivityType);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.getRaw()).toEqual(config);
    }
  });

  // --- Creación inválida ---

  it('debería rechazar null como configuración', () => {
    const collectivityType = CollectivityType.pena();
    const result = RulesConfig.create(null as unknown as object, collectivityType);

    expect(result.ok).toBe(false);
  });

  it('debería rechazar undefined como configuración', () => {
    const collectivityType = CollectivityType.pena();
    const result = RulesConfig.create(undefined as unknown as object, collectivityType);

    expect(result.ok).toBe(false);
  });

  // --- Inmutabilidad ---

  it('debería devolver una copia del raw config, no la referencia original', () => {
    const config = { maxMembers: 100 };
    const collectivityType = CollectivityType.pena();
    const result = RulesConfig.create(config, collectivityType);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const raw = result.value.getRaw();
      (raw as Record<string, unknown>).maxMembers = 999;
      expect(result.value.getRaw()).toEqual({ maxMembers: 100 });
    }
  });

  // --- Igualdad ---

  it('debería ser igual a otro RulesConfig con la misma configuración', () => {
    const config = { maxMembers: 100 };
    const collectivityType = CollectivityType.pena();
    const result1 = RulesConfig.create(config, collectivityType);
    const result2 = RulesConfig.create(config, collectivityType);

    expect(result1.ok && result2.ok).toBe(true);
    if (result1.ok && result2.ok) {
      expect(result1.value.equals(result2.value)).toBe(true);
    }
  });
});
