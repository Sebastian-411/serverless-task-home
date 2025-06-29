import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import prettier from 'eslint-config-prettier';

const importPlugin = await import('eslint-plugin-import');

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  tseslint.configs.strict,
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      'lib/generated/**/*',
      'node_modules/**/*',
      'dist/**/*',
      'build/**/*',
      'coverage/**/*',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 2020,
      },
      globals: {
        // Node.js globals
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        // Vercel globals
        VercelRequest: 'readonly',
        VercelResponse: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin.default,
    },
    rules: {
      // Buenas prácticas generales
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['error', 'always'],
      'import/order': ['warn', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always'
      }],
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-extraneous-class': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-invalid-void-type': 'warn',
      // Hexagonal: No imports cruzados entre capas
      'import/no-cycle': 'warn',
      // Prettier
      ...prettier.rules,
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
  // Configuración específica para tests
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Permitir console en tests
      '@typescript-eslint/no-explicit-any': 'off', // Permitir any en tests para mocks
      '@typescript-eslint/no-require-imports': 'off', // Permitir require en tests
      '@typescript-eslint/no-unused-vars': 'off', // Variables no usadas en tests
    },
  },
  // Configuración específica para mocks
  {
    files: ['**/mocks/**/*.ts', '**/*.mock.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Configuración específica para archivos de configuración
  {
    files: ['**/setup.ts', '**/seed.ts', '**/config/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-namespace': 'off',
    },
  },
]);
