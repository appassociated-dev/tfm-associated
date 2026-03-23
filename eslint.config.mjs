// Configuración ESLint 9+ (flat config) para el monorepo Associated
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Patrones ignorados globalmente
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', '**/.prisma/**'],
  },

  // Configuración base para todos los archivos TypeScript
  ...tseslint.configs.recommended,

  // Reglas personalizadas del proyecto
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Advertencias en vez de errores para desarrollo progresivo
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // R7: Detectar casteos inseguros sobre campos Prisma Json.
      // Los campos Json de Prisma devuelven `Prisma.JsonValue` (unknown en runtime).
      // Castear directamente con `as string[]`, `as number[]` o `as Record<...>` omite
      // la validación en runtime y puede fallar silenciosamente si la BD contiene un
      // valor inesperado (ej: string serializado en vez de array por doble serialización).
      // Patrón correcto: validar con Array.isArray() / typeof antes de usar el valor,
      // o usar un helper como parsePermissions() que maneje defensivamente ambos casos.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSAsExpression[typeAnnotation.typeName.name="Array"]',
          message:
            'Casteo inseguro sobre campo Prisma Json. Usar validación en runtime (Array.isArray, typeof) en vez de "as Type[]". Ver permissions.guard.ts parsePermissions() como referencia.',
        },
        {
          selector:
            'TSAsExpression[typeAnnotation.elementType.type="TSStringKeyword"]',
          message:
            'Casteo "as string[]" inseguro sobre campo Prisma Json. Usar validación en runtime en vez de cast directo.',
        },
        {
          selector:
            'TSAsExpression[typeAnnotation.elementType.type="TSNumberKeyword"]',
          message:
            'Casteo "as number[]" inseguro sobre campo Prisma Json. Usar validación en runtime en vez de cast directo.',
        },
      ],
    },
  },

  // Relajar regla de casteos inseguros en archivos de test — los tests pueden
  // necesitar casteos para acceder a datos Prisma en aserciones.
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts', '**/*integration-spec.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
);
