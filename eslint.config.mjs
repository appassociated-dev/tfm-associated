// Configuración ESLint 9 flat config — cubre api/ y web/ workspaces
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Patrones globales ignorados
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/generated/**',
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // TypeScript — reglas base para ambos workspaces
  // ────────────────────────────────────────────────────────────────
  {
    files: ['api/src/**/*.ts', 'web/src/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Reglas recomendadas de typescript-eslint
      ...tsPlugin.configs.recommended.rules,

      // Variables no usadas — ignorar prefijo _ por convención
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Evitar any explícito (warning, no error — NestJS usa decoradores)
      '@typescript-eslint/no-explicit-any': 'warn',

      // No requerir tipo de retorno explícito — demasiado verboso con CQRS
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Importaciones de tipo consistentes
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // General
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // ────────────────────────────────────────────────────────────────
  // NestJS (api/) — reglas permisivas para decoradores y clases
  // ────────────────────────────────────────────────────────────────
  {
    files: ['api/src/**/*.ts'],
    rules: {
      // Los decoradores NestJS a menudo necesitan constructores con parámetros no usados
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // NestJS usa interfaces para DI — permitir interfaces vacías
      '@typescript-eslint/no-empty-interface': 'off',
      // Decoradores pueden necesitar empty functions
      '@typescript-eslint/no-empty-function': 'off',
      // Clases NestJS requieren constructor-injection — no forzar uso
      '@typescript-eslint/no-useless-constructor': 'off',
    },
  },

  // ────────────────────────────────────────────────────────────────
  // React (web/) — reglas de React y React Hooks
  // ────────────────────────────────────────────────────────────────
  {
    files: ['web/src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Reglas de React recomendadas
      ...reactPlugin.configs.recommended.rules,

      // React 17+ JSX transform — no necesita import React
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // TypeScript ya valida props — no necesitamos PropTypes
      'react/prop-types': 'off',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Buenas prácticas JSX
      'react/self-closing-comp': 'error',
      'react/jsx-no-target-blank': 'error',
    },
  },

  // ────────────────────────────────────────────────────────────────
  // Tests — reglas más relajadas
  // ────────────────────────────────────────────────────────────────
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
