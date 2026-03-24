/**
 * Parsea permisos desde un valor arbitrario (Prisma Json) a string[].
 * Maneja: arrays nativos, strings JSON (doble serialización), y fallback a [].
 *
 * @param raw - Valor de tipo unknown proveniente de un campo Prisma Json.
 * @returns Array de strings con los permisos válidos.
 */
export function parsePermissions(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string');
  }

  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      // Si no es JSON válido, no hay permisos recuperables
    }
  }

  return [];
}
