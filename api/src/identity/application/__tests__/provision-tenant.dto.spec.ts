import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProvisionTenantDto } from '../dtos/provision-tenant.dto';

describe('ProvisionTenantDto', () => {
  /** Crea una instancia válida del DTO para usar como base en los tests. */
  function createValidDto(): ProvisionTenantDto {
    return plainToInstance(ProvisionTenantDto, {
      name: 'Peña El Buen Gusto',
      collectivityType: 'PENA',
      cif: 'A28015550',
      contactEmail: 'contacto@pena.es',
      adminName: 'Juan García',
      adminEmail: 'admin@pena.es',
      adminPassword: 'SecurePass123',
    });
  }

  it('debería pasar la validación con datos válidos', async () => {
    const dto = createValidDto();
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('debería fallar la validación con nombre vacío', async () => {
    const dto = createValidDto();
    dto.name = '';
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError).toBeDefined();
  });

  it('debería fallar la validación con email de contacto inválido', async () => {
    const dto = createValidDto();
    dto.contactEmail = 'no-es-un-email';
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const emailError = errors.find((e) => e.property === 'contactEmail');
    expect(emailError).toBeDefined();
  });

  it('debería fallar la validación con email de admin inválido', async () => {
    const dto = createValidDto();
    dto.adminEmail = 'invalido';
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const emailError = errors.find((e) => e.property === 'adminEmail');
    expect(emailError).toBeDefined();
  });

  it('debería fallar la validación con password corto (menos de 8 caracteres)', async () => {
    const dto = createValidDto();
    dto.adminPassword = 'short';
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const passwordError = errors.find((e) => e.property === 'adminPassword');
    expect(passwordError).toBeDefined();
  });

  it('debería fallar la validación con collectivityType inválido', async () => {
    const dto = createValidDto();
    (dto as unknown as Record<string, unknown>).collectivityType = 'INVALID_TYPE';
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const typeError = errors.find((e) => e.property === 'collectivityType');
    expect(typeError).toBeDefined();
  });

  it('debería fallar la validación con CIF vacío', async () => {
    const dto = createValidDto();
    dto.cif = '';
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const cifError = errors.find((e) => e.property === 'cif');
    expect(cifError).toBeDefined();
  });

  it('debería fallar la validación con adminName vacío', async () => {
    const dto = createValidDto();
    dto.adminName = '';
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find((e) => e.property === 'adminName');
    expect(nameError).toBeDefined();
  });

  it('debería aceptar todos los tipos de colectividad válidos', async () => {
    const validTypes = ['PENA', 'COFRADIA', 'CLUB_DEPORTIVO', 'ASOCIACION_CULTURAL'];

    for (const type of validTypes) {
      const dto = createValidDto();
      (dto as unknown as Record<string, unknown>).collectivityType = type;
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    }
  });
});
