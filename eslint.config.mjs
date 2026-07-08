import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['.next', 'out', 'build', 'next-env.d.ts'] },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: { version: '19.2' },
    },
    plugins: {
      'react-hooks': reactHooks,
      '@next/next': next,
    },
    rules: {
      // Next 특화 룰 — App Router 실수 차단(next/image 강제, sync script 금지 등)
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,

      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      eqeqeq: 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  eslintConfigPrettier,
);
