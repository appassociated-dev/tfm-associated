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
    },
  },
);
