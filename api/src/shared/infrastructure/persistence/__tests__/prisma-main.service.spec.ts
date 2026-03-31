import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaMainService } from '../prisma-main.service';

// Mock del adapter y PrismaClient de main
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@prisma-main', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi
      .fn()
      .mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({ mock: 'tx-client' })),
  })),
}));

describe('PrismaMainService', () => {
  let service: PrismaMainService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DATABASE_MAIN_URL = 'postgresql://user:pass@localhost:5432/main';
    service = new PrismaMainService();
  });

  describe('$transaction', () => {
    it('deberia delegar $transaction al cliente Prisma subyacente', async () => {
      // Arrange: función que usa el tx client
      const fn = vi.fn().mockResolvedValue('resultado');

      // Act
      const result = await service.$transaction(fn);

      // Assert: la función recibió el tx client y devolvió el resultado
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith({ mock: 'tx-client' });
      expect(result).toBe('resultado');
    });

    it('deberia propagar el valor retornado por el callback', async () => {
      const expectedResult = { id: 'abc', status: 'processed' };
      const fn = vi.fn().mockResolvedValue(expectedResult);

      const result = await service.$transaction(fn);

      expect(result).toEqual(expectedResult);
    });

    it('deberia propagar errores lanzados dentro del callback', async () => {
      const error = new Error('DB error simulado');
      const fn = vi.fn().mockRejectedValue(error);

      await expect(service.$transaction(fn)).rejects.toThrow('DB error simulado');
    });
  });
});
