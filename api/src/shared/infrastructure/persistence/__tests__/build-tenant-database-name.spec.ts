import { describe, it, expect } from 'vitest';
import { buildTenantDatabaseName } from '../build-tenant-database-name';

/**
 * Tests unitarios para buildTenantDatabaseName().
 * Fuente de verdad para la convención de nombres de BD de tenant (ADR-002).
 */
describe('buildTenantDatabaseName', () => {
  it('should convert a standard UUID to the correct database name', () => {
    const tenantId = '2d6a5b40-61eb-4d69-8c4e-a5f39f53df90';
    const result = buildTenantDatabaseName(tenantId);

    expect(result).toBe('associated_2d6a5b40_61eb_4d69_8c4e_a5f39f53df90');
  });

  it('should replace all hyphens with underscores', () => {
    const tenantId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const result = buildTenantDatabaseName(tenantId);

    expect(result).toBe('associated_aaaaaaaa_bbbb_cccc_dddd_eeeeeeeeeeee');
  });

  it('should prefix with "associated_"', () => {
    const tenantId = '00000000-0000-0000-0000-000000000000';
    const result = buildTenantDatabaseName(tenantId);

    expect(result).toMatch(/^associated_/);
  });

  it('should be idempotent (same input produces same output)', () => {
    const tenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    const result1 = buildTenantDatabaseName(tenantId);
    const result2 = buildTenantDatabaseName(tenantId);

    expect(result1).toBe(result2);
  });

  it('should handle a tenantId that already has no hyphens', () => {
    const tenantId = 'abcdef1234567890abcdef1234567890';
    const result = buildTenantDatabaseName(tenantId);

    expect(result).toBe('associated_abcdef1234567890abcdef1234567890');
  });
});
