import { describe, it, expect } from 'vitest';
import { CifAlreadyExistsError } from '../exceptions/cif-already-exists.error';
import { TenantProvisioningFailedError } from '../exceptions/tenant-provisioning-failed.error';
import { InvalidTenantDataError } from '../exceptions/invalid-tenant-data.error';

describe('Domain Exceptions', () => {
  // --- CifAlreadyExistsError ---

  describe('CifAlreadyExistsError', () => {
    it('debería crear el error con el formato de mensaje correcto', () => {
      const error = new CifAlreadyExistsError('A28015550');

      expect(error.message).toBe("Tenant with CIF 'A28015550' already exists");
    });

    it('debería tener el código correcto', () => {
      const error = new CifAlreadyExistsError('A28015550');

      expect(error.code).toBe('TENANT.CIF_ALREADY_EXISTS');
    });

    it('debería ser una instancia de Error', () => {
      const error = new CifAlreadyExistsError('A28015550');

      expect(error).toBeInstanceOf(Error);
    });

    it('debería tener el nombre correcto', () => {
      const error = new CifAlreadyExistsError('A28015550');

      expect(error.name).toBe('CifAlreadyExistsError');
    });
  });

  // --- TenantProvisioningFailedError ---

  describe('TenantProvisioningFailedError', () => {
    it('debería crear el error con el formato de mensaje correcto', () => {
      const cause = new Error('Connection refused');
      const error = new TenantProvisioningFailedError('createDatabase', cause);

      expect(error.message).toBe(
        "Tenant provisioning failed at step 'createDatabase': Connection refused",
      );
    });

    it('debería tener el código correcto', () => {
      const cause = new Error('timeout');
      const error = new TenantProvisioningFailedError('runMigrations', cause);

      expect(error.code).toBe('TENANT.PROVISIONING_FAILED');
    });

    it('debería almacenar step y cause como propiedades', () => {
      const cause = new Error('disk full');
      const error = new TenantProvisioningFailedError('seedRoles', cause);

      expect(error.step).toBe('seedRoles');
      expect(error.cause).toBe(cause);
    });

    it('debería ser una instancia de Error', () => {
      const cause = new Error('fail');
      const error = new TenantProvisioningFailedError('step', cause);

      expect(error).toBeInstanceOf(Error);
    });

    it('debería tener el nombre correcto', () => {
      const cause = new Error('fail');
      const error = new TenantProvisioningFailedError('step', cause);

      expect(error.name).toBe('TenantProvisioningFailedError');
    });
  });

  // --- InvalidTenantDataError ---

  describe('InvalidTenantDataError', () => {
    it('debería crear el error con el formato de mensaje correcto', () => {
      const error = new InvalidTenantDataError('cif', 'must be a valid Spanish CIF');

      expect(error.message).toBe('Invalid tenant data: cif — must be a valid Spanish CIF');
    });

    it('debería tener el código correcto', () => {
      const error = new InvalidTenantDataError('name', 'cannot be empty');

      expect(error.code).toBe('TENANT.INVALID_DATA');
    });

    it('debería ser una instancia de Error', () => {
      const error = new InvalidTenantDataError('field', 'reason');

      expect(error).toBeInstanceOf(Error);
    });

    it('debería tener el nombre correcto', () => {
      const error = new InvalidTenantDataError('field', 'reason');

      expect(error.name).toBe('InvalidTenantDataError');
    });
  });
});
